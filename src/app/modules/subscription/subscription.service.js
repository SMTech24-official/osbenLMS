const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createCustomer = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

const attachPaymentMethod = async (userId, paymentMethodId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user.stripeCustomerId) {
    throw new AppError('No Stripe customer ID found', 400);
  }

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.stripeCustomerId,
  });

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return true;
};

const createSubscription = async (userId, priceId, paymentMethodId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user.stripeCustomerId) {
    throw new AppError('No Stripe customer ID found', 400);
  }

  // Attach payment method if provided
  if (paymentMethodId) {
    await attachPaymentMethod(userId, paymentMethodId);
  }

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: user.stripeCustomerId,
    items: [{ price: priceId }],
    default_payment_method: paymentMethodId,
    expand: ['latest_invoice.payment_intent'],
  });

  // Calculate access end date based on subscription
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Update user with subscription details
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      accessEndDate: currentPeriodEnd,
    },
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    accessEndDate: currentPeriodEnd,
  };
};

const cancelSubscription = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user.subscriptionId) {
    throw new AppError('No active subscription found', 400);
  }

  const canceledSubscription = await stripe.subscriptions.cancel(user.subscriptionId);

  // Immediately end access
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessEndDate: new Date(),
      subscriptionId: null,
    },
  });

  return canceledSubscription;
};

const checkSubscriptionStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user.subscriptionId) {
    return false;
  }

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const newEndDate = new Date(subscription.current_period_end * 1000);

  // Update access end date if it's different
  if (user.accessEndDate?.getTime() !== newEndDate.getTime()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessEndDate: newEndDate,
      },
    });
  }

  return subscription.status === 'active';
};

// get all priceid from stripe by product id
const getPriceIdsByProductId = async (productId) => {
  // if product id is not provided, throw an error
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }
  const prices = await stripe.prices.list({
    product: productId,
  });
  return prices.data.map((price) => {
    return {
      id: price.id,
      name: price.nickname,
      price: price.unit_amount / 100,
      currency: price.currency,
      interval: price.recurring.interval,
    };
  });
};

// Get all subscribers with status and subscription end date
const getAllSubscribers = async (page = 1, limit = 10, searchTerm = '') => {
  const skip = (Number(page) - 1) * Number(limit);
  
  // Search condition
  const searchCondition = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }
    : {};
  
  // Only get users with subscription IDs
  const whereCondition = {
    subscriptionId: {
      not: null
    },
    ...searchCondition
  };

  // Get subscribers with pagination
  const [subscribers, total] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionId: true,
        accessEndDate: true,
        lastLoginDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    }),
    prisma.user.count({
      where: whereCondition
    })
  ]);

  // Get subscription status from Stripe for each user
  const subscribersWithStatus = await Promise.all(
    subscribers.map(async (user) => {
      let status = 'unknown';
      let currentPeriodEnd = user.accessEndDate;
      
      try {
        if (user.subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
          status = subscription.status;
          currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
      } catch (error) {
        console.error(`Error retrieving subscription for user ${user.id}:`, error);
      }

      return {
        ...user,
        subscriptionStatus: status,
        subscriptionEndDate: currentPeriodEnd,
        isActive: status === 'active' && new Date() < currentPeriodEnd
      };
    })
  );

  return {
    data: subscribersWithStatus,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

// Get detailed subscription info for a user
const getUserSubscriptionDetails = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionId: true,
      stripeCustomerId: true,
      accessEndDate: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Default response if no subscription
  let subscriptionDetails = {
    hasSubscription: false,
    status: 'none',
    currentPeriodStart: null,
    currentPeriodEnd: user.accessEndDate,
    cancelAtPeriodEnd: false,
    plan: null,
    paymentMethod: null
  };

  // If user has a subscription, get details from Stripe
  if (user.subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId, {
        expand: ['default_payment_method', 'items.data.price.product']
      });

      // Get plan details
      const plan = subscription.items.data[0]?.price;
      const product = plan?.product;
      
      // Get payment method details
      let paymentMethod = null;
      if (subscription.default_payment_method) {
        paymentMethod = {
          id: subscription.default_payment_method.id,
          brand: subscription.default_payment_method.card?.brand,
          last4: subscription.default_payment_method.card?.last4,
          expiryMonth: subscription.default_payment_method.card?.exp_month,
          expiryYear: subscription.default_payment_method.card?.exp_year
        };
      }

      subscriptionDetails = {
        hasSubscription: true,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan: plan ? {
          id: plan.id,
          nickname: plan.nickname,
          amount: plan.unit_amount / 100,
          currency: plan.currency,
          interval: plan.recurring?.interval,
          productName: product?.name
        } : null,
        paymentMethod
      };
    } catch (error) {
      console.error(`Error retrieving subscription details for user ${userId}:`, error);
      throw new AppError('Error retrieving subscription details', 500);
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      accessEndDate: user.accessEndDate
    },
    subscription: subscriptionDetails
  };
};

module.exports = {
  createCustomer,
  attachPaymentMethod,
  createSubscription,
  cancelSubscription,
  checkSubscriptionStatus,
  getPriceIdsByProductId,
  getAllSubscribers,
  getUserSubscriptionDetails
};