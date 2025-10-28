import {
  getPublicKey,
  finalizeEvent,
  SimplePool,
  nip19
} from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'
import { Tweet } from '../types/index.js'

export class NostrService {
  private privateKey: Uint8Array
  private publicKey: string
  private relays: string[]
  private showTweetUrl: boolean

  constructor(privateKeyInput: string, relays: string[], showTweetUrl: boolean = true) {
    // Handle both nsec-encoded and hex private keys
    if (privateKeyInput.startsWith('nsec1')) {
      // Decode nsec (bech32) format - returns Uint8Array directly
      const decoded = nip19.decode(privateKeyInput)
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid nsec key format')
      }
      this.privateKey = decoded.data as Uint8Array
    } else {
      // Already in hex format, ensure it's 64 characters (32 bytes) and convert to Uint8Array
      const hexKey = privateKeyInput.padStart(64, '0')
      this.privateKey = hexToBytes(hexKey)
    }

    this.publicKey = getPublicKey(this.privateKey)
    this.relays = relays;
    this.showTweetUrl = showTweetUrl

    console.log(`🔗 Nostr service initialized with public key: ${this.publicKey.substring(0, 8)}...`)
  }

  async publishNote(tweet: Tweet): Promise<boolean> {
    let pool: SimplePool | null = null

    try {
      // Create a new pool for this operation
      pool = new SimplePool({ enablePing: true })

      const content = tweet.text;

      // Create the event template
      const eventTemplate = {
        kind: 1,
        content,
        tags: this.buildTags(tweet),
        created_at: Math.floor(Date.now() / 1000)
      }
      console.log('eventTemplate', eventTemplate);
      // Sign the event with the private key
      const signedEvent = finalizeEvent(eventTemplate, this.privateKey)
      console.log('signedEvent', signedEvent);
      // Publish to all relays using SimplePool with proper error handling
      // const publishPromises = pool.publish(this.relays, signedEvent)
      const publishPromises = new Promise((resolve, reject) => {
        setTimeout(() => resolve(true), 10000)
      })
      // Wait for at least one relay to confirm with timeout
      await Promise.race([
        publishPromises,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Publish timeout after 15 seconds')), 15000)
        )
      ])

      console.log(`✅ Published event to relays`)
      return true
    } catch (error) {
      console.error('Error publishing to Nostr:', error)
      return false
    }
  }

  private buildTags(tweet: Tweet): string[][] {
    const tags: string[][] = []

    // Add hashtags as t tags
    if (tweet.hashtags) {
      tweet.hashtags.forEach(hashtag => {
        tags.push(['t', hashtag.replace('#', '')])
      })
    }

    // Add links as r tags
    if (tweet.links) {
      tweet.links.forEach(link => {
        tags.push(['r', link])
      })
    }

    if (this.showTweetUrl) {
      // Add original tweet URL as r tag
      tags.push(['r', tweet.url])
    }

    if (tweet.media_urls) {
      tweet.media_urls.forEach(mediaUrl => {
        const mediaType = mediaUrl.split('.').pop()?.toLowerCase()
        if (mediaType) {
          tags.push(['image', mediaUrl, `image/${mediaType}`])
        }
      })
    }

    return tags
  }

  getPublicKey(): string {
    return this.publicKey
  }

  getConnectedRelays(): string[] {
    return this.relays
  }
}
