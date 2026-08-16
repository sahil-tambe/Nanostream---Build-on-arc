import React, { useState } from 'react';
import { UserWallet } from '../types';
import { ConnectedWeb3Wallet } from '../lib/web3Wallet';
import { Wallet, Shield, Settings2, PlusCircle, Check, Copy, Activity, Zap, Lock, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WalletCardProps {
  wallet: UserWallet | null;
  connectedWeb3Wallet?: ConnectedWeb3Wallet | null;
  onOpenWeb3Modal?: () => void;
  onFundWallet: (amount: number) => Promise<void>;
  onUpdateSettings: (settings: { autoStreamEnabled?: boolean; microRateCap?: number; dailyBudgetCap?: number }) => Promise<void>;
  isProcessing: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  connectedWeb3Wallet,
  onOpenWeb3Modal,
  onFundWallet,
  onUpdateSettings,
  isProcessing,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState<number>(25);

  const [autoStream, setAutoStream] = useState(wallet?.autoStreamEnabled ?? true);
  const [rateCap, setRateCap] = useState(wallet?.microRateCap ?? '0.050000');
  const [dailyCap, setDailyCap] = useState(wallet?.dailyBudgetCap ?? '10.00');

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onFundWallet(fundAmount);
    setShowFundModal(false);
  };

  const handleSaveSettings = async () => {
    await onUpdateSettings({
      autoStreamEnabled: autoStream,
      microRateCap: parseFloat(rateCap),
      dailyBudgetCap: parseFloat(dailyCap),
    });
  };

  if (!wallet) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 shadow-sm">
        <Activity className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-2" />
        <p className="text-sm font-medium">Initializing Circle SDK User Wallet on Arc Settlement...</p>
      </div>
    );
  }

  const balanceNum = parseFloat(wallet.balanceUsdc);
  const spentTodayNum = parseFloat(wallet.spentTodayUsdc);
  const dailyCapNum = parseFloat(wallet.dailyBudgetCap);
  const budgetPercent = Math.min(100, Math.round((spentTodayNum / dailyCapNum) * 100));

  return (
    <div className="space-y-6">
      
      {/* 1. Main Wallet Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Wallet Header & Address */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" /> Circle SDK Smart Wallet
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" /> Arc EVM Verified
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Circle Wallet ID & Settlement Address</p>
              <div className="flex items-center space-x-2 mt-1">
                <code className="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800 border border-slate-200 truncate max-w-[280px] sm:max-w-md font-semibold">
                  {wallet.address}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors font-medium border border-slate-200 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time USDC Balance & Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:w-80">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streaming Balance</p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  ${balanceNum.toFixed(4)}
                </span>
                <span className="text-xs font-bold text-indigo-600">USDC</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sub-cent streaming ready</p>
            </div>

            <button
              onClick={() => setShowFundModal(true)}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Fund Pool</span>
            </button>
          </div>

        </div>

        {/* Daily Budget Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Today's Nanopayment Usage:</span>
            <span className="font-bold text-slate-800">
              ${spentTodayNum.toFixed(4)} / ${dailyCapNum.toFixed(2)} USDC
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-48">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{budgetPercent}%</span>
          </div>
        </div>

      </div>

      {/* 2. Web3 EVM Wallet Bridge Integration (MetaMask, Coinbase, Rainbow) */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">EVM Crypto Wallet Bridge</h3>
              <p className="text-xs text-slate-500 font-medium">Connect MetaMask, Coinbase or any EVM wallet to fund Arc stream pools</p>
            </div>
          </div>

          <button
            onClick={onOpenWeb3Modal}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              connectedWeb3Wallet
                ? 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {connectedWeb3Wallet ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{connectedWeb3Wallet.walletType.toUpperCase()}: {connectedWeb3Wallet.shortAddress}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>Connect MetaMask / Web3</span>
              </>
            )}
          </button>
        </div>

        {connectedWeb3Wallet ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-slate-500 font-medium block">Active Network</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> {connectedWeb3Wallet.networkName}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-slate-500 font-medium block">Native Asset (Gas)</span>
              <span className="font-bold font-mono text-slate-800 text-sm mt-0.5 block">
                {connectedWeb3Wallet.balanceNative} ARC
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-slate-500 font-medium block">Wallet USDC</span>
              <span className="font-bold font-mono text-indigo-600 text-sm mt-0.5 block">
                ${connectedWeb3Wallet.balanceUsdc} USDC
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-600 font-medium flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
            <span>No Web3 wallet currently linked. Click &ldquo;Connect MetaMask / Web3&rdquo; above to link your on-chain keys.</span>
            <span className="text-[11px] font-bold text-indigo-600">Chain ID: 436</span>
          </div>
        )}
      </div>

      {/* 3. Autonomous Agent Policy & Security Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Circle Agent Stack Nanopayment Policy</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Lock className="w-3 h-3 text-green-600" /> Gasless Arc Settlement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Auto Stream Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Autonomous Payment Agent</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Stream sub-cent USDC automatically</p>
            </div>
            <button
              onClick={() => setAutoStream(!autoStream)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                autoStream ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoStream ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Micro Rate Cap */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Max Cost Per Call (USDC)</label>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-500 font-bold">$</span>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                max="1.00"
                value={rateCap}
                onChange={(e) => setRateCap(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Daily Budget Cap */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Daily Budget Cap (USDC)</label>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-500 font-bold">$</span>
              <input
                type="number"
                step="1.00"
                min="1.00"
                max="500.00"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Update Policy Rules</span>
          </button>
        </div>
      </div>

      {/* Fund / Faucet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Deposit Arc Testnet USDC</h3>
              </div>
              <button
                onClick={() => setShowFundModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Simulate funding your Circle SDK Developer/User Wallet on the Arc settlement layer with instant USDC tokens.
            </p>

            <form onSubmit={handleFundSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Deposit Amount (USDC):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFundAmount(amt)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        fundAmount === amt
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Target Wallet:</span>
                  <span className="font-mono font-bold text-indigo-600">{wallet.address.substring(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Engine:</span>
                  <span className="text-green-700 font-bold">Circle SDK Arc Bridge</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isProcessing ? 'Processing Deposit...' : `Confirm Deposit +$${fundAmount} USDC`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


