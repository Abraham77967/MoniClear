import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'social' | 'email' | 'phone'>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cardHeight, setCardHeight] = useState(400);
  const contentRef = useRef<HTMLDivElement>(null);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithPhone, signInAsGuest, resetPassword, sendVerificationEmail, loading, user } = useAuth();

  // Measure and update card height with smooth transitions
  const updateCardHeight = () => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const padding = activeTab === 'email' ? 100 : 64; // Even more padding for email tab
      const newHeight = contentHeight + padding;
      const minHeight = activeTab === 'email' ? 600 : 320; // Even higher minimum for email tab
      const finalHeight = Math.max(newHeight, minHeight);

      console.log(`Tab: ${activeTab}, Content: ${contentHeight}, Padding: ${padding}, New: ${newHeight}, Min: ${minHeight}, Final: ${finalHeight}`);
      console.log('Content element:', contentRef.current);
      console.log('Current card height:', cardHeight);
      setCardHeight(finalHeight);
    }
  };

  // Update height when tab or mode changes
  useEffect(() => {
    // Multiple measurements to ensure accuracy
    const timer1 = setTimeout(() => updateCardHeight(), 100);
    const timer2 = setTimeout(() => updateCardHeight(), 250); // Second measurement
    const timer3 = setTimeout(() => updateCardHeight(), 500); // Third measurement for safety

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [activeTab, isSignUp]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed');
    }
  };


  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setSuccessMessage('✅ Account created! Please check your email for verification link.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      // Handle specific Firebase auth errors with user-friendly messages
      let errorMessage = 'Authentication failed';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Try again or reset your password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      setSuccessMessage('');
      return;
    }

    try {
      setError('');
      await resetPassword(email);
      setSuccessMessage('✅ Password reset email sent! Check your inbox.');
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setSuccessMessage('');
    }
  };

  const handleResendVerification = async () => {
    try {
      setError('');
      await sendVerificationEmail();
      setSuccessMessage('✅ Verification email sent! Check your inbox.');
    } catch (error: any) {
      setError(error.message || 'Failed to send verification email');
      setSuccessMessage('');
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setError('');
      await signInWithPhone(phoneNumber);
    } catch (error: any) {
      setError(error.message || 'Phone sign-in failed');
    }
  };

  const handleGuestSignIn = () => {
    signInAsGuest();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30"
          >
            <Wallet size={32} strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">MoniClear</h1>
          <p className="text-slate-500 font-medium">Take control of your finances</p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-medium"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, height: 400 }}
          animate={{ opacity: 1, y: 0, height: cardHeight }}
          transition={{
            height: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { delay: 0.1 },
            y: { delay: 0.1 }
          }}
          className="bg-yellow-50 p-8 rounded-[2.5rem] shadow-2xl border border-yellow-200 flex flex-col"
        >
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            {[
              { id: 'social', label: 'Social', icon: ShieldCheck },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'phone', label: 'Phone', icon: Phone }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div ref={contentRef} className="flex-1">
            {/* Social Login */}
            {activeTab === 'social' && (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 flex flex-col h-full justify-start"
                layout
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="font-semibold text-slate-700">Continue with Google</span>
                </button>


                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">or</span>
                  </div>
                </div>

                <button
                  onClick={handleGuestSignIn}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all group"
                >
                  <User size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Continue as Guest</span>
                </button>
              </motion.div>
            )}

            {/* Email Login */}
            {activeTab === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleEmailAuth}
                className="space-y-4 flex flex-col h-full justify-start"
                layout
                transition={{ duration: 0.3 }}
              >
                {/* Mode Header */}
                <div className="text-center pb-2">
                  <h3 className={`text-xl font-bold mb-1 ${isSignUp ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isSignUp
                      ? 'Join MoniClear to manage your finances'
                      : 'Sign in to access your financial data'
                    }
                  </p>
                </div>
                {/* Form Fields Container */}
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  isSignUp
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-blue-50/50 border-blue-200'
                }`}>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Mail size={16} className={isSignUp ? 'text-emerald-600' : 'text-blue-600'} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-4 transition-all ${
                        isSignUp
                          ? 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                          : 'border-blue-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      placeholder={isSignUp ? "your.email@example.com" : "Enter your email"}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <svg className={`w-4 h-4 ${isSignUp ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                      {isSignUp && <span className="text-xs font-normal text-slate-500">(min. 6 characters)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:outline-none focus:ring-4 transition-all ${
                          isSignUp
                            ? 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                            : 'border-blue-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                        placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="mt-3 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs text-emerald-800">
                          <p className="font-medium mb-1">After signing up:</p>
                          <p>• Check your email for verification</p>
                          <p>• Click the link to activate your account</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isSignUp
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isSignUp ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      )}
                    </svg>
                  )}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>

                <div className="mt-auto pt-4 space-y-3">
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Forgot Password?
                    </button>
                  )}

                  {user && !user.emailVerified && !isSignUp && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend Verification
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="w-full text-center text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* Phone Login */}
            {activeTab === 'phone' && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePhoneSignIn}
                className="space-y-4 flex flex-col h-full justify-start"
                layout
                transition={{ duration: 0.3 }}
              >
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : null}
                  Send Verification Code
                </button>

                <div className="mt-auto pt-4">
                  <p className="text-xs text-slate-500 text-center">
                    We'll send you a verification code to confirm your phone number
                  </p>
                </div>
              </motion.form>
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-slate-400 font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
