CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "shortDef" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlossaryTerm_slug_key" ON "GlossaryTerm"("slug");
CREATE INDEX "GlossaryTerm_slug_idx" ON "GlossaryTerm"("slug");
CREATE INDEX "GlossaryTerm_topicId_idx" ON "GlossaryTerm"("topicId");

ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
