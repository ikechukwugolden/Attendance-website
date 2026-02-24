const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);

admin.initializeApp();

// This function creates the secure Stripe link for the user
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // 1. Check if user is logged in
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Please login first.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Attendly Pro SaaS",
              description: "Unlock Geo-Guard (📍) & Advanced PDF Reports (📊)",
            },
            unit_amount: 199, // $1.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", 
      // Success and Cancel URLs
      success_url: "https://attendance-website-eight.vercel.app/dashboard?payment=success",
      cancel_url: "https://attendance-website-eight.vercel.app/settings?payment=cancelled",
      customer_email: context.auth.token.email,
      metadata: {
        userId: context.auth.uid,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Stripe Error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});