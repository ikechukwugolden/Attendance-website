const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Attendly Pro SaaS',
              description: 'Unlock Geo-Guard (📍) & Advanced PDF Reports (📊)',
            },
            unit_amount: 199, // $1.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Inside api/checkout.js
      success_url: `https://attendance-website-eight.vercel.app/success`,
      cancel_url: `https://attendance-website-eight.vercel.app/settings?payment=cancelled`,
      customer_email: email,
      metadata: { userId: userId },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}