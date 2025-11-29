-- CreateEnum
CREATE TYPE "public"."ServiceName" AS ENUM ('PCI_DSS', 'SOC_2', 'ISO_27001', 'PENETRATION_SECURITY_TESTING', 'GRC', 'GDPR', 'HIPAA', 'SECURITY_REVIEW', 'SECURE_CODE_REVIEW', 'CONFIGURATION_REVIEW', 'DESIGN_REVIEW', 'SECURITY_ADVISORY', 'ARCHITECTURE_REVIEW', 'SECURE_APPLICATION_DEVELOPMENT', 'CAPABILITY_MATURITY_ASSESSMENTS');

-- AlterTable
ALTER TABLE "public"."ContactMessage" ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."QuoteRequest" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "companyName" VARCHAR(50) NOT NULL,
    "message" VARCHAR(1000),
    "jobTitle" VARCHAR(50),
    "services" "public"."ServiceName"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);
