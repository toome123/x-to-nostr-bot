# Twitter to Nostr Bot

A Node.js application that monitors a Twitter account and automatically posts new tweets to Nostr relays.

## Features

- 🔍 Monitors a specified Twitter account every 10 minutes (configurable)
- 📱 Posts new tweets to multiple Nostr relays
- 💾 Tracks posted tweets in SQLite database to avoid duplicates
- 🐳 Dockerized with Alpine Linux for minimal footprint
- 🔧 Configurable via environment variables
- 📊 Preserves hashtags, mentions, links, and media from tweets
- ⚡ Rate limiting protection with automatic retry
- 🔄 User ID caching for improved performance
- 🎯 Excludes replies and retweets (original tweets only)
- 🔗 Optional tweet URL display in Nostr posts
- 🛡️ Graceful shutdown handling

## Prerequisites

- Node.js 20+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Twitter API v2 Bearer Token
- Nostr private key

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd x-to-nostr-bot
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
TWITTER_USERNAME=username_to_monitor

# Nostr Configuration
NOSTR_PRIVATE_KEY=your_nostr_private_key_here
NOSTR_RELAYS=wss://relay.example.com,wss://another-relay.com

# Cron Configuration (optional)
CRON_SCHEDULE=*/10 * * * *

# Database Configuration (optional)
DB_PATH=./db/bot.db
```

### 3. Run with Docker

```bash
# Build and start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run built application
npm start
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWITTER_BEARER_TOKEN` | Yes | - | Twitter API v2 Bearer Token |
| `TWITTER_USERNAME` | Yes | - | Twitter username to monitor |
| `NOSTR_PRIVATE_KEY` | Yes | - | Nostr private key (hex or nsec format) |
| `NOSTR_RELAYS` | No | Default relays | Comma-separated list of additional relays |
| `CRON_SCHEDULE` | No | `*/10 * * * *` | Cron expression for tweet checking |
| `DB_PATH` | No | `./db/bot.db` | SQLite database file path |
| `SHOW_TWEET_URL` | No | `true` | Whether to include original tweet URL in Nostr posts |

### Default Nostr Relays

The bot connects to these relays by default:
- `wss://relay.damus.io`
- `wss://relay.nostr.band`
- `wss://nos.lol`

Additional relays can be specified via `NOSTR_RELAYS` environment variable.

## How It Works

1. **Initialization**: On first run, the bot saves the current timestamp as the start date
2. **User Resolution**: Twitter username is resolved to user ID and cached for performance
3. **Monitoring**: Every 10 minutes (configurable), the bot checks for new tweets
4. **Rate Limiting**: Automatic rate limit detection and retry with exponential backoff
5. **Filtering**: Only original tweets posted after the start date are processed (excludes replies/retweets)
6. **Deduplication**: Already posted tweets are skipped using SQLite database
7. **Formatting**: Tweets are formatted with hashtags, mentions, links, and media URLs
8. **Publishing**: New tweets are published to all configured Nostr relays with proper tags
9. **Tracking**: Posted tweets are saved to the database for future reference
10. **State Management**: Start date is updated to prevent reprocessing of the same tweets

## Database Schema

The bot uses SQLite with four tables:

### `posts` table
- `id` - Primary key
- `tweet_id` - Twitter tweet ID (unique)
- `tweet_url` - Full Twitter URL
- `posted_at` - When posted to Nostr
- `created_at` - When record was created

### `app_state` table
- `key` - State key (e.g., 'start_date')
- `value` - State value (e.g., ISO timestamp)

### `twitter_users` table
- `username` - Twitter username (primary key)
- `user_id` - Twitter user ID
- `cached_at` - When the user ID was cached

### `rate_limits` table
- `endpoint` - API endpoint (primary key)
- `reset_at` - Unix timestamp when rate limit resets
- `updated_at` - When the rate limit info was last updated

## Development

### Project Structure

```
src/
├── config/
│   └── index.ts     # Configuration management and environment loading
├── services/
│   ├── database.ts  # SQLite database operations and schema
│   ├── nostr.ts     # Nostr protocol implementation and publishing
│   └── twitter.ts   # Twitter API integration and rate limiting
├── types/
│   └── index.ts     # TypeScript interfaces and type definitions
└── index.ts         # Main application entry point and bot orchestration
```

### Building

The project uses TypeScript for building the Node.js application:

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Dependencies

**Runtime Dependencies:**
- `better-sqlite3` - SQLite database driver
- `dotenv` - Environment variable management
- `fs-extra` - Enhanced file system operations
- `node-cron` - Cron job scheduling
- `nostr-tools` - Nostr protocol implementation

**Development Dependencies:**
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution and watch mode
- `@types/*` - TypeScript type definitions

### Docker Commands

```bash
# Build Docker image
npm run docker:build

# Export Docker image for AMD64 architecture
npm run docker:export:amd64

# Run with docker-compose
npm run docker:run

# View logs
docker-compose logs -f x-to-nostr-bot

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

### Docker Features

- **Alpine Linux base** - Minimal footprint (~50MB)
- **Multi-stage build** - Optimized production image
- **Non-root user** - Enhanced security
- **Health checks** - Container health monitoring
- **Volume persistence** - Database data persistence
- **Build dependencies** - Includes Python3, make, g++ for native modules

## Troubleshooting

### Common Issues

1. **Twitter API Errors**: 
   - Verify your Bearer Token is valid and has read permissions
   - Check rate limits - the bot will automatically retry when limits reset
   - Ensure the monitored account exists and is public

2. **Nostr Connection Issues**: 
   - Check relay URLs are valid and accessible
   - Verify your private key is in correct format (hex or nsec)
   - Test relay connectivity manually

3. **Database Errors**: 
   - Ensure the database directory is writable
   - Check disk space availability
   - Verify SQLite file permissions

4. **Rate Limiting**: 
   - The bot automatically handles Twitter API rate limits
   - Check logs for rate limit messages and wait times
   - Consider adjusting `CRON_SCHEDULE` if hitting limits frequently

5. **Memory Issues**: 
   - The Alpine image is minimal (~50MB), but monitor resource usage
   - Check for memory leaks in long-running processes

### Logs

Check application logs for detailed error information:

```bash
# Docker logs
docker-compose logs -f

# Local development
npm run dev
```

## License

ISC License - see package.json for details.
