-- CreateTable
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'スタッフ',
    "store" TEXT NOT NULL DEFAULT '未設定',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "deadlineDay" INTEGER,
    "deadlineTime" TEXT,
    "targetRoles" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "submittedDate" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT '完了',
    "question" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_submissions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staffs" ("staffId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "report_submissions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report_templates" ("reportId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "line_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineUserId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "replyToken" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "method" TEXT NOT NULL DEFAULT 'line'
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "staffs_staffId_key" ON "staffs"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_lineUserId_key" ON "staffs"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_reportId_key" ON "report_templates"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_submissions_submissionId_key" ON "report_submissions"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");
