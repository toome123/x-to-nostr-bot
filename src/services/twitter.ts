import { Tweet } from '../types/index.js'
import { DatabaseService } from './database.js'

interface TwitterUser {
  id: string
  name: string
  username: string
}

interface TwitterTweet {
  id: string
  text: string
  created_at: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  attachments?: {
    media_keys: string[]
  }
}

interface TwitterMedia {
  media_key: string
  type: string
  url?: string
}

interface TwitterResponse<T> {
  data?: T
  includes?: {
    media?: TwitterMedia[]
  }
  meta?: {
    result_count: number
    next_token?: string
  }
  errors?: Array<{
    message: string
  }>
}

export class TwitterService {
  private bearerToken: string
  private database: DatabaseService
  private baseUrl = 'https://api.twitter.com/2'

  constructor(bearerToken: string, database: DatabaseService) {
    this.bearerToken = bearerToken
    this.database = database
  }

  private async getUserId(username: string): Promise<string> {
    // Check if we have the user ID cached
    const cachedUserId = await this.database.getTwitterUserId(username)
    if (cachedUserId) {
      return cachedUserId
    }

    // Check rate limit before making request
    await this.checkAndWaitForRateLimit('users/by/username')

    // Fetch from API
    const url = `${this.baseUrl}/users/by/username/${username}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
      }
    })

    if (!response.ok) {
      // Handle 429 rate limit error
      if (response.status === 429) {
        const resetAt = this.extractRateLimitReset(response)
        if (resetAt) {
          await this.database.saveRateLimitReset('users/by/username', resetAt)
          console.log(`⏳ Rate limit exceeded for users/by/username. Reset at: ${new Date(resetAt * 1000).toISOString()}`)
        }
      }
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`)
    }

    // Extract and save rate limit info
    const resetAt = this.extractRateLimitReset(response)
    if (resetAt) {
      await this.database.saveRateLimitReset('users/by/username', resetAt)
    }

    const data = await response.json() as TwitterResponse<TwitterUser>
    
    if (!data.data) {
      throw new Error(`User ${username} not found`)
    }

    // Cache the user ID
    await this.database.setTwitterUserId(username, data.data.id)
    
    return data.data.id
  }

  async getRecentTweets(username: string, sinceDate: string): Promise<Tweet[]> {
    try {
      // Get the user ID (from cache or API)
      const userId = await this.getUserId(username)

      // Check rate limit before making request
      await this.checkAndWaitForRateLimit('users/tweets')

      // Build query parameters
      const params = new URLSearchParams({
        'tweet.fields': 'created_at,public_metrics,attachments',
        'media.fields': 'url,type',
        'expansions': 'attachments.media_keys',
        'start_time': sinceDate,
        'max_results': '100',
        'exclude': 'replies'  // Allow original tweets, quotes, and retweets
      })

      // Fetch tweets from the user
      const url = `${this.baseUrl}/users/${userId}/tweets?${params.toString()}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        }
      })

      if (!response.ok) {
        // Handle 429 rate limit error
        if (response.status === 429) {
          const resetAt = this.extractRateLimitReset(response)
          if (resetAt) {
            await this.database.saveRateLimitReset('users/tweets', resetAt)
            console.log(`⏳ Rate limit exceeded for users/tweets. Reset at: ${new Date(resetAt * 1000).toISOString()}`)
          }
        }
        throw new Error(`Failed to fetch tweets: ${response.status} ${response.statusText}`)
      }

      // Extract and save rate limit info
      const resetAt = this.extractRateLimitReset(response)
      if (resetAt) {
        await this.database.saveRateLimitReset('users/tweets', resetAt)
      }

      const data = await response.json() as TwitterResponse<TwitterTweet[]>

      const tweetsData = data.data || []
      const mediaData = data.includes?.media || []

      return tweetsData.map(tweet => {
        const media = mediaData.filter(m => 
          tweet.attachments?.media_keys?.includes(m.media_key)
        )

        // Extract hashtags and mentions from text
        const hashtags = this.extractHashtags(tweet.text)
        const mentions = this.extractMentions(tweet.text)
        const links = this.extractLinks(tweet.text)

        return {
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.created_at,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          media_urls: media
            .filter(m => m.type === 'photo')
            .map(m => m.url!),
          hashtags,
          mentions,
          links
        }
      })
    } catch (error) {
      console.error('Error fetching tweets:', error)
      throw error
    }
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g
    return text.match(hashtagRegex) || []
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@[\w]+/g
    return text.match(mentionRegex) || []
  }

  private extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g
    return text.match(urlRegex) || []
  }

  private extractRateLimitReset(response: Response): number | null {
    const resetHeader = response.headers.get('x-rate-limit-reset')
    if (!resetHeader) {
      return null
    }
    
    const resetAt = parseInt(resetHeader, 10)
    return isNaN(resetAt) ? null : resetAt
  }

  private async checkAndWaitForRateLimit(endpoint: string): Promise<void> {
    const canMakeRequest = await this.database.canMakeRequest(endpoint)
    
    if (!canMakeRequest) {
      const resetAt = await this.database.getRateLimitReset(endpoint)
      if (resetAt) {
        const currentTime = Math.floor(Date.now() / 1000)
        const waitTime = resetAt - currentTime
        
        if (waitTime > 0) {
          console.log(`⏳ Rate limit reached for ${endpoint}. Waiting ${waitTime} seconds until reset...`)
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
        }
      }
    }
  }

  async verifyCredentials(username: string): Promise<boolean> {
    try {
      // Verify by fetching user info (works with Bearer token)
      await this.getUserId(username)
      return true
    } catch (error) {
      console.error('Twitter API credentials verification failed:', error)
      return false
    }
  }
}
