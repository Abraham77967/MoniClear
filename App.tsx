
import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  ShoppingBag,
  CreditCard,
  PieChart as PieIcon,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Save,
  Clock,
  BarChart as BarChartIcon,
  ChevronRight,
  Menu,
  X,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  Pin,
  PinOff,
  Target,
  LogOut
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AppData, Bill, Expense, WishlistItem, ExpenseCategory, IncomeHistory } from './types';
import { CATEGORIES, getNextWednesday } from './constants';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import { firestoreService } from './services/firestoreService';

const AuthenticatedApp: React.FC = () => {
  const { user, isGuest, logout } = useAuth();
  const [firestoreListenerId, setFirestoreListenerId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Data state - will be loaded from Firestore or localStorage
  const [data, setData] = useState<AppData>({
    weeklyEstimate: 0,
    incomeHistory: [],
    bills: [],
    wishlist: [],
    expenses: []
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'bills' | 'expenses' | 'wishlist' | 'reports'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Local state for the income input so it's snappy but syncs with the main data
  const [incomeInput, setIncomeInput] = useState<string>('');

  // Load data from Firestore or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);

      if (user && !isGuest) {
        // Authenticated user - load from Firestore with real-time listener
        const listenerId = firestoreService.listenForUserData(user.uid, (firestoreData) => {
          if (firestoreData) {
            setData(firestoreData);
            setIncomeInput(firestoreData.weeklyEstimate > 0 ? firestoreData.weeklyEstimate.toString() : '');
          } else {
            // Initialize default data
            const defaultData: AppData = {
              weeklyEstimate: 0,
              incomeHistory: [],
              bills: [],
              wishlist: [],
              expenses: []
            };
            setData(defaultData);
            setIncomeInput('');
          }
          setIsLoadingData(false);
        });
        setFirestoreListenerId(listenerId);
      } else if (isGuest) {
        // Guest user - load from localStorage
        const saved = localStorage.getItem('wealthway_data_v2');
        if (saved) {
          const parsedData = JSON.parse(saved);
          setData(parsedData);
          setIncomeInput(parsedData.weeklyEstimate > 0 ? parsedData.weeklyEstimate.toString() : '');
        } else {
          setData({
            weeklyEstimate: 0,
            incomeHistory: [],
            bills: [],
            wishlist: [],
            expenses: []
          });
          setIncomeInput('');
        }
        setIsLoadingData(false);
      }
    };

    loadData();

    // Cleanup function
    return () => {
      if (firestoreListenerId) {
        firestoreService.stopListening(firestoreListenerId);
      }
    };
  }, [user, isGuest]);

  // Save data to Firestore when data changes (only for authenticated users)
  useEffect(() => {
    if (user && !isGuest && !isLoadingData) {
      // Debounce saves to avoid too many writes
      const timeoutId = setTimeout(async () => {
        await firestoreService.saveUserData(user.uid, data);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [data, user, isGuest, isLoadingData]);

  // Sync input if weeklyEstimate changes
  useEffect(() => {
    if (data.weeklyEstimate > 0 && (incomeInput === '' || incomeInput === '0')) {
      setIncomeInput(data.weeklyEstimate.toString());
    }
  }, [data.weeklyEstimate]);

  const totalHistoryIncome = useMemo(() => data.incomeHistory.reduce((acc, curr) => acc + curr.amount, 0), [data.incomeHistory]);
  const totalExpenses = useMemo(() => data.expenses.reduce((acc, curr) => acc + curr.amount, 0), [data.expenses]);
  const totalUnpaidBills = useMemo(() => data.bills.filter(b => !b.isPaid).reduce((acc, curr) => acc + curr.amount, 0), [data.bills]);
  const totalPaidBills = useMemo(() => data.bills.filter(b => b.isPaid).reduce((acc, curr) => acc + curr.amount, 0), [data.bills]);
  
  // Calculate recoverable assets (Paid bills that were marked as deposits)
  const totalHeldDeposits = useMemo(() => 
    data.bills.filter(b => b.isPaid && b.isDeposit).reduce((acc, curr) => acc + curr.amount, 0), 
  [data.bills]);

  // Confirmed balance is liquid cash (Income - Expenses - Paid Bills)
  const confirmedBalance = totalHistoryIncome - totalExpenses - totalPaidBills;
  // Projected balance includes the upcoming weekly estimate
  const projectedBalance = confirmedBalance + data.weeklyEstimate;
  // Total Net Worth includes liquid cash plus recoverable deposits
  const totalNetWorth = confirmedBalance + totalHeldDeposits;

  // Pinned items from wishlist
  const pinnedWishlistItems = useMemo(() => data.wishlist.filter(item => item.isPinned), [data.wishlist]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const togglePin = (id: string) => {
    setData(prev => ({
      ...prev,
      wishlist: prev.wishlist.map(item => 
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    }));
  };

  const markWishlistAsPurchased = (item: WishlistItem) => {
    setData(prev => ({
      ...prev,
      wishlist: prev.wishlist.filter(i => i.id !== item.id),
      expenses: [...prev.expenses, {
        id: `purchased-${generateId()}`,
        description: `Wishlist: ${item.name}`,
        amount: item.price,
        category: 'Shopping',
        date: new Date().toISOString().split('T')[0]
      }]
    }));
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => {
    const active = activeTab === id;
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} 
        className={`w-full flex items-center gap-4 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
          active ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {active && (
          <motion.div 
            layoutId="nav-bg"
            className="absolute inset-0 bg-white shadow-sm glass z-0"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <div className={`relative z-10 p-2 rounded-xl transition-colors ${active ? 'bg-emerald-500 text-white' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <span className="relative z-10 text-sm tracking-tight">{label}</span>
      </button>
    );
  };

  const Dashboard = () => {
    const lastPayday = new Date(getNextWednesday());
    const daysToPay = Math.ceil((lastPayday.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const upcomingBills = data.bills.filter(b => !b.isPaid).slice(0, 3);

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Confirmed Balance Card */}
          <motion.div 
            whileHover={{ y: -5, scale: 1.01 }} 
            className="relative glass overflow-hidden p-5 md:p-6 lg:p-7 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.08)] flex flex-col justify-between h-52 md:h-60 lg:h-64 border border-white/60 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 w-fit">
                  <Wallet size={22} strokeWidth={2.5} />
                </div>
                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/70">Liquid Capital</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full shadow-sm border border-emerald-100/50 backdrop-blur-md">
                  Active
                </span>
                {totalHeldDeposits > 0 && (
                  <span className="text-[7px] font-black text-indigo-600 uppercase tracking-tighter">
                    +${totalHeldDeposits} in Assets
                  </span>
                )}
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-400">$</span>
                <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  {confirmedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-white/50 backdrop-blur-xl rounded-xl border border-white/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Forecast</span>
                    <span className="text-xs font-black text-emerald-600">
                      ${projectedBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Next Pay</p>
                  <p className="text-[10px] font-black text-slate-800 tracking-tight">+${data.weeklyEstimate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Countdown Card */}
          <motion.div whileHover={{ y: -5 }} className="glass p-5 md:p-6 lg:p-7 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-blue-500/5 flex flex-col justify-between h-52 md:h-60 lg:h-64 border border-white/60">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <Calendar size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Countdown</span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/70 mb-1">Payday Wednesday</p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">{daysToPay <= 0 ? "Today!" : `${daysToPay}d Left`}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-4">Next cycle starts shortly</p>
            </div>
          </motion.div>

          {/* Commitments Card */}
          <motion.div whileHover={{ y: -5 }} className="glass p-5 md:p-6 lg:p-7 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-rose-500/5 flex flex-col justify-between h-52 md:h-60 lg:h-64 border border-white/60 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20">
                <AlertCircle size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">Payments</span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600/70 mb-1">Unpaid Commitments</p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">${totalUnpaidBills.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-4">Due on {upcomingBills.length} items</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-tight text-slate-900">Upcoming Payments</h3>
              <button onClick={() => setActiveTab('bills')} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1 uppercase tracking-wider">
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {upcomingBills.length > 0 ? (
                upcomingBills.map(b => (
                  <div key={b.id} className={`flex justify-between items-center p-4 bg-white/40 hover:bg-white/60 transition-all rounded-2xl border border-white/40 group ${b.isDeposit ? 'border-l-4 border-l-indigo-500' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all ${b.isDeposit ? 'bg-indigo-500' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                        {b.isDeposit ? <ArrowRightLeft size={16} /> : <CreditCard size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{b.name}</p>
                          {b.isDeposit && <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">Asset</span>}
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Due {b.dueDate}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">${b.amount.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-40">
                   <CheckCircle size={40} className="mx-auto mb-4 text-emerald-500" />
                   <p className="text-xs font-bold">No Pending Payments</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
            <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1">Spending Category Mix</h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-4 uppercase tracking-widest">Real-time breakdown</p>
            <div className="h-44 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORIES.map(c => ({
                      name: c.label,
                      value: data.expenses.filter(e => e.category === c.value).reduce((a, b) => a + b.amount, 0)
                    })).filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {CATEGORIES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pinned Items Section */}
        {pinnedWishlistItems.length > 0 && (
          <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20">
                      <Target size={18} />
                   </div>
                   <h3 className="text-lg font-black tracking-tight text-slate-900">Pinned Items</h3>
                </div>
                <button onClick={() => setActiveTab('wishlist')} className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1 uppercase tracking-wider">
                  Manage Wishlist <ChevronRight size={14} />
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedWishlistItems.map(item => {
                   const progress = Math.min((confirmedBalance / item.price) * 100, 100);
                   return (
                     <div key={item.id} className="p-5 bg-white/40 border border-white/60 rounded-2xl shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
                        <div className="flex justify-between items-start mb-3 min-w-0">
                           <div className="min-w-0 flex-1 pr-2">
                              <p className="text-sm font-black text-slate-800 truncate block">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">${item.price.toFixed(0)} Target</p>
                           </div>
                           <button onClick={() => togglePin(item.id)} className="text-amber-500 opacity-50 hover:opacity-100 transition-opacity shrink-0">
                              <Pin size={14} fill="currentColor" />
                           </button>
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                              <span>Progress</span>
                              <span>{progress.toFixed(0)}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              />
                           </div>
                           {progress >= 100 && (
                              <button 
                                onClick={() => markWishlistAsPurchased(item)}
                                className="w-full text-[8px] font-black text-emerald-600 bg-emerald-50 py-1 rounded-md uppercase tracking-widest text-center mt-2 hover:bg-emerald-100 transition-colors"
                              >
                                Affordable! Buy Now
                              </button>
                           )}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        )}
      </motion.div>
    );
  };

  const SidebarBalanceCard = () => (
    <motion.div 
      whileHover={{ y: -3 }}
      className="p-5 xl:p-6 rounded-[1.75rem] bg-gradient-to-br from-white/60 to-white/30 border border-white/80 shadow-lg overflow-hidden relative backdrop-blur-3xl group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-4">
         <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-md">
           <ShieldCheck size={16} />
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/30">Verified</span>
            {totalHeldDeposits > 0 && (
               <span className="text-[6px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                 Assets: ${totalHeldDeposits}
               </span>
            )}
         </div>
      </div>

      <p className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Liquid Funds</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-black text-slate-400 leading-none">$</span>
        <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{confirmedBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-3.5 border-t border-white/40">
         <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Forecast</span>
            <span className="text-[10px] font-black text-emerald-600">${projectedBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
         </div>
         <div className="flex flex-col text-right">
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Upcoming</span>
            <span className="text-[10px] font-black text-slate-700">+${data.weeklyEstimate}</span>
         </div>
      </div>
    </motion.div>
  );

  // Show loading while data is being fetched
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <p className="text-slate-600 font-medium">Loading your financial data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex selection:bg-emerald-100 max-w-[2000px] mx-auto overflow-x-hidden">
      {/* Email Verification Notice */}
      {user && !user.emailVerified && !isGuest && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 shadow-lg max-w-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-800 font-semibold text-sm">Verify your email</p>
                <p className="text-amber-700 text-xs mt-1">
                  Check your inbox for a verification link to access all features.
                </p>
              </div>
              <button
                onClick={() => {
                  // This would trigger email resend - we'll handle this in AuthContext
                  window.location.reload(); // For now, just reload to show login screen
                }}
                className="text-amber-600 hover:text-amber-800 text-xs font-medium underline"
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-sm glass z-[101] p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg">
                    <Wallet size={20} strokeWidth={3} />
                  </div>
                  <h1 className="text-xl font-black tracking-tighter text-slate-900">MoniClear</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                <NavItem id="dashboard" icon={PieIcon} label="Dashboard" />
                <NavItem id="income" icon={TrendingUp} label="Pay Estimates" />
                <NavItem id="bills" icon={CreditCard} label="Scheduled Payments" />
                <NavItem id="expenses" icon={Wallet} label="Expense Tracker" />
                <NavItem id="wishlist" icon={ShoppingBag} label="Wishlist" />
                <NavItem id="reports" icon={BarChartIcon} label="Full Reports" />
              </nav>

              <div className="mt-6">
                <SidebarBalanceCard />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="w-64 xl:w-72 glass border-r-0 hidden lg:flex flex-col p-6 xl:p-8 space-y-8 xl:space-y-10 sticky top-0 h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] shadow-2xl overflow-hidden shrink-0 border border-white/60">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-3 text-emerald-600 relative z-10">
          <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xl shadow-emerald-500/30">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">MoniClear<br/><span className="text-emerald-500 text-[9px] tracking-widest font-black opacity-50 uppercase">Clarity for your money</span></h1>
        </div>
        
        <nav className="flex-1 space-y-1 relative z-10 overflow-y-auto no-scrollbar">
          <NavItem id="dashboard" icon={PieIcon} label="Overview" />
          <NavItem id="income" icon={TrendingUp} label="Pay Estimates" />
          <NavItem id="bills" icon={CreditCard} label="Pending Payments" />
          <NavItem id="expenses" icon={Wallet} label="Spending Log" />
          <NavItem id="wishlist" icon={ShoppingBag} label="Wishlist" />
          <NavItem id="reports" icon={BarChartIcon} label="Reports" />
        </nav>

        <div className="relative z-10 mt-auto space-y-4">
          <SidebarBalanceCard />

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">
              {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="px-5 py-4 md:px-8 md:py-5 flex justify-between items-center lg:hidden sticky top-0 z-50 glass border-b border-white/40">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-11 h-11 bg-white/60 rounded-xl flex items-center justify-center text-slate-800 shadow-md hover:scale-105 active:scale-95 transition-all border border-white/60 backdrop-blur-xl"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                <Wallet size={18} strokeWidth={3} />
             </div>
             <span className="font-black text-sm text-slate-900 tracking-tighter">MoniClear</span>
          </div>
        </header>

        <div className="p-5 md:p-8 lg:p-10 max-w-6xl mx-auto w-full flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-2">
            <div>
              <motion.h2 
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-4xl font-black text-slate-900 capitalize tracking-tighter leading-tight"
              >
                {activeTab === 'income' ? 'Pay Estimate' : activeTab === 'wishlist' ? 'Wishlist' : activeTab === 'bills' ? 'Payments' : activeTab}
              </motion.h2>
              <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[9px]">
                {activeTab === 'dashboard' ? 'Overview' : activeTab === 'reports' ? 'Analytics' : 'Management'}
              </p>
            </div>
            <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 self-start md:self-auto uppercase tracking-wider hidden sm:block">
              Real-time Sync Active
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              
              {activeTab === 'income' && <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
                <div className="glass p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6 relative overflow-hidden border border-white/60">
                  <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    <Clock size={32} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Pay Forecast</h3>
                    <p className="text-slate-500 font-medium text-sm">Input expected pay for this coming Wednesday.</p>
                  </div>
                  <div className="relative group max-w-xs mx-auto">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
                    <input 
                      type="number" 
                      className="w-full pl-12 pr-4 py-6 text-4xl md:text-5xl font-black text-slate-900 border-none bg-slate-100/50 rounded-2xl focus:bg-white focus:ring-8 focus:ring-emerald-500/10 outline-none transition-all text-center no-scrollbar"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => {
                        const val = parseFloat(incomeInput) || 0;
                        setData(prev => ({ ...prev, weeklyEstimate: val }));
                      }} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                      <Save size={18} /> Save Forecast
                    </button>
                    <button onClick={() => {
                        const amt = parseFloat(incomeInput) || 0;
                        if (amt > 0) {
                          setData(prev => ({ 
                            ...prev, 
                            incomeHistory: [...prev.incomeHistory, { id: generateId(), amount: amt, date: new Date().toISOString().split('T')[0] }],
                            weeklyEstimate: 0 
                          }));
                          setIncomeInput('');
                        }
                      }} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95">
                      <CheckCircle size={18} /> Marked Paid
                    </button>
                  </div>
                  
                  {data.weeklyEstimate > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                      Currently Saved: ${data.weeklyEstimate.toFixed(2)}
                    </motion.div>
                  )}
                </div>
                
                {data.incomeHistory.length > 0 && <div className="glass p-6 rounded-[2rem] border border-white/60">
                   <h4 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest">Recent History</h4>
                   <div className="space-y-3">
                     {data.incomeHistory.slice().reverse().map(h => (
                        <div key={h.id} className="flex justify-between items-center p-4 bg-white/30 rounded-xl border border-white/40 group">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">{h.date}</span>
                             <span className="font-black text-slate-900 leading-tight">${h.amount.toFixed(2)}</span>
                           </div>
                           <button 
                             onClick={() => setData(prev => ({ ...prev, incomeHistory: prev.incomeHistory.filter(item => item.id !== h.id) }))}
                             className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                   </div>
                </div>}
              </div>}

              {activeTab === 'bills' && <div className="space-y-6">
                 <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Schedule New Payment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</label>
                          <input id="bill-name" placeholder="Payment description" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount ($)</label>
                          <input id="bill-amt" type="number" placeholder="0.00" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Due Date</label>
                          <input id="bill-date" type="date" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                       </div>
                       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-4">
                          <button onClick={() => {
                             const n = document.getElementById('bill-name') as HTMLInputElement;
                             const a = document.getElementById('bill-amt') as HTMLInputElement;
                             const d = document.getElementById('bill-date') as HTMLInputElement;
                             
                             const nameVal = n.value;
                             const amtVal = parseFloat(a.value);
                             const dateVal = d.value || getNextWednesday();

                             if (nameVal && !isNaN(amtVal)) {
                                setData(prev => ({ ...prev, bills: [...prev.bills, { id: generateId(), name: nameVal, amount: amtVal, dueDate: dateVal, isPaid: false }] }));
                                n.value = ''; a.value = '';
                             }
                          }} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black shadow-lg">Add Commitment</button>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.bills.map(b => (
                       <div key={b.id} className={`glass p-4 rounded-2xl flex justify-between items-center border border-white/40 ${b.isPaid ? 'opacity-40 grayscale' : ''}`}>
                          <div className="flex items-center gap-4 min-w-0">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-900 text-white`}>
                                <CreditCard size={18} />
                             </div>
                             <div className="min-w-0">
                                <p className="font-black text-slate-800 text-sm truncate">{b.name}</p>
                                <p className="text-[8px] uppercase tracking-widest text-slate-400">Due {b.dueDate}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                             <span className="font-black text-slate-900 text-base">${b.amount.toFixed(2)}</span>
                             <button onClick={() => setData(prev => ({ ...prev, bills: prev.bills.map(it => it.id === b.id ? {...it, isPaid: !it.isPaid} : it) }))} className={`p-1.5 rounded-lg transition-colors ${b.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><CheckCircle size={18} /></button>
                             <button onClick={() => setData(prev => ({ ...prev, bills: prev.bills.filter(it => it.id !== b.id) }))} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"><Trash2 size={18} /></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>}

              {activeTab === 'expenses' && <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Log Expense</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                     <input id="exp-desc" placeholder="What did you buy?" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 outline-none font-semibold" />
                     <input id="exp-amt" type="number" placeholder="Amount ($)" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 outline-none font-semibold" />
                     <select id="exp-cat" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 outline-none font-semibold">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                     </select>
                     <button onClick={() => {
                        const d = document.getElementById('exp-desc') as HTMLInputElement;
                        const a = document.getElementById('exp-amt') as HTMLInputElement;
                        const c = document.getElementById('exp-cat') as HTMLSelectElement;

                        const descVal = d.value;
                        const amtVal = parseFloat(a.value);
                        const catVal = c.value as ExpenseCategory;

                        if (descVal && !isNaN(amtVal)) {
                          setData(prev => ({ ...prev, expenses: [...prev.expenses, { id: generateId(), description: descVal, amount: amtVal, category: catVal, date: new Date().toISOString().split('T')[0] }] }));
                          d.value = ''; a.value = '';
                        }
                     }} className="px-6 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg">Record Spend</button>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[500px]">
                       <thead className="bg-slate-900 text-white uppercase text-[8px] font-black tracking-widest">
                          <tr>
                             <th className="px-6 py-4 rounded-tl-xl">Item</th>
                             <th className="px-6 py-4">Category</th>
                             <th className="px-6 py-4">Price</th>
                             <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/40 bg-white/10">
                          {data.expenses.slice().reverse().map(e => (
                             <tr key={e.id} className="hover:bg-white/20 transition-colors">
                                <td className="px-6 py-4 font-black text-sm text-slate-800">{e.description}</td>
                                <td className="px-6 py-4">
                                   <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-slate-100">{e.category}</span>
                                </td>
                                <td className="px-6 py-4 font-black text-slate-900">${e.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                   <button onClick={() => setData(prev => ({ ...prev, expenses: prev.expenses.filter(it => it.id !== e.id) }))} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
              </div>}

              {activeTab === 'wishlist' && <div className="space-y-6">
                 <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Wishlist</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       <input id="w-name" placeholder="Item name" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 outline-none font-semibold" />
                       <input id="w-price" placeholder="Price ($)" className="w-full bg-white/50 border border-white/40 rounded-xl px-5 py-3.5 outline-none font-semibold" />
                       <button onClick={() => {
                          const n = document.getElementById('w-name') as HTMLInputElement;
                          const p = document.getElementById('w-price') as HTMLInputElement;
                          
                          // CAPTURE values BEFORE clearing
                          const nameVal = n.value.trim();
                          const cleanPriceStr = p.value.replace(/[^0-9.]/g, '');
                          const cleanPrice = parseFloat(cleanPriceStr);
                          
                          if (nameVal && !isNaN(cleanPrice)) {
                             setData(prev => ({ 
                               ...prev, 
                               wishlist: [...prev.wishlist, { 
                                 id: generateId(), 
                                 name: nameVal, 
                                 price: cleanPrice, 
                                 priority: 'Medium', 
                                 isPinned: false 
                               }] 
                             }));
                             // CLEAR inputs AFTER capturing values
                             n.value = ''; 
                             p.value = '';
                          }
                       }} className="px-6 py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg">Add to Wishlist</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.wishlist.map(w => (
                       <div key={w.id} className="glass p-6 rounded-[2rem] shadow-lg border border-white relative group overflow-hidden">
                          <div className="flex justify-between items-start min-w-0 mb-1">
                             <div className="min-w-0 flex-1 pr-10">
                                <h4 className="text-lg font-black text-slate-800 truncate block">{w.name}</h4>
                             </div>
                             <button onClick={() => togglePin(w.id)} className={`absolute top-6 right-6 p-1.5 rounded-lg transition-all shrink-0 ${w.isPinned ? 'bg-amber-100 text-amber-600 scale-110' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>
                                {w.isPinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                             </button>
                          </div>
                          <p className="text-xl font-black text-emerald-600 mb-4">${w.price.toFixed(2)}</p>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => markWishlistAsPurchased(w)}
                                className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-colors"
                             >
                                Mark Purchased
                             </button>
                             <button onClick={() => setData(prev => ({ ...prev, wishlist: prev.wishlist.filter(it => it.id !== w.id) }))} className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors shrink-0"><Trash2 size={16} /></button>
                          </div>
                       </div>
                    ))}
                    {data.wishlist.length === 0 && (
                       <div className="col-span-full py-20 text-center opacity-30">
                          <ShoppingBag size={48} className="mx-auto mb-4" />
                          <p className="font-black text-sm uppercase tracking-widest">Your Wishlist is empty</p>
                       </div>
                    )}
                 </div>
              </div>}

              {activeTab === 'reports' && <div className="space-y-6">
                 <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/60">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black text-slate-900">Wealth Composition</h3>
                       <div className="flex gap-4">
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-400 uppercase">Liquid Cash</p>
                             <p className="text-sm font-black text-emerald-600">${confirmedBalance.toFixed(0)}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-400 uppercase">Held Assets</p>
                             <p className="text-sm font-black text-indigo-600">${totalHeldDeposits.toFixed(0)}</p>
                          </div>
                       </div>
                    </div>
                    <div className="h-64 md:h-80">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Total Income', amount: totalHistoryIncome, fill: '#10b981' },
                            { name: 'Sunk Costs', amount: totalExpenses + totalPaidBills, fill: '#f43f5e' },
                            { name: 'Held Capital', amount: totalHeldDeposits, fill: '#6366f1' },
                            { name: 'Net Worth', amount: totalNetWorth, fill: '#0f172a' },
                          ]}>
                             <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e2e8f0" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fill: '#64748b', fontSize: 10 }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fill: '#64748b', fontSize: 10 }} />
                             <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                             <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                                { [0,1,2,3].map((_, i) => <Cell key={i} fill={['#10b981', '#f43f5e', '#6366f1', '#0f172a'][i]} />) }
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <p className="text-slate-600 font-medium">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
};

export default App;
