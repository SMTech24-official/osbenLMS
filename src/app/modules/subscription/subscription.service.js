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
module.exports = {
  createCustomer,
  attachPaymentMethod,
  createSubscription,
  cancelSubscription,
  checkSubscriptionStatus,
  getPriceIdsByProductId,
}; 