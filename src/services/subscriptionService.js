import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Define subscription plans
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    duration: null,
    features: [
      "Up to 5 employees",
      "Basic attendance tracking",
      "Daily reports",
      "GPS check-in"
    ],
    badge: "FREE"
  },
  minipro: {
    name: "MiniPro",
    monthlyPrice: 5000,
    yearlyPrice: 45000,
    duration: "monthly",
    features: [
      "Up to 50 employees",
      "Advanced analytics",
      "Shift management",
      "Geo-fencing",
      "Custom reports",
      "API access"
    ],
    badge: "MINIPRO"
  },
  pro: {
    name: "Pro",
    monthlyPrice: 5000,
    yearlyPrice: 45000,
    duration: "yearly",
    features: [
      "Unlimited employees",
      "Advanced analytics",
      "Shift management",
      "Geo-fencing",
      "Custom reports",
      "API access",
      "Priority support",
      "Bulk operations"
    ],
    badge: "PRO"
  }
};

/**
 * Calculate subscription expiry date
 * @param {string} plan - 'minipro' or 'pro'
 * @returns {Date} - Expiry date
 */
export const calculateExpiryDate = (plan) => {
  const now = new Date();
  if (plan === "minipro") {
    // Monthly - 30 days from now
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (plan === "pro") {
    // Yearly - 365 days from now
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
  return null;
};

/**
 * Update user subscription after successful payment
 * @param {string} userId - User UID
 * @param {string} plan - 'minipro' or 'pro'
 * @param {string} reference - Payment reference
 * @param {string} email - User email
 */
export const updateSubscription = async (userId, plan, reference, email) => {
  try {
    const expiryDate = calculateExpiryDate(plan);
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      plan: plan === "minipro" ? "minipro" : "pro",
      subscriptionActive: true,
      paymentRef: reference,
      expiresAt: expiryDate,
      upgradedAt: new Date(),
      lastPaymentEmail: email
    });

    return { success: true, plan, expiresAt: expiryDate };
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

/**
 * Check and downgrade expired subscriptions
 * @param {string} userId - User UID
 * @returns {boolean} - true if user was downgraded
 */
export const checkAndDowngradeExpired = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    if (!userData.plan || userData.plan === "free") return false;

    const now = new Date();
    const expiresAt = userData.expiresAt?.toDate?.() || userData.expiresAt;

    if (expiresAt && now > expiresAt) {
      await updateDoc(userRef, {
        plan: "free",
        subscriptionActive: false,
        downgradedAt: new Date()
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
    return false;
  }
};

/**
 * Get user's current subscription status
 * @param {string} userId - User UID
 * @returns {Promise<Object>} - Subscription data
 */
export const getUserSubscription = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        plan: "free",
        subscriptionActive: false,
        expiresAt: null
      };
    }

    const data = userSnap.data();
    // Auto-check for expiry
    if (data.plan && data.plan !== "free" && data.expiresAt) {
      const now = new Date();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;
      
      if (now > expiresAt) {
        await updateDoc(userRef, {
          plan: "free",
          subscriptionActive: false
        });
        return {
          plan: "free",
          subscriptionActive: false,
          expiresAt: null,
          wasExpired: true
        };
      }
    }

    return {
      plan: data.plan || "free",
      subscriptionActive: data.subscriptionActive || false,
      expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
      paymentRef: data.paymentRef,
      upgradedAt: data.upgradedAt?.toDate?.() || data.upgradedAt
    };
  } catch (error) {
    console.error("Error getting subscription:", error);
    return {
      plan: "free",
      subscriptionActive: false,
      expiresAt: null
    };
  }
};

/**
 * Format expiry date for display
 * @param {Date} date - Expiry date
 * @returns {string} - Formatted date string
 */
export const formatExpiryDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

/**
 * Get days remaining until expiry
 * @param {Date} expiresAt - Expiry date
 * @returns {number} - Days remaining
 */
export const getDaysRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  const d = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
