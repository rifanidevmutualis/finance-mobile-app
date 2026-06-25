import React, { useState } from 'react';
import { Home, Calendar, Plus, Wallet, Settings, Bell, ChevronUp, ChevronDown, Activity, X, ArrowUpRight, ArrowDownRight, MessageCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

// Helper: Format to Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // --- DUMMY DATA STATE ---
  const [wallets, setWallets] = useState([
    { id: 1, name: 'BCA', balance: 5000000, type: 'bank' },
    { id: 2, name: 'GoPay', balance: 250000, type: 'ewallet' },
    { id: 3, name: 'Uang Tunai', balance: 150000, type: 'cash' },
  ]);

  const [categories, setCategories] = useState([
    { id: 1, name: 'Makan & Minum', type: 'expense', icon: '🍔' },
    { id: 2, name: 'Transportasi', type: 'expense', icon: '🚗' },
    { id: 3, name: 'Gaji', type: 'income', icon: '💰' },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, title: 'Makan Siang', amount: 35000, type: 'expense', date: '2023-10-25', wallet: 'BCA', category: 'Makan & Minum' },
    { id: 2, title: 'Gaji Bulanan', amount: 8000000, type: 'income', date: '2023-10-24', wallet: 'BCA', category: 'Gaji' },
    { id: 3, title: 'Bensin', amount: 20000, type: 'expense', date: '2023-10-23', wallet: 'GoPay', category: 'Transportasi' },
  ]);

  // Cashflow Data (Dummy)
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
  const totalBalance = wallets.reduce((acc, wallet) => acc + wallet.balance, 0);
  const totalIncomeThisMonth = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseThisMonth = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  // Tx Form State
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txWallet, setTxWallet] = useState('');
  const [txTitle, setTxTitle] = useState('');

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txWallet) return;
    
    const newTx = {
      id: Date.now(),
      title: txTitle || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
      amount: parseInt(txAmount),
      type: txType,
      date: new Date().toISOString().split('T')[0],
      wallet: txWallet,
      category: txCategory
    };

    setTransactions([newTx, ...transactions]);
    
    // Update Wallet Balance
    setWallets(wallets.map(w => {
      if (w.name === txWallet) {
        return { ...w, balance: txType === 'income' ? w.balance + parseInt(txAmount) : w.balance - parseInt(txAmount) };
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
               <div className="font-bold">Muhamad</div>
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

               {transactions.map(tx => (
                  <div key={tx.id} className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                     <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                           <div style={{ width: 40, height: 40, backgroundColor: 'var(--bg-main)', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
                              {categories.find(c => c.name === tx.category)?.icon || '💸'}
                           </div>
                           <div>
                              <div className="font-bold" style={{ fontSize: '1rem' }}>{tx.title}</div>
                              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{tx.wallet} • {tx.date}</div>
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
            <h1 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Pengaturan & Laporan</h1>
            
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
                  <label>Email</label>
                  <div className="form-control" style={{ opacity: 0.5 }}>user@example.com</div>
               </div>
               <button className="btn btn-outline" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>Logout</button>
            </div>
          </>
        )}

      </div>

      {/* Floating Action Button (Only show on Home or Wallets tab maybe, but global is fine) */}
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
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsTxModalOpen(false)}>
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
