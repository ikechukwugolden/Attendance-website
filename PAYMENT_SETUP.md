# Paystack Payment Integration Setup Guide

## Overview
This payment system integrates Paystack for handling subscription payments with automatic plan upgrades and expiry management.

## Features
- ✅ Two subscription plans: MiniPro (₦5,000/month) and Pro (₦45,000/year)
- ✅ Automatic downgrade to Free when subscriptions expire
- ✅ Bank account storage for future transfers
- ✅ Real-time subscription status tracking
- ✅ Secure Paystack payment processing

## Environment Variables Setup

Add these to your `.env` file:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

### Getting Your Paystack Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Sign in to your account
3. Navigate to **Settings** → **API Keys & Webhooks**
4. Copy your **Public Key** (starts with `pk_`)
5. Add it to your `.env` file

> **⚠️ Important**: Never commit your `.env` file to version control. Use `.env.local` for local development.

## Database Schema

### Users Collection (`users/{uid}`)
```javascript
{
  plan: "free" | "minipro" | "pro",           // Current subscription plan
  subscriptionActive: boolean,                   // Is subscription currently active
  expiresAt: Timestamp,                         // Expiration date of subscription
  paymentRef: string,                           // Paystack transaction reference
  upgradedAt: Timestamp,                        // When subscription was activated
  downgradedAt: Timestamp,                      // When subscription was downgraded
  lastPaymentEmail: string,                     // Email used for last payment
  // ... other user fields
}
```

## Subscription Plans

### Free Plan (₦0)
- **Duration**: Forever
- **Features**:
  - Up to 5 employees
  - Basic attendance tracking
  - Daily reports
  - GPS check-in
  - Community support

### MiniPro Plan (₦5,000)
- **Duration**: 30 days (monthly)
- **Features**:
  - Up to 50 employees
  - Advanced analytics
  - Shift management
  - Geo-fencing with radius control
  - Custom reports
  - API access
  - Email support
  - Schedule management

### Pro Plan (₦45,000)
- **Duration**: 365 days (yearly)
- **Features**:
  - Unlimited employees
  - Advanced analytics & AI insights
  - Shift management
  - Advanced geo-fencing
  - Custom reports & dashboards
  - Full API access
  - Priority support
  - Bulk operations
  - Team management
  - Advanced security

## Components & Services

### Services
**`subscriptionService.js`** - Handles subscription logic
- `updateSubscription()` - Updates user plan after payment
- `checkAndDowngradeExpired()` - Checks and downgrades expired plans
- `getUserSubscription()` - Gets current subscription status
- `calculateExpiryDate()` - Calculates expiration date
- `getDaysRemaining()` - Gets remaining days

### Components
**`PricingModal.jsx`** - Main payment modal
- Displays all pricing plans
- Integrates Paystack payment
- Collects bank details for transfers

**`SubscriptionBadge.jsx`** - Shows current subscription status
- Displays current plan badge
- Shows days remaining
- Auto-refreshes every hour

**`Pricing.jsx`** - Full pricing page
- Complete pricing information
- FAQ section
- Plan comparison
- Subscription management

## Payment Flow

```
User clicks "Upgrade" 
    ↓
Open Pricing Modal
    ↓
Select Plan (MiniPro/Pro)
    ↓
Click "Upgrade Now"
    ↓
Paystack Payment Form Opens
    ↓
Enter Payment Details
    ↓
Payment Processing
    ↓
Success: updateSubscription() called
    ↓
Firebase updated with new plan & expiry date
    ↓
User receives confirmation
    ↓
Dashboard reloads to show new plan
```

## Automatic Expiry & Downgrade

The system automatically downgrades expired subscriptions:

1. **Dashboard Check**: Every time user opens Dashboard, subscription status is checked
2. **Expiry Detection**: If `expiresAt` < current date, plan is downgraded
3. **Automatic Downgrade**: User is moved to "free" plan automatically
4. **Toast Notification**: User is notified about downgrade

## Testing Paystack Payments

### Test Card Numbers
Use these with any future expiry date and any 3-digit CVV:

- **Visa**: `4111 1111 1111 1111`
- **Mastercard**: `5555 5555 5555 4444`
- **Verve**: `5061 0000 0000 0000`

### Test Amount
Use any amount in Kobo (₦1 = 100 Kobo)
- ₦5,000 = 500,000 Kobo
- ₦45,000 = 4,500,000 Kobo

## API Reference

### updateSubscription(userId, plan, reference, email)
Updates user subscription in Firebase

**Parameters**:
- `userId` (string): User's UID
- `plan` (string): 'minipro' or 'pro'
- `reference` (string): Paystack transaction reference
- `email` (string): User email

**Returns**: Promise with subscription data

**Example**:
```javascript
import { updateSubscription } from "../services/subscriptionService";

await updateSubscription(
  user.uid,
  "minipro",
  "TRX123456",
  user.email
);
```

### getUserSubscription(userId)
Fetches current subscription status

**Parameters**:
- `userId` (string): User's UID

**Returns**: Promise with subscription object

**Example**:
```javascript
const subscription = await getUserSubscription(user.uid);
console.log(subscription.plan); // "pro" | "minipro" | "free"
```

### checkAndDowngradeExpired(userId)
Manually check and downgrade expired subscriptions

**Parameters**:
- `userId` (string): User's UID

**Returns**: Promise\<boolean\> - true if user was downgraded

## Troubleshooting

### Payment Not Going Through
1. Check Paystack Public Key is correct in `.env`
2. Verify internet connection
3. Check browser console for errors
4. Try a different card (use test cards above)

### Subscription Not Updating
1. Check Firebase connection
2. Verify user is logged in
3. Check Firebase security rules allow writes to `users` collection
4. Check browser console for Firebase errors

### Expiry Not Triggering
1. Make sure `expiresAt` is a Firestore Timestamp
2. Check Dashboard is opened (checks happen on page load)
3. Check browser console logs
4. Manually refresh dashboard

### User Still Has Access After Expiry
1. Check user's `subscriptionActive` field is false
2. Verify plan-specific features check this field
3. Clear browser cache and reload
4. Check Dashboard for any cached subscription data

## Security Considerations

1. **Never expose Paystack Secret Key** - Only use Public Key in frontend
2. **Validate on Backend** - Paystack provides webhooks for server-side verification
3. **Encrypted Storage** - Bank details are never stored if too sensitive
4. **Firebase Rules** - Implement strict rules for subscription data access
5. **Rate Limiting** - Implement rate limiting on upgrade endpoints

## Future Enhancements

### Webhook Verification
```javascript
// In your Cloud Function
const verifyPaystackPayment = async (reference) => {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    }
  );
  return response.json();
};
```

### Usage Limits
Implement feature gating based on plan:
```javascript
const canAccessFeature = (plan, feature) => {
  const features = {
    free: ['basic_tracking'],
    minipro: ['advanced_analytics', 'custom_reports'],
    pro: ['api_access', 'priority_support']
  };
  return features[plan]?.includes(feature);
};
```

### Payment Analytics
Track conversion rates and payment metrics in Firestore

### Coupon System
Implement discount codes for special promotions

## Support

For Paystack issues: [Paystack Support](https://support.paystack.com/)
For questions about this implementation: Contact your admin

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
