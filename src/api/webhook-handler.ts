import express from 'express';
import { WebhookService } from '../services/webhook-service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
<<<<<<< HEAD
  apiVersion: '2024-04-10',
  host: 'api.stripe.com',
  protocol: 'https'
=======
  apiVersion: '2024-04-10'
>>>>>>> 1013e0ab2db5513f68c2e9e28d06ad31fd8caabf
});

const webhookHandler = express.Router();

webhookHandler.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // 验证 Webhook 签名
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 根据事件类型处理不同的逻辑
    switch (event.type) {
      case 'payment_intent.succeeded':
        await WebhookService.handlePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await WebhookService.handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await WebhookService.handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await WebhookService.handleSubscriptionCanceled(event.data.object);
        break;
        
      case 'customer.subscription.trial_will_end':
        await WebhookService.handleTrialEnding(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await WebhookService.handleInvoicePaymentFailed(event.data.object);
        break;
        
      case 'invoice.upcoming':
        await WebhookService.handleUpcomingInvoice(event.data.object);
        break;
    }

    const startTime = Date.now();
    res.json({ received: true });
    console.log('Webhook 处理时间:', Date.now() - startTime + 'ms');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default webhookHandler; 