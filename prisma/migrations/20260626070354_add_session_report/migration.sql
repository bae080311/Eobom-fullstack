-- CreateTable
CREATE TABLE "SessionReport" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "rawMemo" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "activities" TEXT[],
    "progress" TEXT NOT NULL,
    "homework" TEXT,
    "nextGoal" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_scheduleId_key" ON "SessionReport"("scheduleId");

-- AddForeignKey
ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
