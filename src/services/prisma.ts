import { PrismaClient } from '../generated/prisma/client.js'
import { DatabasePost, AppState } from '../types/index.js'

export class PrismaService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async saveTweetId(tweetId: string, tweetUrl: string): Promise<void> {
    await this.prisma.post.upsert({
      where: { tweetId },
      update: {
        tweetUrl,
        postedAt: new Date(),
      },
      create: {
        tweetId,
        tweetUrl,
        postedAt: new Date(),
        createdAt: new Date(),
      },
    })
  }

  async isTweetPosted(tweetId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { tweetId },
      select: { id: true },
    })
    return !!post
  }

  async getStartDate(): Promise<string | null> {
    const appState = await this.prisma.appState.findUnique({
      where: { key: 'start_date' },
    })
    return appState?.value || null
  }

  async setStartDate(date: string): Promise<void> {
    await this.prisma.appState.upsert({
      where: { key: 'start_date' },
      update: { value: date },
      create: { key: 'start_date', value: date },
    })
  }

  async updateStartDateToNow(): Promise<void> {
    const now = new Date().toISOString()
    await this.setStartDate(now)
  }

  async getPostedTweets(limit: number = 100): Promise<DatabasePost[]> {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return posts.map((post: any) => ({
      id: post.id,
      tweet_id: post.tweetId,
      tweet_url: post.tweetUrl,
      posted_at: post.postedAt.toISOString(),
      created_at: post.createdAt.toISOString(),
    }))
  }

  async getTwitterUserId(username: string): Promise<string | null> {
    const user = await this.prisma.twitterUser.findUnique({
      where: { username },
      select: { userId: true },
    })
    return user?.userId || null
  }

  async setTwitterUserId(username: string, userId: string): Promise<void> {
    await this.prisma.twitterUser.upsert({
      where: { username },
      update: {
        userId,
        cachedAt: new Date(),
      },
      create: {
        username,
        userId,
        cachedAt: new Date(),
      },
    })
  }

  async saveRateLimitReset(endpoint: string, resetAt: number): Promise<void> {
    await this.prisma.rateLimit.upsert({
      where: { endpoint },
      update: {
        resetAt,
        updatedAt: new Date(),
      },
      create: {
        endpoint,
        resetAt,
        updatedAt: new Date(),
      },
    })
  }

  async getRateLimitReset(endpoint: string): Promise<number | null> {
    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { endpoint },
      select: { resetAt: true },
    })
    return rateLimit?.resetAt || null
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
    await this.prisma.$disconnect()
  }
}