
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, TrendingUp, TrendingDown, 
  Trash2, PieChart as PieChartIcon, Sparkles, 
  Sun, Moon, LayoutDashboard, History, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  ChevronRight, Calculator, CalendarDays, 
  Clock, Calendar, Github, Linkedin
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionType, CATEGORIES } from './types';
import { formatCurrency, formatDate, isSameDay, isSameWeek, isSameMonth } from './utils/formatters';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('wealthflow_theme') as 'light' | 'dark' || 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('wealthflow_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: CATEGORIES[0] as string
  });

  const [aiAdvice, setAiAdvice] = useState<string>('Menganalisa data keuanganmu...');
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('wealthflow_theme', theme);
  }, [theme]);

  // Data Persistence
  useEffect(() => {
    localStorage.setItem('wealthflow_txs', JSON.stringify(transactions));
  }, [transactions]);

  // AI Advice Fetcher
  useEffect(() => {
    const fetchAdvice = async () => {
      if (transactions.length === 0) {
        setAiAdvice("Mulai tambahkan transaksi untuk mendapatkan saran keuangan dari AI.");
        return;
      }
      setIsAdviceLoading(true);
      const advice = await getFinancialAdvice(transactions);
      setAiAdvice(advice);
      setIsAdviceLoading(false);
    };

    const timer = setTimeout(fetchAdvice, 1500);
    return () => clearTimeout(timer);
  }, [transactions.length]);

  const stats = useMemo(() => {
    const now = new Date();
    return transactions.reduce(
      (acc, tx) => {
        const txDate = new Date(tx.date);
        const isExp = tx.type === 'expense';
        const amount = Number(tx.amount);
        
        if (tx.type === 'income') acc.totalIncome += amount;
        else acc.totalExpense += amount;

        if (isExp) {
          if (isSameDay(txDate, now)) acc.daily += amount;
          if (isSameWeek(txDate, now)) acc.weekly += amount;
          if (isSameMonth(txDate, now)) acc.monthly += amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, daily: 0, weekly: 0, monthly: 0 }
    );
  }, [transactions]);

  const totalBalance = stats.totalIncome - stats.totalExpense;

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    const now = new Date();
    transactions
      .filter((tx) => tx.type === 'expense' && isSameMonth(new Date(tx.date), now))
      .forEach((tx) => {
        data[tx.category] = (data[tx.category] || 0) + tx.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = theme === 'dark' 
    ? ['#22d3ee', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#fb923c', '#eab308']
    : ['#0891b2', '#4f46e5', '#9333ea', '#db2777', '#e11d48', '#ea580c', '#ca8a04'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || Number(form.amount) <= 0) return;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      category: form.type === 'income' ? 'Pemasukan' : form.category,
      date: new Date().toISOString(),
    };

    setTransactions([newTx, ...transactions]);
    setForm({ ...form, title: '', amount: '' });
  };

  const deleteTx = (id: string) => setTransactions(t => t.filter(x => x.id !== id));

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 md:mb-14">
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10 shrink-0">
            <Calculator className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              WealthFlow
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] font-extrabold text-indigo-500 dark:text-indigo-400 mt-1.5">Smart Tracking</p>
          </div>
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ml-auto sm:hidden p-3.5 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-md active:scale-90"
          >
            {theme === 'dark' ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
          </button>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial flex items-center gap-5 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="text-left sm:text-center w-full">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-0.5">Current Balance</p>
                <p className={`text-xl sm:text-lg font-black ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(totalBalance)}
                </p>
             </div>
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:block p-3.5 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-md active:scale-90"
          >
            {theme === 'dark' ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
          </button>
        </div>
      </nav>

      {/* Periodic Insights */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 mb-14">
        
        {/* Daily Insight */}
        <div className="glass p-7 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all border border-transparent dark:border-slate-800">
           <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400">
                 <Clock size={20} />
              </div>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today</span>
           </div>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Pengeluaran Hari Ini</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(stats.daily)}</h3>
           <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock size={100} className="text-slate-900 dark:text-white" />
           </div>
        </div>

        {/* Weekly Insight */}
        <div className="glass p-7 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all border border-transparent dark:border-slate-800">
           <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                 <CalendarDays size={20} />
              </div>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">7 Days</span>
           </div>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Minggu Ini</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(stats.weekly)}</h3>
           <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CalendarDays size={100} className="text-slate-900 dark:text-white" />
           </div>
        </div>

        {/* Monthly Insight */}
        <div className="glass p-7 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all border-b-4 border-indigo-500/50 dark:border-slate-800">
           <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                 <Calendar size={20} />
              </div>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">This Month</span>
           </div>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Bulan Ini</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(stats.monthly)}</h3>
           <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar size={100} className="text-slate-900 dark:text-white" />
           </div>
        </div>

        {/* Summary Mini Chart Card */}
        <div className="glass p-7 rounded-[2.5rem] shadow-xl bg-slate-900 dark:bg-slate-800/80 border-none">
           <div className="flex flex-col h-full justify-center space-y-5">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2.5 text-emerald-400">
                    <TrendingUp size={16} />
                    <span className="text-xs font-black uppercase tracking-wider">Pemasukan</span>
                 </div>
                 <p className="text-base font-black text-white">{formatCurrency(stats.totalIncome)}</p>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                    style={{ width: `${stats.totalIncome > 0 ? (stats.totalIncome / (stats.totalIncome + stats.totalExpense)) * 100 : 0}%` }}
                  ></div>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2.5 text-rose-400">
                    <TrendingDown size={16} />
                    <span className="text-xs font-black uppercase tracking-wider">Pengeluaran</span>
                 </div>
                 <p className="text-base font-black text-white">{formatCurrency(stats.totalExpense)}</p>
              </div>
           </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column */}
        <aside className="lg:col-span-5 space-y-10">
          <section className="glass p-10 rounded-[2.5rem] shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                <PlusCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">Tambah Data</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Input New Entry</p>
              </div>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">Deskripsi Transaksi</label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 text-base font-semibold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Contoh: Starbucks Coffee"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">Nominal Rupiah</label>
                <div className="relative">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">Rp</div>
                   <input
                    type="number" required
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-16 pr-6 py-5 text-lg font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">Tipe</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value as TransactionType})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer"
                  >
                    <option value="expense">📉 Pengeluaran</option>
                    <option value="income">📈 Pemasukan</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 px-1">Kategori</label>
                  <select
                    disabled={form.type === 'income'}
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none disabled:opacity-30 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-indigo-500/40 transition-all flex items-center justify-center gap-4 group active:scale-[0.98]">
                Konfirmasi Simpan
                <ChevronRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </form>
          </section>

          {/* AI Advisor */}
          <section className="glass p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-2xl relative overflow-hidden text-white border-none">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h3 className="font-black text-base uppercase tracking-[0.2em]">Gemini Advisor</h3>
                {isAdviceLoading && (
                  <div className="ml-auto flex gap-1.5">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
              </div>
              <p className={`text-base leading-relaxed font-medium text-indigo-50/95 italic tracking-wide ${isAdviceLoading ? 'animate-pulse' : ''}`}>
                "{aiAdvice}"
              </p>
            </div>
            <div className="absolute -top-6 -right-6 p-10 opacity-20 rotate-12 scale-[1.8]">
               <Sparkles size={140} />
            </div>
          </section>
        </aside>

        {/* Right Column */}
        <main className="lg:col-span-7 space-y-10">
          
          {/* Chart Section */}
          <section className="glass p-10 rounded-[2.5rem] shadow-xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="p-3.5 bg-pink-500/10 rounded-2xl shadow-inner">
                  <PieChartIcon className="text-pink-500" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white">Alokasi Dana</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Expense Share this Month</p>
                </div>
              </div>
            </div>

            <div className="h-[340px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={90}
                      outerRadius={125}
                      paddingAngle={12}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={15} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                        border: 'none', 
                        borderRadius: '28px',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.2)',
                        padding: '20px',
                        color: theme === 'dark' ? '#fff' : '#000'
                      }}
                      itemStyle={{ fontWeight: '800', fontSize: '13px' }}
                    />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '700', paddingBottom: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-5">
                  <div className="p-8 bg-slate-100 dark:bg-slate-900/60 rounded-full opacity-40 shadow-inner">
                     <PieChartIcon size={60} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] italic">Belum ada pengeluaran bulan ini</p>
                </div>
              )}
            </div>
          </section>

          {/* Activity Section */}
          <section className="glass p-10 rounded-[2.5rem] shadow-xl flex flex-col max-h-[600px] border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="p-3.5 bg-cyan-500/10 rounded-2xl text-cyan-500 shadow-inner">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white">Riwayat</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Recent Activity</p>
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/60 px-5 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                 <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                  {transactions.length} Entri
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-4 scrollbar-thin">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-16">
                  <LayoutDashboard size={60} className="mb-6 opacity-30" />
                  <p className="text-sm font-bold uppercase tracking-[0.3em]">Mulai Catat Pengeluaranmu</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="group flex items-center justify-between p-6 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-indigo-500/5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 transition-all shadow-sm hover:shadow-xl hover:translate-x-1"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                        tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight size={26} /> : <ArrowDownRight size={26} />}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">{tx.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 rounded-lg">{tx.category}</span>
                           <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className={`text-base font-black tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <button 
                        onClick={() => deleteTx(tx.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="mt-24 pb-20 border-t border-slate-200 dark:border-slate-800/50 text-center">
        <div className="flex flex-col items-center gap-8 mt-16">
           <div className="flex flex-col items-center gap-6">
             <p className="text-slate-900 dark:text-white text-xl font-black tracking-tight uppercase">
               Created by <span className="text-indigo-600 dark:text-indigo-400">Totti Fawwaz Reda</span>
             </p>
             <div className="flex items-center gap-8">
               <a 
                 href="https://github.com/tottifawwazr" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-4 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg hover:shadow-indigo-500/20"
                 title="GitHub Profile"
               >
                 <Github size={28} />
               </a>
               <a 
                 href="https://www.linkedin.com/in/totti-fawwaz-reda-46a42a28a" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-4 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg hover:shadow-indigo-500/20"
                 title="LinkedIn Profile"
               >
                 <Linkedin size={28} />
               </a>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
