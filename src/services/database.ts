import { PrismaService } from './prisma.js'
import { DatabasePost, AppState, Tweet } from '../types/index.js'

export class DatabaseService {
  private prismaService: PrismaService

  constructor(dbPath: string) {
    // Note: dbPath is kept for compatibility but Prisma uses DATABASE_URL from .env
    this.prismaService = new PrismaService()
  }

  async saveTweet(tweet: Tweet): Promise<void> {
    return this.prismaService.saveTweet(tweet)
  }

  async isTweetPosted(tweetId: string): Promise<boolean> {
    return this.prismaService.isTweetPosted(tweetId)
  }

  async getStartDate(): Promise<string | null> {
    return this.prismaService.getStartDate()
  }

  async setStartDate(date: string): Promise<void> {
    return this.prismaService.setStartDate(date)
  }

  async updateStartDateToNow(): Promise<void> {
    return this.prismaService.updateStartDateToNow()
  }

  async getPostedTweets(limit: number = 100): Promise<DatabasePost[]> {
    return this.prismaService.getPostedTweets(limit)
  }

  async getTwitterUserId(username: string): Promise<string | null> {
    return this.prismaService.getTwitterUserId(username)
  }

  async setTwitterUserId(username: string, userId: string): Promise<void> {
    return this.prismaService.setTwitterUserId(username, userId)
  }

  async saveRateLimitReset(endpoint: string, resetAt: number): Promise<void> {
    return this.prismaService.saveRateLimitReset(endpoint, resetAt)
  }

  async getRateLimitReset(endpoint: string): Promise<number | null> {
    return this.prismaService.getRateLimitReset(endpoint)
  }

  async canMakeRequest(endpoint: string): Promise<boolean> {
    return this.prismaService.canMakeRequest(endpoint)
  }

  async close(): Promise<void> {
    return this.prismaService.close()
  }
}
