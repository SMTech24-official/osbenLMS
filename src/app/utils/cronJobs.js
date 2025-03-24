const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { subMonths } = require('date-fns');
const prisma = new PrismaClient();

// Delete inactive users - Runs at midnight (00:00) every day
const scheduleUserCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const threeMonthsAgo = subMonths(new Date(), 3);
      
      // Find inactive users first (for logging purposes)
      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastLoginDate: {
            lt: threeMonthsAgo
          },
          role: {
            not: 'ADMIN'
          }
        },
        select: {
          id: true,
          email: true,
          role: true,
          lastLoginDate: true
        }
      });

      // Delete inactive users and related data
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          lastLoginDate: {
            lt: threeMonthsAgo
          },
          role: {
            not: 'ADMIN'
          }
        }
      });

      console.log(`[Cron Job] ${new Date().toISOString()}: Deleted ${deletedUsers.count} inactive users`);
      if (inactiveUsers.length > 0) {
        console.log('Deleted users:', inactiveUsers);
      }
    } catch (error) {
      console.error('[Cron Job Error] Failed to delete inactive users:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC" // Adjust timezone as needed
  });

  console.log('Cron job scheduled: User cleanup will run daily at midnight UTC');
};

module.exports = {
  scheduleUserCleanup
}; 