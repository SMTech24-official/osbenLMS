const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { subMonths } = require('date-fns');
const prisma = new PrismaClient();
const subscriptionService = require('../modules/subscription/subscription.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Delete inactive users - Runs at midnight (00:00) every day
const scheduleUserCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const threeMonthsAgo = subMonths(new Date(), 3);
      
      // Find inactive users first
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
          lastLoginDate: true,
          subscriptionId: true,
          stripeCustomerId: true
        }
      });

      // Cancel subscriptions for users with active subscriptions
      for (const user of inactiveUsers) {
        if (user.subscriptionId) {
          try {
            // Cancel subscription in Stripe
            await stripe.subscriptions.cancel(user.subscriptionId);
            console.log(`[Cron Job] Cancelled subscription for user: ${user.id}`);
          } catch (error) {
            console.error(`[Cron Job Error] Failed to cancel subscription for user ${user.id}:`, error);
          }
        }

        if (user.stripeCustomerId) {
          try {
            // Delete customer in Stripe
            await stripe.customers.del(user.stripeCustomerId);
            console.log(`[Cron Job] Deleted Stripe customer for user: ${user.id}`);
          } catch (error) {
            console.error(`[Cron Job Error] Failed to delete Stripe customer for user ${user.id}:`, error);
          }
        }
      }

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
        console.log('Deleted users:', inactiveUsers.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          lastLoginDate: user.lastLoginDate,
          hadSubscription: !!user.subscriptionId
        })));
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

const checkSubscriptions = async () => {
  const users = await prisma.user.findMany({
    where: {
      subscriptionId: {
        not: null
      }
    }
  });

  for (const user of users) {
    try {
      await subscriptionService.checkSubscriptionStatus(user.id);
    } catch (error) {
      console.error(`Error checking subscription for user ${user.id}:`, error);
    }
  }
};

const scheduleSubscriptionChecks = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', checkSubscriptions);
};

module.exports = {
  scheduleUserCleanup,
  scheduleSubscriptionChecks
}; 