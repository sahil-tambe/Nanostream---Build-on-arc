import React, { useState } from 'react';
import {
  ConnectedWeb3Wallet,
  connectInjectedWallet,
  connectDemoArcWallet,
  switchToArcNetwork,
  signStreamAuthorization,
  isMetaMaskInstalled,
  isCoinbaseWalletInstalled,
  fetchWeb3Balances,
  ARC_TESTNET_CONFIG,
} from '../lib/web3Wallet';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  ArrowRight,
  LogOut,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWeb3Wallet | null;
  onWalletConnected: (wallet: ConnectedWeb3Wallet | null) => void;
  onDepositToCircleStream: (amount: number) => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onWalletConnected,
  onDepositToCircleStream,
  showToast,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bridgeAmount, setBridgeAmount] = useState<number>(20);
  const [isBridging, setIsBridging] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);

  if (!isOpen) return null;

  const hasMetaMask = isMetaMaskInstalled();
  const hasCoinbase = isCoinbaseWalletInstalled();

  const handleRefreshBalances = async () => {
    if (!connectedWallet) return;
    setIsRefreshingBalances(true);
    try {
      const balances = await fetchWeb3Balances(connectedWallet.address);
      const updated: ConnectedWeb3Wallet = {
        ...connectedWallet,
        balanceNative: balances.balanceNative,
        balanceUsdc: balances.balanceUsdc,
      };
      onWalletConnected(updated);
      showToast('Web3 & USDC Balances updated from on-chain provider!');
    } catch (err: any) {
      showToast(`Balance refresh failed: ${err.message}`, 'error');
    } finally {
      setIsRefreshingBalances(false);
    }
  };

  const handleConnect = async (walletType: 'metamask' | 'coinbase' | 'rainbow' | 'injected' | 'demo') => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      if (walletType === 'demo') {
        const demoWallet = connectDemoArcWallet('metamask');
        onWalletConnected(demoWallet);
        showToast('Connected to Arc Settlement Demo Web3 Wallet! (+$250 USDC)');
        return;
      }

      const wallet = await connectInjectedWallet(walletType);
      onWalletConnected(wallet);
      showToast(`Connected ${walletType.toUpperCase()} wallet successfully!`);
    } catch (err: any) {
      console.warn('Wallet connection error:', err);
      setErrorMessage(err.message || 'Failed to connect wallet');
      // If no extension, offer demo fallback
      if (err.message?.includes('No crypto wallet extension')) {
        setErrorMessage('No MetaMask extension detected in browser. Click "Connect Arc Sandbox Wallet" below to test without installing extensions.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchToArc = async () => {
    try {
      const success = await switchToArcNetwork();
      if (success && connectedWallet) {
        onWalletConnected({
          ...connectedWallet,
          chainId: ARC_TESTNET_CONFIG.chainIdHex,
          networkName: ARC_TESTNET_CONFIG.chainName,
          isArcNetwork: true,
        });
        showToast('Switched to Arc Settlement Testnet (Chain ID 436)!');
      }
    } catch (err: any) {
      showToast(`Network switch failed: ${err.message}`, 'error');
    }
  };

  const handleSignPolicy = async () => {
    if (!connectedWallet) return;
    setIsSigning(true);
    try {
      await signStreamAuthorization(connectedWallet.address, '0.0500', '10.00');
      setHasSigned(true);
      showToast('EIP-712 / Personal Signature verified on Arc Settlement!');
    } catch (err: any) {
      showToast(`Signature failed: ${err.message}`, 'error');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDepositBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) return;
    setIsBridging(true);
    try {
      await onDepositToCircleStream(bridgeAmount);
      showToast(`Bridged +$${bridgeAmount} USDC from ${connectedWallet.shortAddress} to Circle Nanopayment Stream!`);
    } catch (err: any) {
      showToast(`Deposit failed: ${err.message}`, 'error');
    } finally {
      setIsBridging(false);
    }
  };

  const copyAddress = () => {
    if (connectedWallet?.address) {
      navigator.clipboard.writeText(connectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {connectedWallet ? 'Web3 Crypto Wallet' : 'Connect Crypto Wallet'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Build on Arc: Nanostream Settlement & Bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {!connectedWallet ? (
          /* Wallet Selector List */
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">
              Connect your EVM wallet to authenticate on-chain, switch to Arc Settlement, and bridge USDC into autonomous nanopayment streaming.
            </p>

            <div className="space-y-2.5">
              
              {/* MetaMask Option */}
              <button
                type="button"
                onClick={() => handleConnect('metamask')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center p-1.5 shadow-xs">
                    {/* MetaMask Fox SVG */}
                    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                      <path d="M28.09 3.91L17.7 11.58l1.92-4.57 8.47-3.1z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
                      <path d="M3.91 3.91l10.27 7.74-1.8-4.64L3.91 3.91z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
                      <path d="M23.95 22.82l-2.73 4.19 6.22 1.71 1.78-6.1-5.27.2z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
                      <path d="M2.78 22.62l1.78 6.1 6.22-1.71-2.73-4.19-5.27-.2z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
                      <path d="M10.45 14.1l-1.72 2.59 6.13.27-.23-6.58-4.18 3.72z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
                      <path d="M21.55 14.1l-4.24-3.79-.17 6.65 6.13-.27-1.72-2.59z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
                      <path d="M10.77 27.01l3.52-1.71-3.03-2.36-.49 4.07z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
                      <path d="M17.71 25.3l3.52 1.71-.49-4.07-3.03 2.36z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
                      <path d="M16 20.4l-4.48-1.32 3.16-1.01 1.32-2.33 1.32 2.33 3.16 1.01L16 20.4z" fill="#233447" stroke="#233447" strokeWidth="0.5"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">MetaMask</span>
                      {hasMetaMask && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Detected
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Connect with MetaMask browser extension</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Coinbase Wallet */}
              <button
                type="button"
                onClick={() => handleConnect('coinbase')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-2 shadow-xs">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      C
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Coinbase Wallet</span>
                      {hasCoinbase && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Detected
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Coinbase Smart Wallet & App</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Rainbow / Injected EVM */}
              <button
                type="button"
                onClick={() => handleConnect('injected')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center p-2 shadow-xs">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">
                      Injected Web3 / Rainbow / Rabby
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Standard EIP-1193 EVM browser provider</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 1-Click Arc Sandbox Wallet (Instant Testnet Demo) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleConnect('demo')}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer group shadow-sm border border-slate-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center p-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">Instant Arc Sandbox Web3 Wallet</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                          1-Click Demo
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Pre-funded with 8.45 ARC & $250 USDC on Arc Settlement
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Arc Settlement Parameters</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span>Chain ID:</span>
                <span className="font-bold text-indigo-600">436 (0x1B4)</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span>RPC URL:</span>
                <span className="truncate max-w-[220px]">https://testnet-rpc.arc.network</span>
              </div>
            </div>
          </div>
        ) : (
          /* Connected Wallet Details & Bridge */
          <div className="space-y-5">
            
            {/* Account Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connected Account</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleRefreshBalances}
                    disabled={isRefreshingBalances}
                    className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                    title="Refresh on-chain balances"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingBalances ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{isRefreshingBalances ? 'Syncing...' : 'Sync USDC'}</span>
                  </button>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {connectedWallet.walletType.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
                <code className="text-xs font-mono font-bold text-slate-800 truncate max-w-[280px]">
                  {connectedWallet.address}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Balances & Network */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                  <span className="text-slate-500 font-medium block">Native Asset</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {connectedWallet.balanceNative} ARC
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                  <span className="text-slate-500 font-medium block">USDC Balance</span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">
                    ${connectedWallet.balanceUsdc} USDC
                  </span>
                </div>
              </div>

              {/* Network Status & Switcher */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600 font-medium">Network:</span>
                  <span className="font-bold text-slate-800">{connectedWallet.networkName}</span>
                </div>

                {!connectedWallet.isArcNetwork ? (
                  <button
                    onClick={handleSwitchToArc}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Switch to Arc Testnet
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" /> Arc Active
                  </span>
                )}
              </div>
            </div>

            {/* Authorization Signature Panel */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Sign Agent Streaming Mandate</span>
                </div>
                {hasSigned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                    Signed & Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Cryptographically authorize the Circle Agent Stack to stream micropayments directly on Arc settlement for x402 endpoints.
              </p>
              <button
                type="button"
                onClick={handleSignPolicy}
                disabled={isSigning || hasSigned}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  hasSigned
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {hasSigned ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Streaming Policy Signed</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>{isSigning ? 'Waiting for Signature...' : 'Sign with Connected Wallet'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Bridge / Deposit into Circle Nanopayment Stream */}
            <form onSubmit={handleDepositBridge} className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Bridge USDC from {connectedWallet.walletType.toUpperCase()} to Circle Streaming Pool:
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBridgeAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bridgeAmount === amt
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    +${amt} USDC
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onWalletConnected(null)}
                  className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Wallet</span>
                </button>

                <button
                  type="submit"
                  disabled={isBridging}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>{isBridging ? 'Bridging USDC...' : `Bridge +$${bridgeAmount} USDC`}</span>
                </button>
              </div>
            </form>

          </div>
        )}

        <div className="pt-2 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100">
          <span>EIP-1193 EVM Standard • MetaMask, Coinbase, Rainbow</span>
          <span>Settlement: Arc L1/L2</span>
        </div>

      </div>
    </div>
  );
};
