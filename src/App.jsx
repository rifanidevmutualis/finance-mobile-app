import React, { useState, useEffect } from 'react';
import { Home, Calendar, Plus, Wallet, Settings, Bell, ChevronUp, ChevronDown, Activity, X, ArrowUpRight, ArrowDownRight, MessageCircle, LogOut } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
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
      
      // If wallets empty, maybe user is new and data wasn't initialized properly, but we handle it on sign up.
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
        // Initialize default data if user is created successfully
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

  // Cashflow Data (Dummy for UI purpose, calculated dynamically later)
  const cashflowData = [
    { name: 'Jan', income: 4000000, expense: 2400000 },
    { name: 'Feb', income: 3000000, expense: 1398000 },
    { name: 'Mar', income: 2000000, expense: 9800000 },
    { name: 'Apr', income: 2780000, expense: 3908000 },
    { name: 'May', income: 1890000, expense: 4800000 },
    { name: 'Jun', income: 2390000, expense: 3800000 },
    { name: 'Jul', income: 3490000, expense: 4300000 },
  ];

  // Derived Values
  const totalBalance = wallets.reduce((acc, wallet) => acc + Number(wallet.balance), 0);
  const totalIncomeThisMonth = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenseThisMonth = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

  // Tx Form State
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txWallet, setTxWallet] = useState('');
  const [txTitle, setTxTitle] = useState('');

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txWallet || !session) return;
    
    const amountNum = parseInt(txAmount);
    const selectedWallet = wallets.find(w => w.name === txWallet);
    
    if (!selectedWallet) return;

    // 1. Insert Transaction to Supabase
    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert([
        { 
          user_id: session.user.id,
          title: txTitle || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'), 
          amount: amountNum, 
          type: txType, 
          wallet_name: txWallet, 
          category_name: txCategory 
        }
      ])
      .select();

    if (txError) {
      console.error("Error inserting transaction:", txError);
      alert("Gagal menyimpan transaksi");
      return;
    }

    // 2. Update Wallet Balance in Supabase
    const newBalance = txType === 'income' ? Number(selectedWallet.balance) + amountNum : Number(selectedWallet.balance) - amountNum;
    
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', selectedWallet.id);

    if (walletError) {
      console.error("Error updating wallet:", walletError);
    }

    // 3. Update Local State
    if (newTx && newTx.length > 0) {
      setTransactions([newTx[0], ...transactions]);
    }
    
    setWallets(wallets.map(w => {
      if (w.name === txWallet) {
        return { ...w, balance: newBalance };
      }
      return w;
    }));

    setIsTxModalOpen(false);
    setTxAmount('');
    setTxTitle('');
  };

  const handleSendReportWA = () => {
    const message = `*Laporan Keuangan Bulan Ini* 📊\n\n` +
      `Total Saldo Saat Ini: ${formatRupiah(totalBalance)}\n` +
      `Pemasukan Bulan Ini: ${formatRupiah(totalIncomeThisMonth)}\n` +
      `Pengeluaran Bulan Ini: ${formatRupiah(totalExpenseThisMonth)}\n\n` +
      `Sisa Uang (Arus Kas): ${formatRupiah(totalIncomeThisMonth - totalExpenseThisMonth)}\n\n` +
      `_Laporan dikirim otomatis dari App Keuangan_`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- RENDER AUTH SCREENS ---
  if (isAuthLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="font-bold text-secondary">Memuat Sesi...</div>
      </div>
    );
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
          <h1 className="font-bold mb-2 text-center" style={{ fontSize: '1.5rem' }}>Finance App</h1>
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

  // --- RENDER MAIN APP ---
  if (isLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="font-bold text-secondary">Loading Data dari Supabase...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Header (Applies to all tabs) */}
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
            {/* Total Balance Card */}
            <div className="card mb-6" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, #2a2a2d 100%)' }}>
              <div className="text-secondary mb-1">Total Saldo (Semua Dompet)</div>
              <div className="font-bold mb-4" style={{ fontSize: '2rem' }}>{formatRupiah(totalBalance)}</div>
              
              <div className="flex gap-4">
                <div className="flex align-center gap-2">
                  <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '6px', borderRadius: '50%' }}>
                     <ArrowDownRight size={16} className="text-green" />
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Pemasukan</div>
                    <div className="font-bold text-green" style={{ fontSize: '0.9rem' }}>{formatRupiah(totalIncomeThisMonth)}</div>
                  </div>
                </div>
                <div className="flex align-center gap-2">
                  <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '6px', borderRadius: '50%' }}>
                     <ArrowUpRight size={16} className="text-red" />
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Pengeluaran</div>
                    <div className="font-bold text-red" style={{ fontSize: '0.9rem' }}>{formatRupiah(totalExpenseThisMonth)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="card mb-6">
              <h2 className="font-semibold mb-4 text-secondary" style={{ fontSize: '1rem' }}>Arus Kas (Cash Flow)</h2>
              <div style={{ width: '100%', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashflowData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <Line type="monotone" dataKey="income" stroke="var(--accent-green)" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="expense" stroke="var(--accent-red)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2" style={{ fontSize: '0.8rem' }}>
                 <div className="flex align-center gap-1"><span style={{ width: 8, height: 8, backgroundColor: 'var(--accent-green)', borderRadius: '50%' }}></span> Pemasukan</div>
                 <div className="flex align-center gap-1"><span style={{ width: 8, height: 8, backgroundColor: 'var(--accent-red)', borderRadius: '50%' }}></span> Pengeluaran</div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
               <div className="flex justify-between align-center mb-4">
                  <h2 className="font-semibold" style={{ fontSize: '1.1rem' }}>Transaksi Terakhir</h2>
                  <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Lihat semua</span>
               </div>

               {transactions.length === 0 && (
                 <div className="text-secondary mt-4 text-center">Belum ada transaksi.</div>
               )}

               {transactions.map(tx => (
                  <div key={tx.id} className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                     <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                           <div style={{ width: 40, height: 40, backgroundColor: 'var(--bg-main)', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
                              {categories.find(c => c.name === tx.category_name)?.icon || '💸'}
                           </div>
                           <div>
                              <div className="font-bold" style={{ fontSize: '1rem' }}>{tx.title}</div>
                              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{tx.wallet_name} • {new Date(tx.created_at).toLocaleDateString('id-ID')}</div>
                           </div>
                        </div>
                        <div className={`font-bold ${tx.type === 'income' ? 'text-green' : 'text-primary'}`}>
                           {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
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
            
            {wallets.length === 0 && (
               <div className="text-secondary text-center mb-4">Belum ada dompet.</div>
            )}

            {wallets.map(wallet => (
               <div key={wallet.id} className="card mb-4">
                  <div className="flex justify-between align-center mb-2">
                     <div className="flex align-center gap-2">
                        <Wallet size={20} className="text-secondary" />
                        <span className="font-bold">{wallet.name}</span>
                     </div>
                  </div>
                  <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--accent-orange)' }}>
                     {formatRupiah(wallet.balance)}
                  </div>
               </div>
            ))}

            <button className="btn btn-outline" style={{ marginTop: '16px', borderStyle: 'dashed' }}>
               <Plus size={20} /> Tambah Dompet Baru
            </button>
          </>
        )}

        {/* --- TAB: CATEGORIES --- */}
        {activeTab === 'categories' && (
          <>
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Kategori</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               {categories.map(cat => (
                  <div key={cat.id} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                     <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{cat.icon}</div>
                     <div className="font-bold" style={{ fontSize: '0.9rem' }}>{cat.name}</div>
                     <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</div>
                  </div>
               ))}
               
               <div className="card flex align-center justify-center" style={{ padding: '16px', borderStyle: 'dashed', background: 'transparent', cursor: 'pointer' }}>
                  <div className="text-secondary flex flex-col align-center gap-2">
                     <Plus size={24} />
                     <span style={{ fontSize: '0.8rem' }}>Tambah Kategori</span>
                  </div>
               </div>
            </div>
          </>
        )}

        {/* --- TAB: SETTINGS & REPORT --- */}
        {activeTab === 'settings' && (
          <>
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Pengaturan</h1>
            
            <div className="card mb-6">
               <h3 className="font-bold mb-2">Laporan Bulan Ini</h3>
               <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>Kirim ringkasan laporan keuangan Anda bulan ini langsung via WhatsApp.</p>
               <button className="btn" style={{ backgroundColor: '#25D366', color: 'white' }} onClick={handleSendReportWA}>
                  <MessageCircle size={20} />
                  Kirim ke WhatsApp
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

      {/* Floating Action Button */}
      <button className="fab" onClick={() => setIsTxModalOpen(true)}>
        <Plus size={32} />
      </button>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'wallets' ? 'active' : ''}`} onClick={() => setActiveTab('wallets')}>
          <Wallet size={24} />
          <span>Wallets</span>
        </button>
        <div style={{ width: '40px' }}></div> {/* Spacer for FAB */}
        <button className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <Activity size={24} />
          <span>Kategori</span>
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} />
          <span>Report</span>
        </button>
      </div>

      {/* Add Transaction Modal */}
      <div className={`modal-overlay ${isTxModalOpen ? 'open' : ''}`} onClick={(e) => {
        if(e.target.className.includes('modal-overlay')) setIsTxModalOpen(false);
      }}>
        <div className="modal-content">
          <div className="flex justify-between align-center mb-6">
            <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Tambah Transaksi</h2>
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
                {categories.filter(c => c.type === txType).map(c => (
                   <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group mt-6 mb-4">
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: txType === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)' }}>Simpan Transaksi</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

export default App;
