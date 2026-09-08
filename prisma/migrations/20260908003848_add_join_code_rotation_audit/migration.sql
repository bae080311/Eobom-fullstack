-- CreateTable
CREATE TABLE "JoinCodeRotation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rotatedById" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinCodeRotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoinCodeRotation_organizationId_rotatedAt_idx" ON "JoinCodeRotation"("organizationId", "rotatedAt");

-- AddForeignKey
ALTER TABLE "JoinCodeRotation" ADD CONSTRAINT "JoinCodeRotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinCodeRotation" ADD CONSTRAINT "JoinCodeRotation_rotatedById_fkey" FOREIGN KEY ("rotatedById") REFERENCES "TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
