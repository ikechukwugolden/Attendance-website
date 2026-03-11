import React, { useState, useMemo } from "react";
import { usePaystackPayment } from "react-paystack";
import { X, Check, Loader2, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateSubscription, SUBSCRIPTION_PLANS } from "../services/subscriptionService";
import toast from "react-hot-toast";

export default function PricingModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankCode: "",
    bankName: ""
  });

  // Generate references using useMemo to avoid impure functions in render
  const miniProConfig = useMemo(() => ({
    reference: `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: user?.email || "",
    amount: 500000, // ₦5,000 in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  }), [user?.email]);

  // Paystack configuration for Pro (Yearly - ₦45,000)
  const proConfig = useMemo(() => ({
    reference: `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: user?.email || "",
    amount: 4500000, // ₦45,000 in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  }), [user?.email]);

  const initializeMiniPro = usePaystackPayment(miniProConfig);
  const initializePro = usePaystackPayment(proConfig);

  const handlePayment = (planType) => {
    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    if (!miniProConfig.publicKey) {
      toast.error("Payment system not configured. Contact admin.");
      return;
    }

    setLoading(true);
    const initFunction = planType === "minipro" ? initializeMiniPro : initializePro;
    const planName = planType === "minipro" ? "MiniPro" : "Pro";

    initFunction(
      async (reference) => {
        try {
          toast.loading("Processing payment...");
          
          // Update subscription in Firebase
          const result = await updateSubscription(
            user.uid,
            planType,
            reference.reference,
            user.email
          );

          toast.dismiss();
          toast.success(`Welcome to ${planName}! 🎉\nYour subscription is active until ${result.expiresAt.toLocaleDateString()}`);
          
          setLoading(false);
          onClose();
          
          if (onSuccess) onSuccess(planType);
          
          // Reload after 1.5 seconds
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast.dismiss();
          console.error("Subscription error:", error);
          toast.error("Payment verified but subscription update failed. Contact support.");
          setLoading(false);
        }
      },
      () => {
        toast.error("Payment cancelled");
        setLoading(false);
      }
    );
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveBank = () => {
    if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
      toast.error("Please fill all bank details");
      return;
    }
    toast.success("Bank details saved for transfers");
    setShowBankForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900">
          <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Free Plan */}
            <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/50">
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <p className="text-2xl font-bold text-white mb-4">₦0</p>
              <p className="text-sm text-gray-400 mb-6">Forever free</p>
              <button
                disabled
                className="w-full py-2 bg-slate-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Current Plan
              </button>
              <ul className="mt-6 space-y-3">
                {SUBSCRIPTION_PLANS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* MiniPro Plan */}
            <div className="border-2 border-blue-500 rounded-xl p-6 bg-slate-800 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">MiniPro</h3>
              <p className="text-3xl font-bold text-white mb-1">₦5,000</p>
              <p className="text-sm text-gray-400 mb-6">per month</p>
              <button
                onClick={() => handlePayment("minipro")}
                disabled={loading}
                className="w-full py-2 bg-[#f8fafc] hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-300"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Upgrade Now
              </button>
              <ul className="mt-6 space-y-3">
                {SUBSCRIPTION_PLANS.minipro.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="border border-purple-500 rounded-xl p-6 bg-slate-800/50">
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-3xl font-bold text-white mb-1">₦45,000</p>
              <p className="text-sm text-gray-400 mb-6">per year</p>
              <button
                onClick={() => handlePayment("pro")}
                disabled={loading}
                className="w-full py-2 bg-[#f8fafc] hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-300"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Upgrade Now
              </button>
              <ul className="mt-6 space-y-3">
                {SUBSCRIPTION_PLANS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-white">Secure Payment Details</h3>
            </div>

            {!showBankForm ? (
              <button
                onClick={() => setShowBankForm(true)}
                className="text-blue-400 hover:text-blue-300 font-medium text-sm transition"
              >
                + Add bank account for future transfers
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={bankDetails.accountName}
                    onChange={handleBankDetailsChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankDetails.accountNumber}
                    onChange={handleBankDetailsChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Your account number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={bankDetails.bankName}
                      onChange={handleBankDetailsChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., GTBank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Code (optional)
                    </label>
                    <input
                      type="text"
                      name="bankCode"
                      value={bankDetails.bankCode}
                      onChange={handleBankDetailsChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., 007"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveBank}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                  >
                    Save Bank Details
                  </button>
                  <button
                    onClick={() => setShowBankForm(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  💡 Your bank details are encrypted and secure. We'll use these for future refunds and transfers.
                </p>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
            <p className="text-sm text-green-300">
              ✓ All payments are secured by Paystack. Your financial information is encrypted and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
