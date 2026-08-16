import React, { useState } from 'react';
import { UserWallet } from '../types';
import { ConnectedWeb3Wallet, ARC_TESTNET_CONFIG, switchToArcNetwork } from '../lib/web3Wallet';
import {
  Wallet,
  Shield,
  Settings2,
  PlusCircle,
  Check,
  Copy,
  Activity,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sliders,
  Sparkles,
  AlertTriangle,
  Play,
  QrCode,
  Layers,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface WalletCardProps {
  wallet: UserWallet | null;
  connectedWeb3Wallet?: ConnectedWeb3Wallet | null;
  onOpenWeb3Modal?: () => void;
  onFundWallet: (amount: number) => Promise<void>;
  onUpdateSettings: (settings: {
    autoStreamEnabled?: boolean;
    microRateCap?: number;
    dailyBudgetCap?: number;
  }) => Promise<void>;
  isProcessing: boolean;
}

interface PolicySimResult {
  verdict: 'APPROVED' | 'BLOCKED';
  statusCode: number;
  checks: Array<{
    rule: string;
    status: 'PASSED' | 'FAILED';
    message: string;
  }>;
  walletMetrics?: any;
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
  const [customFundAmount, setCustomFundAmount] = useState<string>('25');
  const [showQrModal, setShowQrModal] = useState(false);

  // Policy form state
  const [autoStream, setAutoStream] = useState(wallet?.autoStreamEnabled ?? true);
  const [rateCap, setRateCap] = useState(wallet?.microRateCap ?? '0.050000');
  const [dailyCap, setDailyCap] = useState(wallet?.dailyBudgetCap ?? '10.00');
  const [cooldownMs, setCooldownMs] = useState<number>(100);
  const [allowedServices, setAllowedServices] = useState<Record<string, boolean>>({
    'gemini-flash-ai': true,
    'fin-sentiment-stream': true,
    'arc-compute-node': true,
    'vector-search-ai': true,
  });

  // Simulator state
  const [simCost, setSimCost] = useState<string>('0.000200');
  const [simService, setSimService] = useState<string>('gemini-flash-ai');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<PolicySimResult | null>(null);

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customFundAmount) || fundAmount;
    await onFundWallet(amt);
    setShowFundModal(false);
  };

  const handleSaveSettings = async () => {
    await onUpdateSettings({
      autoStreamEnabled: autoStream,
      microRateCap: parseFloat(rateCap),
      dailyBudgetCap: parseFloat(dailyCap),
    });
  };

  const handleRunPolicySimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/policy/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCostUsdc: simCost,
          testServiceId: simService,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Policy simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSwitchToArc = async () => {
    try {
      await switchToArcNetwork();
    } catch (err: any) {
      alert(`Network switch: ${err.message}`);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
        <Activity className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Initializing Circle Smart Contract Account on Arc Settlement (Chain 436)...
        </p>
      </div>
    );
  }

  const balanceNum = parseFloat(wallet.balanceUsdc);
  const spentTodayNum = parseFloat(wallet.spentTodayUsdc);
  const dailyCapNum = parseFloat(wallet.dailyBudgetCap);
  const remainingBudget = Math.max(0, dailyCapNum - spentTodayNum);
  const budgetPercent = Math.min(100, Math.round((spentTodayNum / dailyCapNum) * 100));

  return (
    <div className="space-y-6">
      
      {/* 1. Main Smart Contract Account Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Account Details & Address */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" /> Circle Smart Contract Account (SCA)
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Arc Testnet (436)
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" /> ERC-4337 v0.6
              </span>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Programmable Wallet On-Chain Address (Arc EVM)
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <code className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-800 border border-slate-200 truncate max-w-[280px] sm:max-w-md font-bold select-all">
                  {wallet.address}
                </code>

                <button
                  onClick={copyAddress}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-1 transition-colors font-bold border border-slate-200 cursor-pointer"
                  title="Copy Full Address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-1 transition-colors font-bold border border-slate-200 cursor-pointer"
                  title="View Deposit QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QR Code</span>
                </button>

                <a
                  href={`https://testnet-explorer.arc.network/address/${wallet.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-1 transition-colors font-bold border border-slate-200"
                  title="View on Arc Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Explorer</span>
                </a>
              </div>
            </div>
          </div>

          {/* Real-time Streaming USDC Balance & Quick Fund Action */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 lg:w-84 shadow-2xs">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Streaming Pool Balance
                </p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Live & Streamable
                </span>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                  ${balanceNum.toFixed(4)}
                </span>
                <span className="text-xs font-extrabold text-indigo-600">USDC</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Sub-cent micro-settlement ready on Arc
              </p>
            </div>

            <button
              onClick={() => setShowFundModal(true)}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Fund Pool / Testnet Faucet</span>
            </button>
          </div>

        </div>

        {/* Daily Spending & Limit Progress Meter */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 font-medium">
              <Activity className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Daily Policy Usage:</span>
              <span className="font-bold text-slate-900 font-mono">
                ${spentTodayNum.toFixed(4)} spent of ${dailyCapNum.toFixed(2)} USDC cap
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Remaining Today:</span>
              <span className="font-bold font-mono text-emerald-600">${remainingBudget.toFixed(4)} USDC</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  budgetPercent > 85 ? 'bg-rose-500' : budgetPercent > 60 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono w-10 text-right">{budgetPercent}%</span>
          </div>
        </div>

      </div>

      {/* 2. Web3 EVM Crypto Wallet Bridge (MetaMask, Coinbase, Rainbow) */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">EVM Crypto Wallet Bridge</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Arc Chain 436
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Bridge funds from MetaMask, Coinbase Wallet, or Rabby into the Circle Agent Stream Pool
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {connectedWeb3Wallet && !connectedWeb3Wallet.isArcNetwork && (
              <button
                onClick={handleSwitchToArc}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Switch to Arc Testnet
              </button>
            )}

            <button
              onClick={onOpenWeb3Modal}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                connectedWeb3Wallet
                  ? 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {connectedWeb3Wallet ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{connectedWeb3Wallet.walletType.toUpperCase()}: {connectedWeb3Wallet.shortAddress}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Connect MetaMask / Web3</span>
                </>
              )}
            </button>
          </div>
        </div>

        {connectedWeb3Wallet ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
              <span className="text-slate-500 font-semibold block">Connected Chain</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {connectedWeb3Wallet.networkName}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
              <span className="text-slate-500 font-semibold block">Native Gas Balance</span>
              <span className="font-bold font-mono text-slate-900 text-sm block">
                {connectedWeb3Wallet.balanceNative} ARC
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
              <span className="text-slate-500 font-semibold block">Web3 Wallet USDC</span>
              <span className="font-bold font-mono text-indigo-600 text-sm block">
                ${connectedWeb3Wallet.balanceUsdc} USDC
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>No Web3 wallet linked. Connect MetaMask to directly sign and deposit from your personal EVM keys.</span>
            <span className="font-mono text-indigo-600 font-bold text-[11px] bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
              RPC: {ARC_TESTNET_CONFIG.rpcUrls[0]}
            </span>
          </div>
        )}
      </div>

      {/* 3. Autonomous Agent Policy & Security Engine */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Circle Agent Stack Policy Engine (v0.0.6)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Cryptographically enforced micro-spending guardrails preventing runaway AI loops
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> Arc Policy Enforcement Active
          </span>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Rule 1: Master Auto-Stream Switch */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Autonomous Streaming</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${autoStream ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {autoStream ? 'ENABLED' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Allows AI agents to settle HTTP 402 micro-invoices automatically
              </p>
            </div>

            <button
              onClick={() => setAutoStream(!autoStream)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer self-end ${
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

          {/* Rule 2: Per-Call Micro Rate Cap */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 block">Max Cost Per Call</label>
              <span className="text-[10px] font-mono text-indigo-600 font-bold">Rate Cap</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Rejects any single request exceeding this threshold</p>
            
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-xs text-slate-500 font-bold font-mono">$</span>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                max="1.00"
                value={rateCap}
                onChange={(e) => setRateCap(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
              <span className="text-xs font-bold text-slate-600">USDC</span>
            </div>
          </div>

          {/* Rule 3: Daily Budget Cap */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 block">Daily Budget Cap</label>
              <span className="text-[10px] font-mono text-indigo-600 font-bold">24h Limit</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Halts agent execution when daily consumption is reached</p>
            
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-xs text-slate-500 font-bold font-mono">$</span>
              <input
                type="number"
                step="1.00"
                min="1.00"
                max="500.00"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
              <span className="text-xs font-bold text-slate-600">USDC</span>
            </div>
          </div>

        </div>

        {/* Allowed API Whitelist Checkboxes */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
          <span className="text-xs font-bold text-slate-900 block">
            Permitted x402 Micro-Service Whitelist:
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'gemini-flash-ai', label: 'Gemini 2.5 Flash AI API' },
              { id: 'fin-sentiment-stream', label: 'Financial Sentiment Stream' },
              { id: 'arc-compute-node', label: 'Arc Compute Node (SHA256)' },
              { id: 'vector-search-ai', label: 'Vector Semantic Search' },
            ].map((srv) => (
              <label
                key={srv.id}
                className="flex items-center space-x-2 bg-white border border-slate-200 p-2 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={allowedServices[srv.id] ?? true}
                  onChange={(e) =>
                    setAllowedServices({ ...allowedServices, [srv.id]: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] font-semibold text-slate-700 truncate">{srv.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Policy Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveSettings}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Commit Policy Changes to Ledger</span>
          </button>
        </div>

      </div>

      {/* 4. Live Policy Simulator & Verification Engine */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Live Policy Verification Simulator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Interactive Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Test any hypothetical transaction against your active guardrail rules to see the cryptographic verdict
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Target Service</label>
            <select
              value={simService}
              onChange={(e) => setSimService(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-flash-ai">Gemini 2.5 Flash ($0.000200)</option>
              <option value="fin-sentiment-stream">Financial Sentiment ($0.000150)</option>
              <option value="arc-compute-node">Arc Compute Node ($0.000500)</option>
              <option value="vector-search-ai">Vector Search ($0.000100)</option>
              <option value="custom-high-cost">Custom High-Cost Query ($0.150000)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Estimated Transaction Cost</label>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.0001"
                value={simCost}
                onChange={(e) => setSimCost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">USDC</span>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunPolicySimulation}
              disabled={isSimulating}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Run Policy Verification</span>
            </button>
          </div>
        </div>

        {/* Simulation Output Card */}
        {simResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 pt-3 mt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Policy Engine Evaluation Verdict
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                  simResult.verdict === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {simResult.verdict === 'APPROVED' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>STATUS: 200 APPROVED</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>STATUS: 403 POLICY VIOLATION</span>
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {simResult.checks.map((chk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {chk.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200">{chk.rule}</span>
                  </div>
                  <span className={`text-[11px] font-mono font-medium ${chk.status === 'PASSED' ? 'text-slate-400' : 'text-rose-300'}`}>
                    {chk.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Fund / Faucet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Fund Stream Pool</h3>
                  <p className="text-xs text-slate-500 font-medium">Deposit testnet USDC to enable micro-streaming</p>
                </div>
              </div>
              <button
                onClick={() => setShowFundModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFundSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Quick Preset:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setFundAmount(amt);
                        setCustomFundAmount(amt.toString());
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        parseFloat(customFundAmount) === amt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Custom Amount (USDC):</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customFundAmount}
                    onChange={(e) => setCustomFundAmount(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <span className="text-xs font-bold text-indigo-600">USDC</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed font-medium">
                Funds are immediately credited to your Circle Programmable Wallet on the Arc Settlement Layer.
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  {isProcessing ? 'Crediting...' : `Deposit $${customFundAmount} USDC`}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Deposit QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900">Arc Wallet Address</h4>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Generated QR Placeholder */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
              <div className="w-48 h-48 bg-white border border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
                <QrCode className="w-32 h-32 text-slate-800" />
                <span className="text-[10px] font-mono text-slate-500 font-bold truncate max-w-[180px]">
                  {wallet.address}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Scan from MetaMask Mobile or send testnet USDC on Arc (Chain ID 436).
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
