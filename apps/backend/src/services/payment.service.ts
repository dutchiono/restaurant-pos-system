import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  async createPayment(data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    customerId?: string;
    stripePaymentIntentId?: string;
  }) {
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        method: data.method,
        status: 'PENDING',
        customerId: data.customerId,
        stripePaymentIntentId: data.stripePaymentIntentId,
      },
    });

    return payment;
  }

  async createPaymentIntent(amount: number, customerId?: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  }

  async confirmPayment(paymentId: string) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update order status if fully paid
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { payments: true },
    });

    if (order) {
      const totalPaid = order.payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      const orderTotal = await this.calculateOrderTotal(order.id);

      if (totalPaid >= orderTotal) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        });
      }
    }

    return payment;
  }

  async processRefund(paymentId: string, amount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.method === 'CARD' && payment.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      return refund;
    }

    // For cash/other methods, just update status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    return { success: true };
  }

  async splitBill(orderId: string, splits: Array<{ amount: number; customerId?: string }>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const total = await this.calculateOrderTotal(orderId);
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);

    if (Math.abs(splitTotal - total) > 0.01) {
      throw new Error('Split amounts do not match order total');
    }

    const payments = await Promise.all(
      splits.map((split) =>
        this.createPayment({
          orderId,
          amount: split.amount,
          method: 'CARD',
          customerId: split.customerId,
        })
      )
    );

    return payments;
  }

  async calculateOrderTotal(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const subtotal = order.items.reduce((sum, item) => {
      return sum + item.menuItem.price * item.quantity;
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    return subtotal + tax;
  }

  async getPaymentsByOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
