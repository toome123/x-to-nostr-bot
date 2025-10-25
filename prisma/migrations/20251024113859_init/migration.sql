-- CreateTable
CREATE TABLE "posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tweet_id" TEXT NOT NULL,
    "tweet_url" TEXT NOT NULL,
    "posted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "app_state" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "twitter_users" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "cached_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "endpoint" TEXT NOT NULL PRIMARY KEY,
    "reset_at" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_tweet_id_key" ON "posts"("tweet_id");

-- CreateIndex
CREATE INDEX "posts_tweet_id_idx" ON "posts"("tweet_id");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");
