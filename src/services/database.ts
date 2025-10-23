import Database from 'better-sqlite3'
import { DatabasePost, AppState } from '../types/index.js'
import { ensureDir } from 'fs-extra'
import { dirname } from 'path'

export class DatabaseService {
  private db: Database.Database

  constructor(dbPath: string) {
    // Ensure directory exists
    ensureDir(dirname(dbPath))
    
    this.db = new Database(dbPath)
    this.initializeTables()
  }

  private initializeTables(): void {
    // Create posts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tweet_id TEXT UNIQUE NOT NULL,
        tweet_url TEXT NOT NULL,
        posted_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)

    // Create app_state table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)

    // Create twitter_users table for caching user IDs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS twitter_users (
        username TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        cached_at TEXT NOT NULL
      )
    `)

    // Create rate_limits table for tracking API rate limits
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        endpoint TEXT PRIMARY KEY,
        reset_at INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_tweet_id ON posts(tweet_id)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)
    `)
  }

  async saveTweetId(tweetId: string, tweetUrl: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO posts (tweet_id, tweet_url, posted_at, created_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `)
    
    stmt.run(tweetId, tweetUrl)
  }

  async isTweetPosted(tweetId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM posts WHERE tweet_id = ? LIMIT 1
    `)
    
    const result = stmt.get(tweetId)
    return !!result
  }

  async getStartDate(): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT value FROM app_state WHERE key = 'start_date'
    `)
    
    const result = stmt.get() as AppState | undefined
    return result?.value || null
  }

  async setStartDate(date: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_state (key, value) VALUES ('start_date', ?)
    `)
    
    stmt.run(date)
  }

  async updateStartDateToNow(): Promise<void> {
    const now = new Date().toISOString()
    await this.setStartDate(now)
  }

  async getPostedTweets(limit: number = 100): Promise<DatabasePost[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      ORDER BY created_at DESC 
      LIMIT ?
    `)
    
    return stmt.all(limit) as DatabasePost[]
  }

  async getTwitterUserId(username: string): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT user_id FROM twitter_users WHERE username = ?
    `)
    
    const result = stmt.get(username) as { user_id: string } | undefined
    return result?.user_id || null
  }

  async setTwitterUserId(username: string, userId: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO twitter_users (username, user_id, cached_at)
      VALUES (?, ?, datetime('now'))
    `)
    
    stmt.run(username, userId)
  }

  async saveRateLimitReset(endpoint: string, resetAt: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rate_limits (endpoint, reset_at, updated_at)
      VALUES (?, ?, datetime('now'))
    `)
    
    stmt.run(endpoint, resetAt)
  }

  async getRateLimitReset(endpoint: string): Promise<number | null> {
    const stmt = this.db.prepare(`
      SELECT reset_at FROM rate_limits WHERE endpoint = ?
    `)
    
    const result = stmt.get(endpoint) as { reset_at: number } | undefined
    return result?.reset_at || null
  }

  async canMakeRequest(endpoint: string): Promise<boolean> {
    const resetAt = await this.getRateLimitReset(endpoint)
    if (!resetAt) {
      return true // No rate limit stored, can make request
    }
    
    const currentTime = Math.floor(Date.now() / 1000) // Current Unix timestamp
    return currentTime >= resetAt
  }

  async close(): Promise<void> {
    this.db.close()
  }
}
