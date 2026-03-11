import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserSubscription, getDaysRemaining, formatExpiryDate } from "../services/subscriptionService";
import { Crown, AlertCircle, Zap, ArrowRight, Calendar } from "lucide-react";

export default function SubscriptionCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSubscription = async () => {
      try {
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);
        if (sub.expiresAt) {
          setDaysLeft(getDaysRemaining(sub.expiresAt));
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.uid]);

  if (loading || !subscription) return null;

  const getPlanColor = () => {
    switch (subscription.plan) {
      case "pro":
        return "from-purple-600 to-purple-700";
      case "minipro":
        return "from-blue-600 to-blue-700";
      default:
        return "from-slate-600 to-slate-700";
    }
  };

  const getPlanIcon = () => {
    switch (subscription.plan) {
      case "pro":
        return <Crown className="w-6 h-6" />;
      case "minipro":
        return <Zap className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
  const isExpired = daysLeft <= 0 && subscription.plan !== "free";

  return (
    <div
      className={`bg-gradient-to-r ${getPlanColor()} rounded-[2rem] p-8 text-white shadow-xl border border-white/10 relative overflow-hidden ${
        isExpired ? "ring-2 ring-red-500" : ""
      }`}
    >
      {/* Animated background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {getPlanIcon()}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide opacity-80">
                Current Plan
              </h3>
              <p className="text-2xl font-black">{subscription.plan.toUpperCase()}</p>
            </div>
          </div>

          {!isExpired && subscription.plan !== "free" && daysLeft > 0 && (
            <div className="text-right">
              <p className="text-xs opacity-75 uppercase tracking-wide">Days Remaining</p>
              <p className="text-3xl font-black">{daysLeft}</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-500/20 rounded-lg border border-red-500/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Subscription Expired</p>
              <p className="text-xs opacity-90">
                Your {subscription.plan} subscription has expired. Upgrade to regain premium features.
              </p>
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Expiring Soon</p>
              <p className="text-xs opacity-90">
                Your subscription expires in {daysLeft} days on {formatExpiryDate(subscription.expiresAt)}
              </p>
            </div>
          </div>
        )}

        {subscription.plan !== "free" && !isExpired && daysLeft > 7 && subscription.expiresAt && (
          <div className="flex items-center gap-2 mb-6 text-sm opacity-90">
            <Calendar className="w-4 h-4" />
            Expires on {formatExpiryDate(subscription.expiresAt)}
          </div>
        )}

        {subscription.plan === "free" && (
          <p className="text-sm opacity-90 mb-6">
            Unlock premium features by upgrading to MiniPro or Pro plan.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {subscription.plan !== "pro" && (
            <button
              onClick={() => navigate("/pricing")}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 border border-white/30"
            >
              View Plans
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate("/pricing")}
            className="px-6 py-3 bg-[#f8fafc] hover:bg-slate-200 text-slate-900 font-bold text-sm uppercase tracking-wide rounded-xl transition-all border border-slate-300"
          >
            {subscription.plan === "pro" ? "Manage Subscription" : "Upgrade Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
