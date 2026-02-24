import { buffer } from 'micro';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin (Required for Webhooks to talk to your DB)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    // 💰 THE MAGIC: Update the user to PRO in your Firestore
    await admin.firestore().collection('users').doc(userId).set({
      tier: 'PRO',
      subscriptionStatus: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  res.json({ received: true });
}