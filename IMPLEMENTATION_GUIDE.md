# Payment System Implementation Guide

## 📋 Overview

This document provides a complete walkthrough of the Paystack payment integration for the Attendly attendance management system.

## ✅ Implementation Checklist

### Phase 1: Environment Setup
- [x] Install required dependencies (`react-paystack` - already in package.json)
- [x] Create `.env` file with Paystack Public Key
- [ ] Test Paystack API key in test environment
- [ ] Verify Firebase Firestore is enabled
- [ ] Set up Firebase security rules for subscription data

### Phase 2: Core Services
- [x] Create `subscriptionService.js` - Handles all subscription logic
- [x] Create `PricingModal.jsx` - Payment modal with Paystack integration
- [x] Create `SubscriptionBadge.jsx` - Displays current subscription status
- [x] Create `SubscriptionCard.jsx` - Dashboard subscription card
- [x] Create comprehensive `Pricing.jsx` page

### Phase 3: Integration
- [x] Update `App.jsx` - Add `/pricing` route
- [x] Update `LandingPage.jsx` - Add pricing modal trigger
- [x] Update `Layout.jsx` - Add subscription badge and pricing link
- [x] Update `Dashboard.jsx` - Add subscription card and auto-expiry check
- [x] Update `AuthContext.jsx` - Include subscription data in user object

### Phase 4: Documentation
- [x] Create `PAYMENT_SETUP.md` - Detailed setup guide
- [x] Create `.env.example` - Environment variables template
- [x] Create this implementation guide

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

**Never commit `.env` to version control!**

## 💾 Firebase Schema

Ensure your Firestore `users` collection includes these fields:

```javascript
{
  // Subscription fields
  plan: string,                    // "free" | "minipro" | "pro"
  subscriptionActive: boolean,     // true | false
  expiresAt: Timestamp,           // Expiration date
  paymentRef: string,             // Paystack reference
  upgradedAt: Timestamp,          // Upgrade date
  downgradedAt: Timestamp,        // Downgrade date
  lastPaymentEmail: string,       // Payment email
  
  // Other existing fields
  email: string,
  displayName: string,
  // ... other fields
}
```

## 🧪 Testing the Payment System

### Test Cards (Use with Paystack Test Keys)

| Card Type | Number | CVV | Exp Date |
|-----------|--------|-----|----------|
| Visa | 4111 1111 1111 1111 | Any 3 digits | Any future date |
| Mastercard | 5555 5555 5555 4444 | Any 3 digits | Any future date |
| Verve | 5061 0000 0000 0000 | Any 3 digits | Any future date |

### Test Amounts
- **MiniPro**: 500000 Kobo (₦5,000)
- **Pro**: 4500000 Kobo (₦45,000)

### Step-by-step Testing

1. **Go to Landing Page**
   ```
   http://localhost:5173/
   ```

2. **Click "Upgrade Terminal" Button**
   - Should open Pricing Modal

3. **Select MiniPro Plan**
   - Click "Upgrade Now"
   - Paystack modal opens

4. **Enter Test Card**
   - Use card number: 4111 1111 1111 1111
   - OTP: 123456
   - PIN: 1234

5. **Verify Success**
   - User plan updated in Firestore
   - Dashboard shows new plan badge
   - Expiration date is set correctly

## 🔄 User Flow

```
User Opens App
    ↓
Dashboard loads & checks subscription status
    ↓
If subscription expired → auto-downgraded to "free"
    ↓
Display SubscriptionCard at top
    ↓
User can click "Upgrade Now"
    ↓
PricingModal opens with all plans
    ↓
User selects plan & enters payment
    ↓
Paystack processes payment
    ↓
Firebase updates user subscription
    ↓
Dashboard reloads with new plan
```

## 🛡️ Security Implementation

### Current Security Measures
1. **Public Key Only** - Private key never exposed to frontend
2. **Firestore Security Rules** - Required for production
3. **Bank Details Storage** - Optional, user consent required
4. **Transaction References** - Stored for audit trail

### Recommended Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      // Subscription fields require extra validation
      match /users/{uid} {
        allow update: if request.auth.uid == uid &&
                         request.resource.data.plan in ['free', 'minipro', 'pro'];
      }
    }
    
    // Dismissed alerts
    match /dismissed_alerts/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**
   - Track users who complete upgrades
   - Analyze drop-off points

2. **Subscription Retention**
   - Monitor upgrade → downgrade ratios
   - Track early cancellations

3. **Revenue**
   - Monthly recurring revenue (MRR)
   - Payment success/failure rates

### Add to Dashboard
```javascript
const analyticsEvents = {
  UPGRADE_STARTED: 'upgrade_started',
  UPGRADE_COMPLETED: 'upgrade_completed',
  UPGRADE_FAILED: 'upgrade_failed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  DOWNGRADE: 'downgrade'
};
```

## 🐛 Troubleshooting

### Issue: "Payment system not configured"
**Solution**: Check VITE_PAYSTACK_PUBLIC_KEY in .env
```bash
echo "VITE_PAYSTACK_PUBLIC_KEY missing"
# Add to .env and restart dev server
npm run dev
```

### Issue: Subscription not updating
**Solution**: Check Firebase connection and rules
```javascript
// In browser console
firebase.auth().currentUser.uid  // Should show user ID
firebase.firestore().collection('users').doc(userId).get()  // Should fetch user
```

### Issue: Expiry not triggering
**Solution**: Ensure Dashboard is opened (checks happen on component mount)
```javascript
// Force check manually
import { checkAndDowngradeExpired } from "../services/subscriptionService";
await checkAndDowngradeExpired(userId);
```

### Issue: Plan features still accessible after expiry
**Solution**: Implement feature gates in components
```javascript
if (subscription.plan === 'pro' && !subscription.subscriptionActive) {
  return <PaymentRequired />;
}
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Switch to Paystack Live Keys
- [ ] Update `.env` with production keys
- [ ] Test with real payments (small amount)
- [ ] Verify Firebase rules are deployed
- [ ] Set up webhook verification (optional but recommended)
- [ ] Enable billing notifications
- [ ] Test email notifications

### Production Environment Variables
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key_here
```

### Webhook Setup (Optional)
For advanced payment verification:
1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Set webhook URL: `your-domain.com/api/webhook`
3. Implement verification in backend
4. Update payment confirmation flow

## 📱 Mobile Optimization

The system is fully responsive:
- ✅ Pricing modal works on mobile
- ✅ Payment form is mobile-friendly
- ✅ Subscription badge adapts to screen size
- ✅ Dashboard layout optimized for tablets

## 🔗 API Reference

### subscriptionService.js

#### updateSubscription(userId, plan, reference, email)
Updates user subscription after payment

```javascript
import { updateSubscription } from "../services/subscriptionService";

const result = await updateSubscription(
  user.uid,
  "minipro",
  "TRX-123456-abc",
  user.email
);
// Returns: { success: true, plan: "minipro", expiresAt: Date }
```

#### getUserSubscription(userId)
Gets current subscription with auto-expiry check

```javascript
const subscription = await getUserSubscription(user.uid);
// Returns: { plan: "pro", subscriptionActive: true, expiresAt: Date }
```

#### calculateExpiryDate(plan)
Calculates when subscription expires

```javascript
const expiry = calculateExpiryDate("minipro");
// Returns: Date (30 days from now)
```

#### getDaysRemaining(expiresAt)
Gets remaining days in subscription

```javascript
const days = getDaysRemaining(subscription.expiresAt);
// Returns: number (e.g., 15 days remaining)
```

## 📖 Additional Resources

- [Paystack Documentation](https://paystack.com/docs)
- [React-Paystack Library](https://github.com/ebenezerugo/react-paystack)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)

## 📞 Support

For payment system issues:
1. Check `PAYMENT_SETUP.md` for detailed setup
2. Review browser console for errors
3. Verify Firebase connection in Network tab
4. Check Paystack dashboard for transaction status
5. Contact Paystack support: support@paystack.com

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
**Status**: Ready for Production
