/*
  Warnings:

  - Added the required column `hashtags` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `links` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrls` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentions` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tweet_id" TEXT NOT NULL,
    "tweet_url" TEXT NOT NULL,
    "mediaUrls" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "mentions" TEXT NOT NULL,
    "links" TEXT NOT NULL,
    "posted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_posts" ("created_at", "id", "posted_at", "tweet_id", "tweet_url") SELECT "created_at", "id", "posted_at", "tweet_id", "tweet_url" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE UNIQUE INDEX "posts_tweet_id_key" ON "posts"("tweet_id");
CREATE INDEX "posts_tweet_id_idx" ON "posts"("tweet_id");
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
