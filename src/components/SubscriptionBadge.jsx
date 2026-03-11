import React, { useEffect, useState } from "react";
import { Crown, Zap, Clock } from "lucide-react";
import { getUserSubscription, getDaysRemaining } from "../services/subscriptionService";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionBadge() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSubscription = async () => {
      const sub = await getUserSubscription(user.uid);
      setSubscription(sub);
      
      if (sub.expiresAt) {
        setDaysLeft(getDaysRemaining(sub.expiresAt));
      }
    };

    fetchSubscription();
    // Check every hour for expiry
    const interval = setInterval(fetchSubscription, 3600000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  if (!subscription) return null;

  const getPlanColor = () => {
    switch (subscription.plan) {
      case "pro":
        return "bg-purple-600 text-white";
      case "minipro":
        return "bg-blue-600 text-white";
      default:
        return "bg-slate-700 text-gray-300";
    }
  };

  const getPlanIcon = () => {
    switch (subscription.plan) {
      case "pro":
        return <Crown className="w-3 h-3" />;
      case "minipro":
        return <Zap className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getPlanColor()}`}>
      {getPlanIcon()}
      <span>{subscription.plan.toUpperCase()}</span>
      {subscription.plan !== "free" && subscription.expiresAt && (
        <>
          <span className="text-white/50">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysLeft > 0 ? (
              <span>{daysLeft}d left</span>
            ) : (
              <span className="text-yellow-300">Expires soon</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
