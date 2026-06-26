import React, { useState, useEffect } from 'react';
import { Home, Calendar, Plus, Wallet, Settings, Bell, ChevronUp, ChevronDown, Activity, X, ArrowUpRight, ArrowDownRight, MessageCircle, LogOut, Trash2, Pencil, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from './supabaseClient';

// Helper: Format to Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

function App() {
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState('home');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isWalletDetailsOpen, setIsWalletDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- SUPABASE DATA STATE ---
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Session Tracking
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data when Session exists
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [walletsRes, categoriesRes, transactionsRes] = await Promise.all([
        supabase.from('wallets').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false })
      ]);

      if (walletsRes.data) setWallets(walletsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    try {
      if (isLoginView) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await initializeDefaultData(data.user.id);
        }
        alert("Registrasi sukses! Silakan cek email atau langsung login jika auto-login aktif.");
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const initializeDefaultData = async (userId) => {
    await supabase.from('wallets').insert([
      { user_id: userId, name: 'BCA', balance: 0, type: 'bank' },
      { user_id: userId, name: 'Uang Tunai', balance: 0, type: 'cash' }
    ]);
    await supabase.from('categories').insert([
      { user_id: userId, name: 'Makan & Minum', type: 'expense', icon: '🍔' },
      { user_id: userId, name: 'Transportasi', type: 'expense', icon: '🚗' },
      { user_id: userId, name: 'Gaji', type: 'income', icon: '💰' }
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const cashflowData = [
    { name: 'Jan', income: 4000000, expense: 2400000 },
    { name: 'Feb', income: 3000000, expense: 1398000 },
    { name: 'Mar', income: 2000000, expense: 9800000 },
    { name: 'Apr', income: 2780000, expense: 3908000 },
    { name: 'May', income: 1890000, expense: 4800000 },
    { name: 'Jun', income: 2390000, expense: 3800000 },
    { name: 'Jul', income: 3490000, expense: 4300000 },
  ];

  const totalBalance = wallets.reduce((acc, wallet) => acc + Number(wallet.balance), 0);
  const totalIncomeThisMonth = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenseThisMonth = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${value / 1000000}juta`;
    if (value >= 1000) return `${value / 1000}rb`;
    return value;
  };

  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Tx Form State
  const [txId, setTxId] = useState(null);
  const [oldTx, setOldTx] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txWallet, setTxWallet] = useState('');
  const [txTitle, setTxTitle] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenTxModal = (tx = null) => {
    if (tx) {
      setTxId(tx.id);
      setOldTx(tx);
      setTxType(tx.type);
      setTxTitle(tx.title);
      setTxAmount(tx.amount.toString());
      setTxWallet(tx.wallet_name);
      setTxCategory(tx.category_name);
      setTxDate(new Date(tx.created_at).toISOString().split('T')[0]);
    } else {
      setTxId(null);
      setOldTx(null);
      setTxType('expense');
      setTxTitle('');
      setTxAmount('');
      setTxWallet('');
      setTxCategory('');
      setTxDate(new Date().toISOString().split('T')[0]);
    }
    setIsTxModalOpen(true);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txWallet || !session) return;
    
    const amountNum = parseInt(txAmount);
    
    if (txId && oldTx) {
       // UPDATE LOGIC
       const { error: txError } = await supabase
          .from('transactions')
          .update({ title: txTitle, amount: amountNum, type: txType, wallet_name: txWallet, category_name: txCategory, created_at: new Date(txDate).toISOString() })
          .eq('id', txId);
       
       if (txError) return alert("Gagal update transaksi");

       // Revert old balance
       const oldWallet = wallets.find(w => w.name === oldTx.wallet_name);
       if (oldWallet) {
          const revertAmount = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
          await supabase.from('wallets').update({ balance: Number(oldWallet.balance) + revertAmount }).eq('id', oldWallet.id);
       }
       // Apply new balance (Since this is complex local state logic, we just refetch data from DB to guarantee correctness)
       const newWallet = wallets.find(w => w.name === txWallet);
       if (newWallet) {
          // Note: If newWallet == oldWallet, we technically need the reverted balance first. 
          // So it's much safer to just let the DB handle it and we refresh.
          const finalWalletData = await supabase.from('wallets').select('balance').eq('id', newWallet.id).single();
          if (finalWalletData.data) {
             const applyAmount = txType === 'income' ? amountNum : -amountNum;
             await supabase.from('wallets').update({ balance: Number(finalWalletData.data.balance) + applyAmount }).eq('id', newWallet.id);
          }
       }
       fetchData();
       setIsTxModalOpen(false);
       return;
    }

    // INSERT LOGIC
    const selectedWallet = wallets.find(w => w.name === txWallet);
    if (!selectedWallet) return;

    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert([
        { 
          user_id: session.user.id,
          title: txTitle || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'), 
          amount: amountNum, 
          type: txType, 
          wallet_name: txWallet, 
          category_name: txCategory,
          created_at: new Date(txDate).toISOString()
        }
      ])
      .select();

    if (txError) return alert("Gagal menyimpan transaksi");

    const newBalance = txType === 'income' ? Number(selectedWallet.balance) + amountNum : Number(selectedWallet.balance) - amountNum;
    await supabase.from('wallets').update({ balance: newBalance }).eq('id', selectedWallet.id);

    if (newTx && newTx.length > 0) setTransactions([newTx[0], ...transactions]);
    setWallets(wallets.map(w => w.name === txWallet ? { ...w, balance: newBalance } : w));
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (tx) => {
    if(!window.confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (!error) {
       const wallet = wallets.find(w => w.name === tx.wallet_name);
       if (wallet) {
          const revertAmount = tx.type === 'income' ? -tx.amount : tx.amount;
          await supabase.from('wallets').update({ balance: Number(wallet.balance) + revertAmount }).eq('id', wallet.id);
       }
       fetchData(); // Reload to sync UI
    }
  };

  // Wallet Form State
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('bank');
  const [walletBalance, setWalletBalance] = useState('');
  
  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!walletName || !session) return;
    const amountNum = parseInt(walletBalance) || 0;
    const { data: newWallet, error } = await supabase
      .from('wallets')
      .insert([{ user_id: session.user.id, name: walletName, balance: amountNum, type: walletType }])
      .select();

    if (error) return alert("Gagal menambahkan dompet: " + error.message);
    if (newWallet && newWallet.length > 0) setWallets([...wallets, newWallet[0]]);
    setIsWalletModalOpen(false);
  };

  const handleDeleteWallet = async (walletId) => {
    if(!window.confirm("Apakah Anda yakin ingin menghapus dompet ini?")) return;
    const { error } = await supabase.from('wallets').delete().eq('id', walletId);
    if (error) return alert("Gagal menghapus dompet: " + error.message);
    setWallets(wallets.filter(w => w.id !== walletId));
  };

  // Category Form State
  const [catForm, setCatForm] = useState({ id: null, name: '', type: 'expense', icon: '💸' });

  const handleOpenCatModal = (category = null) => {
    if (category) {
      setCatForm({ id: category.id, name: category.name, type: category.type, icon: category.icon });
    } else {
      setCatForm({ id: null, name: '', type: 'expense', icon: '💸' });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name || !catForm.icon || !session) return;

    if (catForm.id) {
      const { error } = await supabase.from('categories').update({ name: catForm.name, type: catForm.type, icon: catForm.icon }).eq('id', catForm.id);
      if (error) return alert("Gagal edit kategori: " + error.message);
      setCategories(categories.map(c => c.id === catForm.id ? { ...c, ...catForm } : c));
    } else {
      const { data, error } = await supabase.from('categories').insert([{ user_id: session.user.id, name: catForm.name, type: catForm.type, icon: catForm.icon }]).select();
      if (error) return alert("Gagal tambah kategori: " + error.message);
      if (data) setCategories([...categories, data[0]]);
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = async (id) => {
    if(!window.confirm("Hapus kategori ini? Pastikan tidak ada transaksi yang menggunakannya.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return alert("Gagal menghapus kategori: " + error.message);
    setCategories(categories.filter(c => c.id !== id));
  };

  if (isAuthLoading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="font-bold text-secondary">Memuat Sesi...</div></div>;
  }

  if (!session) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <div className="flex justify-center mb-6">
            <div style={{ backgroundColor: 'var(--accent-orange)', width: 60, height: 60, borderRadius: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <Wallet size={32} />
            </div>
          </div>
          <h1 className="font-bold mb-2 text-center" style={{ fontSize: '1.5rem' }}>Finance Tracker 1.1</h1>
          <p className="text-secondary text-center mb-8" style={{ fontSize: '0.9rem' }}>
            {isLoginView ? 'Masuk ke akun Anda' : 'Buat akun baru gratis'}
          </p>

          {authError && <div className="text-red mb-4 text-center" style={{ fontSize: '0.9rem', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '8px', borderRadius: '8px' }}>{authError}</div>}

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" required />
            </div>
            <div className="form-group mb-6">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" required />
            </div>
            <button type="submit" className="btn btn-primary mb-4">
              {isLoginView ? 'Masuk' : 'Daftar Sekarang'}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setIsLoginView(!isLoginView)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>
                {isLoginView ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="font-bold text-secondary">Loading Data dari Supabase...</div></div>;
  }

  return (
    <div className="app-container">
      <div className="main-content">
        
        {/* Header */}
        <div className="flex justify-between align-center mb-6">
          <div className="flex align-center gap-4">
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#444', overflow: 'hidden' }}>
              <img src="https://i.pravatar.cc/100?img=11" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
               <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Selamat datang,</div>
               <div className="font-bold">{session.user.email.split('@')[0]}</div>
            </div>
          </div>
          <Bell size={20} className="text-secondary" />
        </div>

        {/* --- TAB: HOME --- */}
        {activeTab === 'home' && (
          <>
            {/* Total Balance Orange Card */}
            <div className="card-orange-gradient mb-6" onClick={() => setIsWalletDetailsOpen(true)}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                 <div className="flex justify-between align-center mb-2">
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total Saldo (Semua Dompet)</span>
                    <ChevronRight size={16} style={{ opacity: 0.7 }} />
                 </div>
                 <div className="font-bold mb-4" style={{ fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    {formatRupiah(totalBalance)}
                 </div>
                 <div className="flex gap-4">
                   <div className="flex align-center gap-2">
                     <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '6px', borderRadius: '50%' }}>
                        <ArrowDownRight size={14} color="white" />
                     </div>
                     <div>
                       <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Pemasukan</div>
                       <div className="font-bold" style={{ fontSize: '0.85rem' }}>{formatRupiah(totalIncomeThisMonth)}</div>
                     </div>
                   </div>
                   <div className="flex align-center gap-2">
                     <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '6px', borderRadius: '50%' }}>
                        <ArrowUpRight size={14} color="white" />
                     </div>
                     <div>
                       <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Pengeluaran</div>
                       <div className="font-bold" style={{ fontSize: '0.85rem' }}>{formatRupiah(totalExpenseThisMonth)}</div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="font-semibold mb-4 text-secondary" style={{ fontSize: '0.9rem' }}>Tren Pendapatan dan Pengeluaran (1 Tahun)</h2>
              <div style={{ width: '100%', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={45} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(value) => formatRupiah(value)} 
                    />
                    <Area type="monotone" dataKey="income" name="Pemasukan" stroke="var(--accent-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="var(--accent-red)" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
               <div className="flex justify-between align-center mb-4">
                  <h2 className="font-semibold" style={{ fontSize: '1.1rem' }}>Riwayat Transaksi</h2>
               </div>
               {transactions.length === 0 && <div className="text-secondary mt-4 text-center">Belum ada transaksi.</div>}
               {transactions.map(tx => (
                  <div key={tx.id} className="tx-card-layered">
                     <div className="tx-card-content">
                        <div className="flex align-center gap-3">
                           <div style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
                              {categories.find(c => c.name === tx.category_name)?.icon || '💸'}
                           </div>
                           <div>
                              <div className="font-bold" style={{ fontSize: '1rem', marginBottom: '2px' }}>{tx.title}</div>
                              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{tx.wallet_name} • {new Date(tx.created_at).toLocaleDateString('id-ID')}</div>
                           </div>
                        </div>
                        <div className="flex flex-col align-end gap-2">
                           <div className={`font-bold ${tx.type === 'income' ? 'text-green' : 'text-primary'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                           </div>
                           <div className="flex gap-2">
                              <button className="tx-action-btn" onClick={() => handleOpenTxModal(tx)}><Pencil size={12} /></button>
                              <button className="tx-action-btn" onClick={() => handleDeleteTransaction(tx)}><Trash2 size={12} /></button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </>
        )}

        {/* --- TAB: WALLETS --- */}
        {activeTab === 'wallets' && (
          <>
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Dompet Saya</h1>
            {wallets.length === 0 && <div className="text-secondary text-center mb-4">Belum ada dompet.</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {wallets.map((wallet, index) => {
                 let walletClass = 'wallet-default';
                 if(wallet.type === 'bank') walletClass = 'wallet-bank';
                 if(wallet.type === 'ewallet') walletClass = 'wallet-ewallet';
                 if(wallet.type === 'cash') walletClass = 'wallet-cash';

                 return (
                   <div key={wallet.id} className={`wallet-card ${walletClass}`} style={{ animationDelay: `${index * 0.1}s`, padding: '16px', margin: 0 }}>
                      <button className="delete-wallet-btn" onClick={() => handleDeleteWallet(wallet.id)} title="Hapus Dompet" style={{ top: '8px', right: '8px', width: '28px', height: '28px' }}>
                         <Trash2 size={14} />
                      </button>
                      <div className="flex align-center gap-2 mb-3">
                         <Wallet size={16} style={{ opacity: 0.8 }} />
                         <span className="font-bold" style={{ fontSize: '0.9rem' }}>{wallet.name}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Total Saldo</div>
                      <div className="font-bold" style={{ fontSize: '1.1rem', wordBreak: 'break-word', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                         {formatRupiah(wallet.balance)}
                      </div>
                   </div>
                 )
              })}
            </div>
            <button className="btn btn-outline" style={{ borderStyle: 'dashed' }} onClick={() => setIsWalletModalOpen(true)}>
               <Plus size={20} /> Tambah Dompet Baru
            </button>
          </>
        )}

        {/* --- TAB: CATEGORIES --- */}
        {activeTab === 'categories' && (
          <>
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Kategori</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               {categories.map(cat => (
                  <div key={cat.id} className={`glass-card ${cat.type === 'income' ? 'glass-income' : 'glass-expense'}`}>
                     <button className="cat-action-btn edit" onClick={() => handleOpenCatModal(cat)}>
                        <Pencil size={12} />
                     </button>
                     <button className="cat-action-btn delete" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 size={12} />
                     </button>

                     <div style={{ fontSize: '2.5rem', marginBottom: '8px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{cat.icon}</div>
                     <div className="font-bold" style={{ fontSize: '1rem', marginBottom: '4px' }}>{cat.name}</div>
                     <div className="text-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                     </div>
                  </div>
               ))}
               
               <div className="glass-card flex align-center" style={{ borderStyle: 'dashed', background: 'transparent', cursor: 'pointer', minHeight: '130px', justifyContent: 'center' }} onClick={() => handleOpenCatModal()}>
                  <div className="text-secondary flex flex-col align-center gap-2">
                     <Plus size={28} />
                     <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Tambah Kategori</span>
                  </div>
               </div>
            </div>
          </>
        )}

        {/* --- TAB: SETTINGS & REPORT --- */}
        {activeTab === 'settings' && (
          <>
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Pengaturan & Laporan</h1>
            <div className="card mb-6">
               <h3 className="font-bold mb-2">Ekspor Laporan</h3>
               <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>Filter tanggal untuk merekap arus kas dan saldo per dompet.</p>
               
               <div className="flex gap-2 mb-4">
                  <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mulai</label>
                     <input type="date" className="form-control" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} style={{ padding: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sampai</label>
                     <input type="date" className="form-control" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} style={{ padding: '8px' }} />
                  </div>
               </div>

               <button className="btn" style={{ backgroundColor: '#25D366', color: 'white' }} onClick={() => {
                   const start = new Date(reportStartDate); start.setHours(0,0,0,0);
                   const end = new Date(reportEndDate); end.setHours(23,59,59,999);
                   const filteredTx = transactions.filter(tx => { const txDate = new Date(tx.created_at); return txDate >= start && txDate <= end; });
                   const inc = filteredTx.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                   const exp = filteredTx.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                   const b = wallets.filter(w => w.type === 'bank');
                   const e = wallets.filter(w => w.type === 'ewallet');
                   const c = wallets.filter(w => w.type === 'cash');
                   let msg = `*Laporan Keuangan* 📊\nPeriode: ${start.toLocaleDateString('id-ID')} s/d ${end.toLocaleDateString('id-ID')}\n\n*ARUS KAS*\nPemasukan: ${formatRupiah(inc)}\nPengeluaran: ${formatRupiah(exp)}\nSelisih: ${formatRupiah(inc - exp)}\n\n*SALDO DOMPET*\n`;
                   if(b.length) msg += `🏦 Bank:\n` + b.map(w => `- ${w.name}: ${formatRupiah(w.balance)}`).join('\n') + `\n`;
                   if(e.length) msg += `📱 E-Wallet:\n` + e.map(w => `- ${w.name}: ${formatRupiah(w.balance)}`).join('\n') + `\n`;
                   if(c.length) msg += `💵 Tunai:\n` + c.map(w => `- ${w.name}: ${formatRupiah(w.balance)}`).join('\n') + `\n`;
                   msg += `\n*TOTAL SALDO: ${formatRupiah(totalBalance)}*\n`;
                   window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
               }}>
                  <MessageCircle size={20} /> Kirim ke WhatsApp
               </button>
            </div>
            <div className="card">
               <h3 className="font-bold mb-4">Akun</h3>
               <div className="form-group">
                  <label>Email Terdaftar</label>
                  <div className="form-control" style={{ opacity: 0.5 }}>{session.user.email}</div>
               </div>
               <button onClick={handleLogout} className="btn btn-outline" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)', marginTop: '16px' }}>
                 <LogOut size={20} /> Logout
               </button>
            </div>
          </>
        )}

      </div>

      <button className="fab" onClick={() => handleOpenTxModal()}><Plus size={32} /></button>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} /><span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'wallets' ? 'active' : ''}`} onClick={() => setActiveTab('wallets')}>
          <Wallet size={24} /><span>Wallets</span>
        </button>
        <div style={{ width: '40px' }}></div>
        <button className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <Activity size={24} /><span>Kategori</span>
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} /><span>Report</span>
        </button>
      </div>

      {/* MODALS */}
      
      {/* Wallet Details Pop-up */}
      <div className={`modal-overlay ${isWalletDetailsOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) setIsWalletDetailsOpen(false); }}>
        <div className="modal-content">
          <div className="flex justify-between align-center mb-6">
            <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Rincian Dompet</h2>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsWalletDetailsOpen(false)}>
              <X size={24} />
            </button>
          </div>
          {wallets.length === 0 ? <p className="text-secondary text-center">Belum ada dompet.</p> : (
             <div className="flex flex-col gap-3">
               {wallets.map(w => (
                  <div key={w.id} className="flex justify-between align-center" style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                     <div className="flex align-center gap-3">
                        <Wallet size={18} className="text-secondary" />
                        <span className="font-bold">{w.name}</span>
                     </div>
                     <span className="font-bold" style={{ color: 'var(--accent-orange)' }}>{formatRupiah(w.balance)}</span>
                  </div>
               ))}
               <div className="flex justify-between align-center mt-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-secondary font-bold">TOTAL SALDO</span>
                  <span className="font-bold" style={{ fontSize: '1.2rem' }}>{formatRupiah(totalBalance)}</span>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <div className={`modal-overlay ${isTxModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) setIsTxModalOpen(false); }}>
        <div className="modal-content">
          <div className="flex justify-between align-center mb-6">
            <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>{txId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsTxModalOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddTransaction}>
            <div className="flex gap-4 mb-4">
               <button type="button" className={`btn ${txType === 'expense' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: txType === 'expense' ? 'var(--accent-red)' : 'transparent', borderColor: txType === 'expense' ? 'var(--accent-red)' : 'var(--border-color)' }} onClick={() => setTxType('expense')}>Pengeluaran</button>
               <button type="button" className={`btn ${txType === 'income' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: txType === 'income' ? 'var(--accent-green)' : 'transparent', borderColor: txType === 'income' ? 'var(--accent-green)' : 'var(--border-color)' }} onClick={() => setTxType('income')}>Pemasukan</button>
            </div>
            <div className="form-group">
              <label>Tanggal Transaksi</label>
              <input type="date" className="form-control" value={txDate} onChange={(e) => setTxDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} required />
            </div>
            <div className="form-group">
              <label>Judul / Catatan</label>
              <input type="text" className="form-control" placeholder="Makan Siang / Gaji" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Jumlah (Rp)</label>
              <input type="number" className="form-control" placeholder="0" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Dompet</label>
              <select className="form-control" value={txWallet} onChange={(e) => setTxWallet(e.target.value)} required>
                <option value="" disabled>Pilih dompet</option>
                {wallets.map(w => <option key={w.id} value={w.name}>{w.name} ({formatRupiah(w.balance)})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <select className="form-control" value={txCategory} onChange={(e) => setTxCategory(e.target.value)} required>
                <option value="" disabled>Pilih kategori</option>
                {categories.filter(c => c.type === txType).map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group mt-6 mb-4">
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: txType === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)' }}>Simpan Transaksi</button>
            </div>
          </form>
        </div>
      </div>

      {/* Wallet Modal */}
      <div className={`modal-overlay ${isWalletModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) setIsWalletModalOpen(false); }}>
        <div className="modal-content">
          <div className="flex justify-between align-center mb-6">
            <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Tambah Dompet Baru</h2>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsWalletModalOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddWallet}>
            <div className="form-group">
              <label>Nama Dompet</label>
              <input type="text" className="form-control" placeholder="Contoh: BNI, OVO" value={walletName} onChange={(e) => setWalletName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Tipe Dompet</label>
              <select className="form-control" value={walletType} onChange={(e) => setWalletType(e.target.value)} required>
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Uang Tunai</option>
              </select>
            </div>
            <div className="form-group">
              <label>Saldo Awal (Rp)</label>
              <input type="number" className="form-control" placeholder="0" value={walletBalance} onChange={(e) => setWalletBalance(e.target.value)} />
            </div>
            <div className="form-group mt-6 mb-4">
              <button type="submit" className="btn btn-primary">Buat Dompet</button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Modal */}
      <div className={`modal-overlay ${isCatModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) setIsCatModalOpen(false); }}>
        <div className="modal-content">
          <div className="flex justify-between align-center mb-6">
            <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>{catForm.id ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsCatModalOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSaveCategory}>
            <div className="flex gap-4 mb-4">
               <button type="button" className={`btn ${catForm.type === 'expense' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: catForm.type === 'expense' ? 'var(--accent-red)' : 'transparent', borderColor: catForm.type === 'expense' ? 'var(--accent-red)' : 'var(--border-color)' }} onClick={() => setCatForm({...catForm, type: 'expense'})}>Pengeluaran</button>
               <button type="button" className={`btn ${catForm.type === 'income' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: catForm.type === 'income' ? 'var(--accent-green)' : 'transparent', borderColor: catForm.type === 'income' ? 'var(--accent-green)' : 'var(--border-color)' }} onClick={() => setCatForm({...catForm, type: 'income'})}>Pemasukan</button>
            </div>
            <div className="form-group">
              <label>Nama Kategori</label>
              <input type="text" className="form-control" placeholder="Contoh: Belanja Bulanan" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Ikon (Emoji)</label>
              <input type="text" className="form-control" placeholder="Contoh: 🛒" value={catForm.icon} onChange={(e) => setCatForm({...catForm, icon: e.target.value})} required maxLength={2} />
            </div>
            <div className="form-group mt-6 mb-4">
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: catForm.type === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)' }}>Simpan Kategori</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

export default App;
