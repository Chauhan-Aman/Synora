-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtifactToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtifactToTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtifactToEntity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtifactToEntity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summary_artifactId_key" ON "Summary"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_name_type_key" ON "Entity"("name", "type");

-- CreateIndex
CREATE INDEX "_ArtifactToTopic_B_index" ON "_ArtifactToTopic"("B");

-- CreateIndex
CREATE INDEX "_ArtifactToEntity_B_index" ON "_ArtifactToEntity"("B");

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtifactToTopic" ADD CONSTRAINT "_ArtifactToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtifactToTopic" ADD CONSTRAINT "_ArtifactToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtifactToEntity" ADD CONSTRAINT "_ArtifactToEntity_A_fkey" FOREIGN KEY ("A") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtifactToEntity" ADD CONSTRAINT "_ArtifactToEntity_B_fkey" FOREIGN KEY ("B") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
