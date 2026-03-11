# 🚀 Quick Start Guide - Payment System

## ⚡ 5-Minute Setup

### Step 1: Get Paystack API Key (2 minutes)
```
1. Go to https://paystack.com
2. Sign up or login
3. Go to Settings → API Keys & Webhooks
4. Copy your PUBLIC KEY (starts with pk_test_)
```

### Step 2: Create .env File (30 seconds)
Create file: `.env` in root directory:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_paste_your_key_here
```

**⚠️ IMPORTANT:** Don't commit `.env` - it's in `.gitignore`

### Step 3: Restart Dev Server (1 minute)
```bash
npm run dev
```

### Step 4: Test Payment (1.5 minutes)
```
1. Open http://localhost:5173/
2. Click "Upgrade Terminal" button
3. Select MiniPro (₦5,000)
4. Click "Upgrade Now"
5. Use test card: 4111 1111 1111 1111
6. OTP: 123456
7. Watch Dashboard update!
```

✅ **Done!** Your payment system is working.

---

## 📦 What You Got

### New Files:
- ✅ `subscriptionService.js` - Subscription logic
- ✅ `PricingModal.jsx` - Payment UI
- ✅ `SubscriptionBadge.jsx` - Status badge
- ✅ `SubscriptionCard.jsx` - Dashboard card
- ✅ `Pricing.jsx` - Full pricing page

### Updated Files:
- ✅ `App.jsx` - Added `/pricing` route
- ✅ `LandingPage.jsx` - Pricing modal
- ✅ `Layout.jsx` - Subscription badge and menu
- ✅ `Dashboard.jsx` - Subscription card

### Documentation:
- ✅ `PAYMENT_SETUP.md` - Detailed setup
- ✅ `IMPLEMENTATION_GUIDE.md` - Developer guide
- ✅ `PAYMENT_SYSTEM_SUMMARY.md` - Complete overview

---

## 💰 Pricing Structure

| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| **Free** | ₦0 | Forever | 5 employees, basic tracking |
| **MiniPro** | ₦5,000 | 30 days | 50 employees, advanced features |
| **Pro** | ₦45,000 | 365 days | Unlimited employees, all features |

---

## 🎯 Key Features

✅ **Paystack Integration** - Secure payment processing
✅ **Auto Plan Downgrade** - Expires automatically after duration
✅ **Smart Badges** - Shows current plan & days remaining
✅ **Mobile Ready** - Works perfectly on all devices
✅ **Bank Details** - Optional storage for future transfers
✅ **Beautiful UI** - Dark/light mode compatible

---

## 📍 Where Payment Appears

1. **Landing Page** - "Upgrade Terminal" button
2. **Dashboard** - Subscription card at top
3. **Sidebar** - "Upgrade Plan" menu link
4. **Nav Header** - Plan badge showing status
5. **Dedicated Page** - `/pricing` full pricing page

---

## 🧪 Test With These Cards

```
VISA
Number: 4111 1111 1111 1111
CVV: Any 3 digits
Exp: Any future date
OTP: 123456

MASTERCARD
Number: 5555 5555 5555 4444
CVV: Any 3 digits
Exp: Any future date
OTP: 123456

VERVE
Number: 5061 0000 0000 0000
CVV: Any 3 digits
Exp: Any future date
OTP: 123456
```

---

## 🔄 Payment Flow

```
User → Click Upgrade → Modal Opens → Select Plan → 
Enter Payment → Paystack Processes → Firebase Updates → 
Dashboard Shows New Plan → Auto-expires after duration
```

---

## ⚠️ Important

1. **Never commit `.env`** - It's automatically ignored
2. Use test keys first - Don't use live keys in development
3. Check PAYMENT_SETUP.md for advanced config
4. Refer to IMPLEMENTATION_GUIDE.md for troubleshooting

---

## 📚 Full Documentation

1. **Quick Reference:** THIS FILE
2. **Setup Details:** `PAYMENT_SETUP.md`
3. **Developer Guide:** `IMPLEMENTATION_GUIDE.md`
4. **Complete Overview:** `PAYMENT_SYSTEM_SUMMARY.md`

---

## 🎬 Next Steps

- [ ] Get Paystack API key
- [ ] Create `.env` file
- [ ] Restart dev server
- [ ] Test with test cards
- [ ] Review PAYMENT_SETUP.md
- [ ] (Later) Switch to live keys for production

---

## 💡 Pro Tips

💡 **Test Dashboard Auto-Expiry**
Set plan to expire in 1 second and watch it downgrade instantly

💡 **Check Firebase**
Open Firebase console to see user subscription data update in real-time

💡 **Monitor Paystack**
Watch your Paystack dashboard for test transactions

💡 **Mobile Test**
The entire system is fully responsive - test on your phone!

---

## 🆘 Quick Troubleshooting

**"Payment system not configured"**
→ Check your VITE_PAYSTACK_PUBLIC_KEY in .env file

**"Plan doesn't update"**
→ Check Firebase connection in console

**"Payment modal doesn't open"**
→ Make sure you're logged in

**"Card declined"**
→ Use exact test card numbers above

---

## 🎉 You're All Set!

Everything is ready. Just add your Paystack keys and test.

**Questions?** Check the detailed guides:
- PAYMENT_SETUP.md - Setup questions
- IMPLEMENTATION_GUIDE.md - Technical questions
- PAYMENT_SYSTEM_SUMMARY.md - Feature overview

**Happy Coding!** 🚀
