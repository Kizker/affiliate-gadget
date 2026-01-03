-- Add media fields to chat_messages table (with correct case)
ALTER TABLE "chat_messages" 
ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "mediaType" TEXT,
ADD COLUMN IF NOT EXISTS "mediaSize" INTEGER,
ADD COLUMN IF NOT EXISTS "mediaName" TEXT,
ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
