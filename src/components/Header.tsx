import React, { useState } from 'react';
import { UserWallet } from '../types';
import { ConnectedWeb3Wallet } from '../lib/web3Wallet';
import {
  Zap,
  ShieldCheck,
  Wallet,
  LogIn,
  LogOut,
  RefreshCw,
  Globe,
  ChevronDown,
  Info,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  wallet: UserWallet | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  connectedWeb3Wallet: ConnectedWeb3Wallet | null;
  onOpenWeb3Modal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefreshWallet: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  userEmail,
  userName,
  userAvatar,
  connectedWeb3Wallet,
  onOpenWeb3Modal,
  onSignIn,
  onSignOut,
  onRefreshWallet,
  isRefreshing,
}) => {
  const [showStackModal, setShowStackModal] = useState(false);
  const balance = wallet ? parseFloat(wallet.balanceUsdc).toFixed(4) : '0.0000';

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Professional Brand Lockup */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
                  Nanostream
                </span>
                <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                  Built on Arc
                </span>

                {/* Circle Stack Specification Trigger */}
                <button
                  type="button"
                  onClick={() => setShowStackModal(true)}
                  title="Architecture Specification"
                  className="hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Circle Stack v0.0.6</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Autonomous AI Micropayment Settlement Layer
              </p>
            </div>
          </div>

          {/* Right Controls: Balance, Web3 Wallet, Stack Info, and User Auth */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Stream Pool USDC Balance Ticker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-3 py-1.5 flex items-center space-x-1.5 sm:space-x-2 shadow-2xs">
              <div className="flex items-center space-x-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Pool:</span>
              </div>
              <div className="flex items-baseline space-x-0.5 sm:space-x-1">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tracking-tight">{balance}</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600">USDC</span>
              </div>
              <button
                onClick={onRefreshWallet}
                disabled={isRefreshing}
                title="Sync Balance"
                className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* Web3 / Crypto Wallet Connect Button */}
            <button
              onClick={onOpenWeb3Modal}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                connectedWeb3Wallet
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/80'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
              }`}
            >
              {connectedWeb3Wallet ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono">{connectedWeb3Wallet.shortAddress}</span>
                  <ChevronDown className="w-3 h-3 text-indigo-500" />
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Web3</span>
                </>
              )}
            </button>

            {/* Info Trigger for Smaller Screens */}
            <button
              type="button"
              onClick={() => setShowStackModal(true)}
              title="Architecture Specifications"
              className="lg:hidden p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Google User Auth */}
            {userEmail ? (
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 sm:p-1.5 rounded-xl border border-slate-200">
                {userAvatar ? (
                  <img src={userAvatar} alt="User avatar" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(userName || userEmail).substring(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Circle Developer Stack Specification Modal */}
      {showStackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Circle Developer Stack Architecture</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      v0.0.6
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Autonomous AI Agent Micropayment & Settlement Architecture
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStackModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                System Overview
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Circle Developer Stack v0.0.6 establishes an autonomous transaction pipeline combining <strong>Developer-Controlled Programmable Wallets</strong>, <strong>x402 protocol standards</strong>, and <strong>on-chain micro-budget policies</strong>. This allows AI agents to consume compute and services in sub-cent increments settled via the Arc network.
              </p>
            </div>

            {/* Architectural Modules */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Core Components
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Programmable Wallets</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Smart Contract Accounts holding micro-USDC dedicated exclusively for automated agent execution.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>x402 Protocol</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    HTTP 402 Payment Required negotiation protocol enabling granular pay-per-request monetization.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Spending Policies</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Cryptographic rate caps and daily limits preventing excessive drainage or infinite compute loops.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Arc Settlement (436)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    High-throughput, sub-second EVM settlement layer designed for micro-transaction volume.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStackModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
