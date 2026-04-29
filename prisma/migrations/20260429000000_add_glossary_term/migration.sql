-- Add GLOSSARY notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GLOSSARY_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GLOSSARY_APPROVED';

-- GlossaryTerm table
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "shortDef" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "topicId" TEXT,
    "authorId" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlossaryTerm_slug_key" ON "GlossaryTerm"("slug");
CREATE INDEX "GlossaryTerm_slug_idx" ON "GlossaryTerm"("slug");
CREATE INDEX "GlossaryTerm_topicId_idx" ON "GlossaryTerm"("topicId");
CREATE INDEX "GlossaryTerm_authorId_idx" ON "GlossaryTerm"("authorId");

ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- GlossaryLike table
CREATE TABLE "GlossaryLike" (
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlossaryLike_pkey" PRIMARY KEY ("userId", "termId")
);

ALTER TABLE "GlossaryLike" ADD CONSTRAINT "GlossaryLike_termId_fkey"
    FOREIGN KEY ("termId") REFERENCES "GlossaryTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GlossaryLike" ADD CONSTRAINT "GlossaryLike_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GlossaryBookmark table
CREATE TABLE "GlossaryBookmark" (
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlossaryBookmark_pkey" PRIMARY KEY ("userId", "termId")
);

ALTER TABLE "GlossaryBookmark" ADD CONSTRAINT "GlossaryBookmark_termId_fkey"
    FOREIGN KEY ("termId") REFERENCES "GlossaryTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GlossaryBookmark" ADD CONSTRAINT "GlossaryBookmark_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
