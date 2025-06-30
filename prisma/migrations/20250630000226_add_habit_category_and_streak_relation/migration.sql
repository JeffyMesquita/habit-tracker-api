-- AlterTable
ALTER TABLE "habit_streaks" ADD COLUMN     "habitId" TEXT;

-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "user_goals" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "habit_streaks" ADD CONSTRAINT "habit_streaks_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
