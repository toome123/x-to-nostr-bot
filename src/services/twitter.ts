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
      // // Get the user ID (from cache or API)
      // const userId = await this.getUserId(username)

      // // Check rate limit before making request
      // await this.checkAndWaitForRateLimit('users/tweets')

      // // Build query parameters
      // const params = new URLSearchParams({
      //   'tweet.fields': 'created_at,public_metrics,attachments',
      //   'media.fields': 'url,type',
      //   'expansions': 'attachments.media_keys',
      //   'start_time': sinceDate,
      //   'max_results': '100',
      //   'exclude': 'replies,retweets'  // Only get original tweets
      // })

      // // Fetch tweets from the user
      // const url = `${this.baseUrl}/users/${userId}/tweets?${params.toString()}`
      // const response = await fetch(url, {
      //   headers: {
      //     'Authorization': `Bearer ${this.bearerToken}`,
      //   }
      // })

      // if (!response.ok) {
      //   // Handle 429 rate limit error
      //   if (response.status === 429) {
      //     const resetAt = this.extractRateLimitReset(response)
      //     if (resetAt) {
      //       await this.database.saveRateLimitReset('users/tweets', resetAt)
      //       console.log(`⏳ Rate limit exceeded for users/tweets. Reset at: ${new Date(resetAt * 1000).toISOString()}`)
      //     }
      //   }
      //   throw new Error(`Failed to fetch tweets: ${response.status} ${response.statusText}`)
      // }

      // // Extract and save rate limit info
      // const resetAt = this.extractRateLimitReset(response)
      // if (resetAt) {
      //   await this.database.saveRateLimitReset('users/tweets', resetAt)
      // }

      // const data = await response.json() as TwitterResponse<TwitterTweet[]>
const data = {
  "data": [
    {
      "edit_history_tweet_ids": [
        "1982153643512959441"
      ],
      "id": "1982153643512959441",
      "text": "Love this https://t.co/DICOVpZmAS",
      "created_at": "2025-10-25T18:33:49.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 26
      }
    },
    {
      "edit_history_tweet_ids": [
        "1982045360643080372"
      ],
      "id": "1982045360643080372",
      "text": "https://t.co/xHUI3xbTY7",
      "attachments": {
        "media_keys": [
          "3_1982045358319357953"
        ]
      },
      "created_at": "2025-10-25T11:23:33.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 8
      }
    },
    {
      "edit_history_tweet_ids": [
        "1982044348523893049"
      ],
      "id": "1982044348523893049",
      "text": "Everything will be priced in Bitcoin. Even a bitcoin 🤣 because 1 bitcoin  = 1 bitcoin https://t.co/2zGrG3KTWF",
      "created_at": "2025-10-25T11:19:31.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 30
      }
    },
    {
      "edit_history_tweet_ids": [
        "1982029057609924881"
      ],
      "id": "1982029057609924881",
      "text": "Cool! Thanks for contribution to open source! https://t.co/5qXpKeZlDO",
      "created_at": "2025-10-25T10:18:46.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 23
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981970575670075691"
      ],
      "id": "1981970575670075691",
      "text": "Wow https://t.co/kixpJnZkhL",
      "created_at": "2025-10-25T06:26:23.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 29
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981683426018410517"
      ],
      "id": "1981683426018410517",
      "text": "You can't destroy Satoshi's idea, you can destroy the physical stuff related to Bitcoin. But most importantly, Bitcoin is in the truth in cyberspace that will emerge in the physical world again and again. https://t.co/loGgP6sd5b",
      "attachments": {
        "media_keys": [
          "7_1981683395596845056"
        ]
      },
      "created_at": "2025-10-24T11:25:21.000Z",
      "public_metrics": {
        "retweet_count": 5,
        "reply_count": 0,
        "like_count": 31,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 1561
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981642768213758019"
      ],
      "id": "1981642768213758019",
      "text": "Monetization matters for creators, but identity matters more. On centralized platforms, you don’t own your account—they do, earning from your work. On Nostr, you own your identity and choose who can use it. https://t.co/Y0JuBhZeDk",
      "created_at": "2025-10-24T08:43:47.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 47
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981624939955339754"
      ],
      "id": "1981624939955339754",
      "text": "Jumper wires for sure 👌 😅 https://t.co/WbjRdQ1x99",
      "created_at": "2025-10-24T07:32:57.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 32
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981610392313880978"
      ],
      "id": "1981610392313880978",
      "text": "That is the beauty of this system. Not only a few people with power can benefit, but everyone, regardless of age, race, and gender, can benefit. The only thing that is needed is PoW. https://t.co/3BkWVDMTCd",
      "created_at": "2025-10-24T06:35:08.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 2,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 122
      }
    },
    {
      "edit_history_tweet_ids": [
        "1981446077698973986"
      ],
      "id": "1981446077698973986",
      "text": "Just launched my first #nostr app! 🚀 It clones your posts from X to Nostr.\nIt’s a simple tool, but something I'm proud of making with my crazy schedule. I believe in using Nostr directly, but this helps bridge the content gap for now. Hope you like it!\nhttps://t.co/XsdYw46hAT",
      "created_at": "2025-10-23T19:42:13.000Z",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0,
        "impression_count": 26
      }
    }
  ],
  "includes": {
    "media": [
      {
        "media_key": "3_1982045358319357953",
        "type": "photo",
        "url": "https://pbs.twimg.com/media/G4GjwIdWUAE95by.jpg"
      },
      {
        "media_key": "7_1981683395596845056",
        "type": "video"
      }
    ]
  },
  "meta": {
    "result_count": 10,
    "newest_id": "1982153643512959441",
    "oldest_id": "1981446077698973986"
  }
}

      const tweetsData = data.data || []
      const mediaData = data.includes?.media || []

      return tweetsData.map(tweet => {
        const media = mediaData.filter(m => 
          tweet.attachments?.media_keys?.includes(m.media_key)
        )

        // Extract hashtags and mentions from text
        const hashtags = this.extractHashtags(tweet.text)
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
