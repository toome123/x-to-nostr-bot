import { config } from 'dotenv'
import { Config } from '../types/index.js'

// Load environment variables
config()

const defaultRelays = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol'
]

export function loadConfig(): Config {
  const twitterBearerToken = process.env.TWITTER_BEARER_TOKEN
  const twitterUsername = process.env.TWITTER_USERNAME
  const nostrPrivateKey = process.env.NOSTR_PRIVATE_KEY
  const nostrRelays = process.env.NOSTR_RELAYS
  const cronSchedule = process.env.CRON_SCHEDULE || '*/10 * * * *'
  const dbPath = process.env.DB_PATH || './db/bot.db'
  const showTweetUrl = process.env.SHOW_TWEET_URL !== 'false' || true

  if (!twitterBearerToken) {
    throw new Error('TWITTER_BEARER_TOKEN is required')
  }
  if (!twitterUsername) {
    throw new Error('TWITTER_USERNAME is required')
  }
  if (!nostrPrivateKey) {
    throw new Error('NOSTR_PRIVATE_KEY is required')
  }

  const customRelays = nostrRelays ? nostrRelays.split(',').map(r => r.trim()) : []
  const allRelays = [...defaultRelays, ...customRelays]

  return {
    twitter: {
      bearerToken: twitterBearerToken,
      username: twitterUsername
    },
    nostr: {
      privateKey: nostrPrivateKey,
      relays: allRelays
    },
    cron: {
      schedule: cronSchedule
    },
    database: {
      path: dbPath
    },
    display: {
      showTweetUrl
    }
  }
}
