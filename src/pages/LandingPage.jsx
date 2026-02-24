import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  MapPin,
  BarChart3,
  Menu,
  X,
  Sun,
  Moon,
  Send,
  Heart,
  Trash2,
  CheckCircle,
  Code2,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  User,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import toast from "react-hot-toast";

// --- Scroll Reveal Hook ---
const useScrollReveal = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
};

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // CRITICAL: Added this state
  const [billingCycle, setBillingCycle] = useState("monthly"); // Added for price toggle
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [featRef, featVis] = useScrollReveal();
  const toggleTheme = () => setDarkMode(!darkMode);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Session Terminated Safely");
      setIsProfileOpen(false);
      navigate("/");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Firestore Error:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!user) return toast.error("Login to broadcast");
    if (!postText.trim()) return;
    const loadingToast = toast.loading("Broadcasting...");
    try {
      await addDoc(collection(db, "posts"), {
        adminName: user.email.split("@")[0],
        adminEmail: user.email,
        businessId: user.uid,
        content: postText,
        likes: 0,
        createdAt: serverTimestamp(),
      });
      setPostText("");
      toast.dismiss(loadingToast);
      toast.success("Broadcast Live!");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Permission Denied: Unauthorized Terminal");
    }
  };

  // --- STABILIZED PAYSTACK LOGIC ---
  // --- STABILIZED PAYSTACK LOGIC WITH EXPIRY ---
  const handleUpgrade = useCallback(() => {
    if (!user) {
      toast.error("Auth required for Terminal Upgrade");
      return navigate('/login');
    }

    if (!window.PaystackPop) {
      toast.error("Payment gateway failed to load. Please refresh.");
      return;
    }

    setIsProcessing(true);

    const amount = billingCycle === 'monthly' ? 2500 : 25000;

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100,
      currency: "NGN",
      metadata: {
        userId: user.uid,
        planType: billingCycle,
        custom_fields: [{ display_name: "Plan", variable_name: "plan", value: "enterprise" }]
      },
      callback: async function (response) {
        setIsProcessing(false);
        const verifying = toast.loading("Verifying transaction...");

        // --- EXPIRY CALCULATION LOGIC ---
        const now = new Date();
        const expiryDate = new Date();
        if (billingCycle === 'monthly') {
          expiryDate.setMonth(now.getMonth() + 1);
        } else {
          expiryDate.setFullYear(now.getFullYear() + 1);
        }

        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            plan: 'pro',
            subscriptionActive: true,
            billingCycle: billingCycle,
            expiresAt: expiryDate, // Store the date the sub ends
            lastPaymentRef: response.reference,
            updatedAt: serverTimestamp()
          });
          toast.dismiss(verifying);
          toast.success("Enterprise Terminal Activated!");
          navigate('/dashboard');
        } catch (e) {
          toast.dismiss(verifying);
          toast.error("Database update failed. Contact support.");
        }
      },
      onClose: () => {
        setIsProcessing(false);
        toast.error("Transaction cancelled.");
      }
    });

    handler.openIframe();
  }, [user, navigate, billingCycle]);

  const handleLike = async (postId) => {
    if (!user) return toast.error("Login to interact");
    try {
      await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Terminate this broadcast?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        toast.success("Broadcast Deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-sans antialiased overflow-x-hidden ${darkMode ? "bg-[#050505] text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className={`absolute inset-0 opacity-20 ${darkMode ? "bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" : ""}`}
        ></div>
        <div
          className={`absolute top-0 left-0 w-full h-full ${darkMode ? "bg-gradient-to-b from-blue-600/10 to-transparent" : "bg-gradient-to-b from-blue-100 to-transparent"}`}
        ></div>
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div
          className={`fixed inset-0 z-[100] p-8 flex flex-col transition-all duration-300 ${darkMode ? "bg-[#050505]" : "bg-white"}`}
        >
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">
                A
              </div>
              <span className="font-black uppercase tracking-tighter">
                Attendly
              </span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2">
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col gap-8">
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="text-4xl font-black italic uppercase text-blue-600"
              >
                Dashboard
              </Link>
            )}
            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl font-black italic uppercase"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl font-black italic uppercase"
            >
              Pricing
            </a>
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-black italic uppercase"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-black italic uppercase text-blue-600"
                >
                  Join Now
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-4xl font-black italic uppercase text-red-500 text-left"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10">
        <nav
          className={`sticky top-0 z-50 px-6 py-4 md:px-12 backdrop-blur-md border-b transition-all ${darkMode ? "border-white/5 bg-[#050505]/80" : "border-black/5 bg-white/80"}`}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white group-hover:rotate-12 transition-transform shadow-lg">
                A
              </div>
              <span className="text-xl font-black uppercase tracking-tighter">
                Attendly
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
              <a
                href="#features"
                className="hover:text-blue-500 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="hover:text-blue-500 transition-colors"
              >
                Pricing
              </a>
              <a
                href="https://portfolio-s4q4.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${darkMode ? "bg-white/5 border-white/5 text-blue-400" : "bg-black/5 border-black/5 text-blue-600"}`}
              >
                <Code2 size={12} /> Dev
              </a>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all ${darkMode ? "bg-white/5 text-yellow-400" : "bg-black/5 text-blue-600"}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {!loading &&
                (!user ? (
                  <div className="hidden sm:flex items-center gap-6">
                    <Link
                      to="/login"
                      className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl transition-all"
                    >
                      Join Now
                    </Link>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border transition-all ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs uppercase">
                        {user.email[0]}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-[9px] font-black uppercase tracking-tighter leading-none mb-1 text-blue-500">
                          Active Admin
                        </p>
                        <p className="text-[10px] opacity-50 truncate max-w-[120px]">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isProfileOpen && (
                      <div
                        className={`absolute right-0 mt-3 w-56 rounded-[2rem] border p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-100"}`}
                      >
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                        >
                          <LayoutDashboard
                            size={16}
                            className="text-blue-500"
                          />{" "}
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black uppercase text-red-500 transition-all ${darkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-2 text-blue-600"
              >
                <Menu />
              </button>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header className="pt-20 md:pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-8 ${darkMode ? "border-blue-500/30 text-blue-400 bg-blue-500/5" : "border-blue-200 text-blue-600 bg-blue-50"}`}
          >
            <Zap size={14} fill="currentColor" /> System v2.0 Live
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-[9rem] font-black tracking-[-0.06em] leading-[0.9] mb-10 uppercase">
            Presence <br />{" "}
            <span className="text-blue-600 italic">Secured.</span>
          </h1>
          <p
            className={`text-base md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed opacity-80 font-medium`}
          >
            Zero-Trust terminal infrastructure for the modern workforce. Built
            for speed, security, and absolute accountability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              {user ? "Enter Dashboard" : "Deploy Now"}{" "}
              <ArrowRight className="inline-block ml-2" size={16} />
            </Link>
          </div>
        </header>

        {/* FEATURES SECTION */}
        <section
          id="features"
          ref={featRef}
          className={`max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ${featVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <FeatureCard
            darkMode={darkMode}
            icon={<MapPin size={24} />}
            title="Geo-Guard"
            desc="Military-grade GPS fencing requires staff to be within 100m of the physical job site."
          />
          <FeatureCard
            darkMode={darkMode}
            icon={<ShieldCheck size={24} />}
            title="Anti-Spoof"
            desc="Dynamic, encrypted QR codes prevent screenshot sharing and attendance fraud."
          />
          <FeatureCard
            darkMode={darkMode}
            icon={<BarChart3 size={24} />}
            title="Live Data"
            desc="Watch your team arrive and leave in real-time with granular dashboard analytics."
          />
        </section>

        {/* PRICING SECTION */}
        <section
          id="pricing"
          className="max-w-4xl mx-auto px-6 py-32 border-t border-white/5"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
              Pricing
            </h2>

            {/* Toggle Switch */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${billingCycle === "monthly" ? "text-blue-500" : "opacity-40"}`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingCycle((prev) =>
                    prev === "monthly" ? "yearly" : "monthly",
                  )
                }
                className={`w-12 h-6 rounded-full relative p-1 transition-colors ${darkMode ? "bg-white/10" : "bg-black/5"}`}
              >
                <div
                  className={`w-4 h-4 bg-blue-600 rounded-full transition-transform ${billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${billingCycle === "yearly" ? "text-blue-500" : "opacity-40"}`}
              >
                Yearly{" "}
                <span className="text-[8px] text-green-500 font-bold ml-1">
                  SAVE 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div
              className={`p-10 rounded-[3rem] border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100 shadow-xl"}`}
            >
              <h3 className="text-xs font-black uppercase tracking-widest mb-2 opacity-50">
                Standard
              </h3>
              <div className="text-5xl font-black mb-6">
                ₦0 <span className="text-xs opacity-50">/mo</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-60">
                  <CheckCircle size={14} className="text-blue-500" /> 5 Staff
                  Members
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-60">
                  <CheckCircle size={14} className="text-blue-500" /> Basic
                  Geo-fencing
                </li>
              </ul>
              <Link
                to="/register"
                className={`block text-center py-4 rounded-xl text-[10px] font-black uppercase border transition-all ${darkMode ? "border-white/10 hover:bg-white text-white hover:text-black" : "border-black/10 hover:bg-black text-black hover:text-white"}`}
              >
                Get Started
              </Link>
            </div>

            <div className="p-10 rounded-[3rem] border-2 border-blue-600 bg-blue-600/5 relative overflow-hidden group">
              <div className="absolute top-4 right-6 text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-full">
                Pro
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-blue-500">
                Enterprise
              </h3>
              <div className="text-5xl font-black mb-6 text-blue-600">
                ₦{billingCycle === "monthly" ? "2.5k" : "25k"}
                <span className="text-xs opacity-50 text-white ml-1">
                  /{billingCycle === "monthly" ? "mo" : "yr"}
                </span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-400">
                  <CheckCircle
                    size={14}
                    className="text-blue-600 fill-blue-600/20"
                  />{" "}
                  Unlimited Staff
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-400">
                  <CheckCircle
                    size={14}
                    className="text-blue-600 fill-blue-600/20"
                  />{" "}
                  Advanced Analytics
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-400">
                  <CheckCircle
                    size={14}
                    className="text-blue-600 fill-blue-600/20"
                  />{" "}
                  Custom Reports
                </li>
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Upgrade Terminal <ExternalLink size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* BROADCAST FEED */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">
              Broadcasts
            </h2>
            <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
              Network Active
            </span>
          </div>

          <div
            className={`rounded-[2.5rem] p-8 mb-12 border transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-lg"}`}
          >
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Post a system broadcast..."
              className="w-full bg-transparent border-none focus:ring-0 text-base h-24 resize-none font-medium outline-none"
            />
            <div className="flex justify-end pt-6 border-t border-white/5">
              <button
                onClick={handlePost}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                Send <Send size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`rounded-[2.5rem] p-8 border transition-all ${darkMode ? "bg-[#0a0a0a] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm hover:shadow-xl"}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-black text-white text-sm uppercase">
                      {post.adminName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {post.adminName}
                        </h4>
                        <CheckCircle
                          size={14}
                          className="text-blue-500"
                          fill="currentColor"
                          fillOpacity={0.1}
                        />
                      </div>
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
                        Verified Admin
                      </p>
                    </div>
                  </div>
                  {user?.email === post.adminEmail && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-all hover:scale-110"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-base mb-8 leading-relaxed opacity-90 font-medium">
                  {post.content}
                </p>
                <div className="flex gap-8 pt-6 border-t border-white/5">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-all active:scale-125"
                  >
                    <Heart
                      size={18}
                      className={
                        post.likes > 0
                          ? "fill-red-500 text-red-500 border-none"
                          : ""
                      }
                    />{" "}
                    {post.likes || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          className={`py-20 border-t ${darkMode ? "border-white/5" : "border-gray-200"}`}
        >
          <div className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">
            Attendly Terminal © 2026 // Abia, NG
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, darkMode }) => (
  <div
    className={`p-10 border rounded-[3rem] transition-all duration-500 group ${darkMode ? "bg-white/5 border-white/5 hover:bg-white/[0.08]" : "bg-white border-gray-100 hover:shadow-2xl"}`}
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-blue-600 text-white shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <h4 className="text-xl font-black uppercase tracking-tight mb-4 italic leading-none">
      {title}
    </h4>
    <p
      className={`text-sm font-medium leading-relaxed ${darkMode ? "text-gray-500" : "text-gray-600"}`}
    >
      {desc}
    </p>
  </div>
);

export default LandingPage;
