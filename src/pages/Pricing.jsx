import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserSubscription, formatExpiryDate, getDaysRemaining } from "../services/subscriptionService";
import PricingModal from "../components/PricingModal";
import SubscriptionBadge from "../components/SubscriptionBadge";
import { ArrowLeft, Calendar, Check, Zap, Crown } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    const fetchSubscription = async () => {
      try {
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);
        if (sub.expiresAt) {
          setDaysLeft(getDaysRemaining(sub.expiresAt));
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to load subscription info");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSubscription, 300000);
    return () => clearInterval(interval);
  }, [user?.uid, navigate]);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₦0",
      period: "Forever",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 employees",
        "Basic attendance tracking",
        "Daily reports",
        "GPS check-in",
        "Community support",
        "Basic geo-fencing"
      ],
      highlight: false,
      badge: "STARTER"
    },
    {
      id: "minipro",
      name: "MiniPro",
      price: "₦5,000",
      period: "30 days",
      description: "Great for growing businesses",
      features: [
        "Up to 50 employees",
        "Advanced analytics",
        "Shift management",
        "Geo-fencing with radius control",
        "Custom reports",
        "API access",
        "Email support",
        "Schedule management"
      ],
      highlight: true,
      badge: "POPULAR"
    },
    {
      id: "pro",
      name: "Pro",
      price: "₦45,000",
      period: "365 days",
      description: "Enterprise-grade features for large organizations",
      features: [
        "Unlimited employees",
        "Advanced analytics & AI insights",
        "Shift management",
        "Advanced geo-fencing",
        "Custom reports & dashboards",
        "Full API access",
        "Priority support",
        "Bulk operations",
        "Team management",
        "Advanced security"
      ],
      highlight: false,
      badge: "PROFESSIONAL"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <SubscriptionBadge />
        </div>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-300 mb-8">
          Upgrade your attendance management system with powerful features
        </p>

        {/* Current Subscription Info */}
        {subscription && subscription.plan !== "free" && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 mb-12 inline-block">
            <p className="text-sm text-blue-200 mb-2">Your Current Plan</p>
            <p className="text-2xl font-bold text-blue-400 mb-2">
              {subscription.plan.toUpperCase()}
            </p>
            {subscription.expiresAt && (
              <div className="flex items-center gap-2 justify-center text-blue-300">
                <Calendar className="w-4 h-4" />
                <span>
                  Expires on {formatExpiryDate(subscription.expiresAt)}
                  {daysLeft > 0 && ` (${daysLeft} days remaining)`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden transition-all ${
                  plan.highlight
                    ? "border-2 border-blue-500 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl shadow-blue-500/20 transform scale-105"
                    : "border border-slate-700 bg-slate-800/50"
                }`}
              >
                {/* Badge */}
                <div className="absolute top-0 right-0 left-0 flex justify-between items-start p-6">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    plan.highlight
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-gray-300"
                  }`}>
                    {plan.badge}
                  </span>
                  {isCurrentPlan && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/50">
                      Current
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 pt-24">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  <div className="mb-8">
                    <div className="text-4xl font-bold mb-2">{plan.price}</div>
                    <div className="text-sm text-gray-400">per {plan.period}</div>
                  </div>

                  {/* Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed mb-8"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPricingOpen(true)}
                      className="w-full py-3 rounded-lg font-semibold transition-all mb-8 bg-[#f8fafc] hover:bg-slate-200 text-slate-900 shadow-lg border border-slate-300"
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}

                  {/* Features */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Features Included</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm text-gray-300"
                        >
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I upgrade or downgrade anytime?",
                a: "Yes! You can upgrade at any time and your subscription will be updated immediately. If you downgrade, the change will take effect at the end of your current billing period."
              },
              {
                q: "What happens when my subscription expires?",
                a: "When your subscription expires, your account will automatically be downgraded to the Free plan. You'll retain your data but lose access to premium features."
              },
              {
                q: "How is payment handled?",
                a: "We use Paystack for secure payment processing. Your payment information is encrypted and never stored on our servers directly."
              },
              {
                q: "Can I get a refund?",
                a: "Refund requests must be made within 7 days of purchase. Refunds are processed back to the original payment method within 5-7 business days."
              },
              {
                q: "Do you offer annual discounts?",
                a: "Yes! Our Pro plan (₦45,000/year) gives you a 20% discount compared to monthly billing. You get an extra month free!"
              }
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-700 rounded-lg p-6 bg-slate-800/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  {item.q}
                </h3>
                <p className="text-gray-300 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-20 text-center p-8 border border-slate-700 rounded-xl bg-slate-800/50">
          <h3 className="text-xl font-bold mb-4">Need Help Choosing?</h3>
          <p className="text-gray-300 mb-6">
            Our support team is here to help you find the perfect plan for your business.
          </p>
          <a
            href="mailto:support@attendly.com"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Contact Support
          </a>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSuccess={() => setIsPricingOpen(false)}
      />
    </div>
  );
}
