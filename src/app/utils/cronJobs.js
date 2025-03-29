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
          role: 'USER' // Only target users with the USER role
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

      // Process each inactive user
      for (const user of inactiveUsers) {
        try {
          // Cancel subscription in Stripe if exists
          if (user.subscriptionId) {
            try {
              await stripe.subscriptions.cancel(user.subscriptionId);
              console.log(`[Cron Job] Cancelled subscription for user: ${user.id}`);
            } catch (error) {
              console.error(`[Cron Job Error] Failed to cancel subscription for user ${user.id}:`, error);
            }
          }

          // Delete Stripe customer if exists
          if (user.stripeCustomerId) {
            try {
              await stripe.customers.del(user.stripeCustomerId);
              console.log(`[Cron Job] Deleted Stripe customer for user: ${user.id}`);
            } catch (error) {
              console.error(`[Cron Job Error] Failed to delete Stripe customer for user ${user.id}:`, error);
            }
          }

          // Use transaction to delete all related data for this user
          await prisma.$transaction(async (tx) => {
            // 1. Delete all reviews created by the user
            await tx.review.deleteMany({
              where: { userId: user.id }
            });

            // 2. Delete all certificates issued to the user
            await tx.certificate.deleteMany({
              where: { userId: user.id }
            });

            // 3. Delete all quiz attempts by the user
            await tx.quizAttempt.deleteMany({
              where: { userId: user.id }
            });

            // 4. Delete all enrollments for the user
            await tx.enrollment.deleteMany({
              where: { userId: user.id }
            });

            // 5. Handle courses created by the user if they are a provider
            if (user.role === 'PROVIDER') {
              // Get all courses created by this provider
              const providerCourses = await tx.course.findMany({
                where: { providerId: user.id },
                select: { id: true }
              });

              // For each course, delete all related data
              for (const course of providerCourses) {
                // Delete reviews for this course
                await tx.review.deleteMany({
                  where: { courseId: course.id }
                });

                // Delete certificates for this course
                await tx.certificate.deleteMany({
                  where: { courseId: course.id }
                });

                // Delete enrollments for this course
                await tx.enrollment.deleteMany({
                  where: { courseId: course.id }
                });

                // Handle quiz data if exists
                const quiz = await tx.quiz.findUnique({
                  where: { courseId: course.id },
                  select: { id: true }
                });

                if (quiz) {
                  // Delete quiz attempts
                  await tx.quizAttempt.deleteMany({
                    where: { quizId: quiz.id }
                  });

                  // Delete quiz questions
                  await tx.question.deleteMany({
                    where: { quizId: quiz.id }
                  });

                  // Delete the quiz itself
                  await tx.quiz.delete({
                    where: { id: quiz.id }
                  });
                }
              }

              // Finally delete all courses created by this provider
              await tx.course.deleteMany({
                where: { providerId: user.id }
              });
            }

            // 6. Finally delete the user
            await tx.user.delete({
              where: { id: user.id }
            });
          });

          console.log(`[Cron Job] Successfully deleted user ${user.id} (${user.email}) and all related data`);
        } catch (error) {
          console.error(`[Cron Job Error] Failed to process deletion for user ${user.id}:`, error);
        }
      }

      console.log(`[Cron Job] ${new Date().toISOString()}: Processed ${inactiveUsers.length} inactive users`);
      if (inactiveUsers.length > 0) {
        console.log('Processed users:', inactiveUsers.map(user => ({
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