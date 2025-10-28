import './utils/websocket-polyfill.js'
import cron, { ScheduledTask } from 'node-cron'
import { loadConfig } from './config/index.js'
import { DatabaseService } from './services/database.js'
import { TwitterService } from './services/twitter.js'
import { NostrService } from './services/nostr.js'
import { Tweet } from './types/index.js'

class TwitterToNostrBot {
  private config: ReturnType<typeof loadConfig>
  private database: DatabaseService
  private twitter: TwitterService
  private nostr: NostrService
  private cronJob: ScheduledTask | null = null

  constructor() {
    this.config = loadConfig()
    this.database = new DatabaseService(this.config.database.path)
    this.twitter = new TwitterService(this.config.twitter.bearerToken, this.database)
    this.nostr = new NostrService(this.config.nostr.privateKey, this.config.nostr.relays, this.config.display.showTweetUrl)
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Twitter to Nostr Bot...')
    
    // Verify Twitter credentials
    const twitterValid = await this.twitter.verifyCredentials(this.config.twitter.username)
    if (!twitterValid) {
      throw new Error('Invalid Twitter API credentials')
    }
    console.log('✅ Twitter API credentials verified')

    // Check if this is the first run
    const startDate = await this.database.getStartDate()
    if (!startDate) {
      const now = new Date().toISOString()
      await this.database.setStartDate(now)
      console.log(`📅 First run detected. Start date set to: ${now}`)
    } else {
      console.log(`📅 Bot started. Monitoring tweets since: ${startDate}`)
    }

    console.log(`👤 Monitoring Twitter account: @${this.config.twitter.username}`)
  }

  async processTweets(): Promise<void> {
    try {
      console.log('🔍 Checking for new tweets...')
      
      const startDate = await this.database.getStartDate()
      if (!startDate) {
        console.log('❌ No start date found. Skipping this run.')
        return
      }

      const tweets = await this.twitter.getRecentTweets(
        this.config.twitter.username,
        startDate
      )

      if (tweets.length === 0) {
        console.log('📭 No new tweets found')
        return
      }

      console.log(`📬 Found ${tweets.length} new tweets`)

      // Process tweets in reverse chronological order (oldest first)
      const sortedTweets = tweets.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      const results = await Promise.all(sortedTweets.map(async (tweet) => {
        return await this.processTweet(tweet);
      }));

      if(results.every(p => !p)){
        console.log('❌ No tweets were posted, updating start date to now');
        await this.database.updateStartDateToNow()
      }
    } catch (error) {
      console.error('❌ Error processing tweets:', error)
    }
  }

  private async processTweet(tweet: Tweet): Promise<boolean> {
    try {
      // Check if tweet was already posted
      const alreadyPosted = await this.database.isTweetPosted(tweet.id)
      if (alreadyPosted) {
        console.log(`⏭️  Tweet ${tweet.id} already posted, skipping`)
        return false;
      }

      console.log(`📝 Processing tweet: ${tweet.id}`)
      console.log(`   Text: ${tweet.text.substring(0, 100)}...`)
      console.log(tweet);
      
      // Publish to Nostr with retry logic
      const success = await this.nostr.publishNote(tweet)
      
      if (success) {
        // Save to database
        await this.database.saveTweet(tweet)
        // Update start date to current time to avoid reprocessing this tweet
        await this.database.updateStartDateToNow();
        console.log(`✅ Successfully posted tweet ${tweet.id} to Nostr`)
        return true;
      } else {
        console.log(`❌ Failed to post tweet ${tweet.id} to Nostr after retries`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error processing tweet ${tweet.id}:`, error)
      return false;
    }
  }

  async start(): Promise<void> {
    console.log(`⏰ Starting cron job with schedule: ${this.config.cron.schedule}`)
    
    this.cronJob = cron.schedule(this.config.cron.schedule, async () => {
      await this.processTweets()
    })
    this.processTweets();
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      console.log('⏹️  Cron job stopped')
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down bot...')
    this.stop()
    await this.database.close();
    console.log('👋 Bot shutdown complete')
  }
}

// Main execution
async function main() {
  const bot = new TwitterToNostrBot()

  try {
    await bot.initialize()
    bot.start()

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...')
      await bot.shutdown()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
      await bot.shutdown()
      process.exit(0)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason)
      console.error('Promise:', promise)
      // Don't exit the process, just log the error
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error)
      process.exit(1)
    })

  } catch (error) {
    console.error('💥 Failed to start bot:', error)
    process.exit(1)
  }
}

// Start the bot
main().catch((error) => {
  console.error('💥 Main function failed:', error)
  process.exit(1)
})
