export interface Tweet {
  id: string
  text: string
  created_at: string
  url: string
  media_urls?: string[]
  hashtags?: string[]
  links?: string[]
}

export interface DatabasePost {
  id: number
  tweet_id: string
  tweet_url: string
  posted_at: string
  created_at: string
}

export interface AppState {
  key: string
  value: string
}

export interface Config {
  twitter: {
    bearerToken: string
    username: string
  }
  nostr: {
    privateKey: string
    relays: string[]
  }
  cron: {
    schedule: string
  }
  database: {
    path: string
  }
  display: {
    showTweetUrl: boolean
  }
}

export interface NostrEvent {
  kind: number
  content: string
  tags: string[][]
  created_at: number
  pubkey: string
  id: string
  sig: string
}

export interface RateLimit {
  endpoint: string
  reset_at: number
  updated_at: string
}
