UPDATE "Chunk" SET "searchVector" = to_tsvector('english', text) WHERE "searchVector" IS NULL;
CREATE INDEX IF NOT EXISTS chunk_search_idx ON "Chunk" USING GIN("searchVector");
