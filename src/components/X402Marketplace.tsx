import React, { useState } from 'react';
import { X402Service, UserWallet } from '../types';
import { Sparkles, Cpu, LineChart, Database, Zap, ArrowRight, CheckCircle2, ShieldAlert, Terminal } from 'lucide-react';

interface X402MarketplaceProps {
  services: X402Service[];
  wallet: UserWallet | null;
  onConsumeService: (serviceId: string, promptPayload?: string) => Promise<any>;
  isConsuming: boolean;
}

export const X402Marketplace: React.FC<X402MarketplaceProps> = ({
  services,
  wallet,
  onConsumeService,
  isConsuming,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('gemini-flash-ai');
  const [promptText, setPromptText] = useState<string>('Explain how x402 autonomous nanopayments replace traditional monthly subscriptions.');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'AI Inference':
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
      case 'Financial Data':
        return <LineChart className="w-5 h-5 text-green-600" />;
      case 'Cloud Compute':
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case 'AI Vector DB':
      default:
        return <Database className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleRunService = async () => {
    setErrorMessage(null);
    try {
      const result = await onConsumeService(selectedServiceId, promptText);
      setLastResponse(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Nanopayment failed');
    }
  };

  const currentService = services.find((s) => s.serviceId === selectedServiceId) || services[0];

  return (
    <div className="space-y-6">
      
      {/* Title & Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                x402 Protocol Compatible
              </span>
              <span className="text-xs text-slate-500 font-medium">Zero Monthly Fees • Pay-Per-Request</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
              AI-Driven Nanopayment Service Marketplace
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
              Select an API endpoint. When you send a request, your autonomous Circle SDK Agent streams fractions of a cent ($0.0001–$0.001 USDC) directly to the developer's Arc wallet.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
            <span className="text-xs text-slate-500 block font-medium">Arc Settlement Finality</span>
            <span className="text-sm font-extrabold text-green-700 font-mono">12ms ~ 25ms</span>
          </div>
        </div>
      </div>

      {/* Grid: Services List & Interactive Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Service Selector Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available Micro-APIs
          </h3>

          <div className="space-y-2.5">
            {services.map((serv) => {
              const isSelected = serv.serviceId === selectedServiceId;
              const price = parseFloat(serv.pricePerUnitUsdc).toFixed(6);

              return (
                <div
                  key={serv.serviceId}
                  onClick={() => {
                    setSelectedServiceId(serv.serviceId);
                    setLastResponse(null);
                    setErrorMessage(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/60 border-indigo-600 shadow-xs ring-1 ring-indigo-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        {getServiceIcon(serv.category)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{serv.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">{serv.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-extrabold text-indigo-600">${price}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">/ {serv.unitName}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 font-medium">{serv.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Interactive Execution Playground (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5 flex flex-col justify-between shadow-sm">
          
          <div className="space-y-4">
            
            {/* Playground Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  x402 Sandbox: <span className="text-indigo-600">{currentService?.name}</span>
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Micro-Price:</span>
                <span className="font-mono font-bold text-indigo-600">
                  ${parseFloat(currentService?.pricePerUnitUsdc || '0.0002').toFixed(6)} USDC
                </span>
              </div>
            </div>

            {/* Input Payload for Gemini or Service */}
            {selectedServiceId === 'gemini-flash-ai' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Gemini 2.5 Flash Prompt (Micro-billed per token request):
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">Live AI Generation</span>
                </div>
                <textarea
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter any custom prompt for Gemini AI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white resize-none font-sans shadow-2xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Prompts:</span>
                  {[
                    'Write a Python x402 payment streamer',
                    'Explain Arc settlement in 10 words',
                    'Calculate AI agent token costs',
                    'Draft an ERC-20 payment policy',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPromptText(chip)}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedServiceId === 'fin-sentiment-stream' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Asset Pair / Market Symbol to Analyze:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. ARC/USDC, ETH/USDC, BTC/USDC"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <div className="flex space-x-1">
                    {['ARC/USDC', 'ETH/USDC', 'SOL/USDC'].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setPromptText(sym)}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-bold rounded-lg border border-slate-200"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedServiceId === 'arc-compute-node' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Compute Operation / Job Payload:
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. SHA256 Matrix Digest, ZK Proof Verification"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Semantic Vector Search Query:
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Autonomous Wallet Streaming Guidelines"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            )}

            {/* Trigger Nanopayment Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 font-medium">
                Wallet Balance: <span className="font-extrabold text-slate-900">${parseFloat(wallet?.balanceUsdc || '0').toFixed(4)} USDC</span>
              </div>

              <button
                onClick={handleRunService}
                disabled={isConsuming || !wallet?.autoStreamEnabled}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                  !wallet?.autoStreamEnabled
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isConsuming ? (
                  <>
                    <Zap className="w-4 h-4 text-white animate-spin" />
                    <span>Streaming Arc Nanopayment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Execute & Stream ${parseFloat(currentService?.pricePerUnitUsdc || '0.0002').toFixed(6)} USDC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Response Output Box */}
            {lastResponse && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                
                {/* Circle Payment Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-green-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>x402-PAID • Arc Settlement Confirmed</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: <span className="text-slate-800 font-bold">{lastResponse.payment?.executionTimeMs}ms</span>
                  </div>
                </div>

                {/* Tx Hash */}
                <div className="text-[11px] text-slate-600 font-mono flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="truncate">TxHash: {lastResponse.payment?.txHash}</span>
                  <span className="text-indigo-600 font-bold ml-2">-{lastResponse.payment?.amountUsdc} USDC</span>
                </div>

                {/* Service Output Display */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    API Response Payload
                  </span>

                  {lastResponse.serviceOutput?.type === 'ai_response' ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans font-medium shadow-xs">
                      <p>{lastResponse.serviceOutput?.text}</p>
                    </div>
                  ) : (
                    <pre className="bg-slate-900 p-3 rounded-lg text-[11px] text-green-400 font-mono overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(lastResponse.serviceOutput, null, 2)}
                    </pre>
                  )}
                </div>

              </div>
            )}

          </div>

          <div className="pt-3 text-[11px] text-slate-400 font-medium border-t border-slate-100 flex items-center justify-between">
            <span>Powered by Circle Agent Stack & Arc Settlement Network</span>
            <span>x402 Header Code: 200 OK</span>
          </div>

        </div>

      </div>

    </div>
  );
};

