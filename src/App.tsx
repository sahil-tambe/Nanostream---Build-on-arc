import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { X402Marketplace } from './components/X402Marketplace';
import { TransactionAuditLog } from './components/TransactionAuditLog';
import { CircleCliConsole } from './components/CircleCliConsole';
import { WalletConnectModal } from './components/WalletConnectModal';
import { UserWallet, X402Service, TransactionRecord, AuditLogRecord } from './types';
import { ConnectedWeb3Wallet } from './lib/web3Wallet';
import { auth, googleAuthProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Zap, ShieldCheck, Cpu, RefreshCw, Sparkles, Layers, Terminal } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [services, setServices] = useState<X402Service[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // Web3 / MetaMask Wallet State
  const [connectedWeb3Wallet, setConnectedWeb3Wallet] = useState<ConnectedWeb3Wallet | null>(null);
  const [isWeb3ModalOpen, setIsWeb3ModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'marketplace' | 'wallet' | 'logs' | 'cli'>('marketplace');

  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConsumingService, setIsConsumingService] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper for authenticated API calls
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  };

  // 1. Firebase Auth state tracking
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch initial data on load or token change
  useEffect(() => {
    loadAllData();
  }, [idToken]);

  const loadAllData = async () => {
    setIsLoadingWallet(true);
    try {
      // Sync user & wallet
      const syncRes = await fetchWithAuth('/api/user/sync', { method: 'POST' });
      if (syncRes.wallet) setWallet(syncRes.wallet);

      // Fetch Services
      const servRes = await fetch('/api/x402/services').then((r) => r.json());
      if (servRes.services) setServices(servRes.services);

      // Fetch Transactions
      const txRes = await fetchWithAuth('/api/transactions');
      if (txRes.transactions) setTransactions(txRes.transactions);

      // Fetch Audit Logs
      const auditRes = await fetchWithAuth('/api/audit-logs');
      if (auditRes.auditLogs) setAuditLogs(auditRes.auditLogs);
    } catch (err: any) {
      console.warn('Initial data load warning:', err.message);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      showToast('Successfully signed in with Google Account!');
    } catch (err: any) {
      showToast(`Sign in failed: ${err.message}`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out of session');
    } catch (err: any) {
      showToast(`Sign out failed: ${err.message}`, 'error');
    }
  };

  // Wallet Handlers
  const handleFundWallet = async (amount: number) => {
    setIsProcessing(true);
    try {
      const res = await fetchWithAuth('/api/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amountUsdc: amount }),
      });
      if (res.wallet) setWallet(res.wallet);
      showToast(`Deposit confirmed! +$${amount} USDC added to Circle Arc Wallet.`);
      await loadAllData();
    } catch (err: any) {
      showToast(`Deposit failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDepositFromWeb3 = async (amount: number) => {
    await handleFundWallet(amount);
  };

  const handleUpdateSettings = async (settings: {
    autoStreamEnabled?: boolean;
    microRateCap?: number;
    dailyBudgetCap?: number;
  }) => {
    setIsProcessing(true);
    try {
      const res = await fetchWithAuth('/api/agent/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.wallet) setWallet(res.wallet);
      showToast('Circle Agent Stack policy rules updated!');
    } catch (err: any) {
      showToast(`Settings update failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Consume x402 Service
  const handleConsumeService = async (serviceId: string, promptPayload?: string) => {
    setIsConsumingService(true);
    try {
      const res = await fetchWithAuth('/api/x402/consume', {
        method: 'POST',
        body: JSON.stringify({ serviceId, promptPayload }),
      });

      // Update balance & logs
      if (res.payment?.updatedBalanceUsdc && wallet) {
        setWallet({ ...wallet, balanceUsdc: res.payment.updatedBalanceUsdc });
      }
      showToast(`Streamed -${res.payment.amountUsdc} USDC for ${serviceId}!`);
      loadAllData();
      return res;
    } catch (err: any) {
      showToast(`Nanopayment failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsConsumingService(false);
    }
  };

  // Run Circle CLI Command
  const handleRunCliCommand = async (command: string) => {
    try {
      const res = await fetchWithAuth('/api/circle/cli/update', {
        method: 'POST',
        body: JSON.stringify({ command }),
      });
      showToast(`CLI Command '${command}' completed successfully!`);
      loadAllData();
      return res;
    } catch (err: any) {
      showToast(`CLI error: ${err.message}`, 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        wallet={wallet}
        userEmail={currentUser?.email || null}
        userName={currentUser?.displayName || null}
        userAvatar={currentUser?.photoURL || null}
        connectedWeb3Wallet={connectedWeb3Wallet}
        onOpenWeb3Modal={() => setIsWeb3ModalOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onRefreshWallet={loadAllData}
        isRefreshing={isLoadingWallet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-start sm:justify-between bg-white border border-slate-200 p-1 sm:p-1.5 rounded-xl shadow-xs overflow-x-auto gap-1">
          <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-max">
            
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>x402 Marketplace</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Wallet & Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Audit Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'cli'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>CLI Console</span>
            </button>

          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 font-medium px-3 flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Arc Settlement Active (436)</span>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'marketplace' && (
          <X402Marketplace
            services={services}
            wallet={wallet}
            onConsumeService={handleConsumeService}
            isConsuming={isConsumingService}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletCard
            wallet={wallet}
            connectedWeb3Wallet={connectedWeb3Wallet}
            onOpenWeb3Modal={() => setIsWeb3ModalOpen(true)}
            onFundWallet={handleFundWallet}
            onUpdateSettings={handleUpdateSettings}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === 'logs' && (
          <TransactionAuditLog
            transactions={transactions}
            auditLogs={auditLogs}
            onRefresh={loadAllData}
            isLoading={isLoadingWallet}
          />
        )}

        {activeTab === 'cli' && (
          <CircleCliConsole onRunCliCommand={handleRunCliCommand} />
        )}

      </main>

      {/* Web3 Wallet Modal */}
      <WalletConnectModal
        isOpen={isWeb3ModalOpen}
        onClose={() => setIsWeb3ModalOpen(false)}
        connectedWallet={connectedWeb3Wallet}
        onWalletConnected={(w) => setConnectedWeb3Wallet(w)}
        onDepositToCircleStream={handleDepositFromWeb3}
        showToast={showToast}
      />

      {/* Live Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center space-x-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-white border-green-300 text-slate-800'
                : 'bg-white border-rose-300 text-rose-800'
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Nanostream Built on Arc • Powered by Circle Developer Stack & PostgreSQL
          </span>
          <div className="flex items-center space-x-3 font-medium text-slate-400">
            <span>Circle Agent Stack v0.0.6</span>
            <span>•</span>
            <span>MetaMask & EVM</span>
            <span>•</span>
            <span>x402 Protocol Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

