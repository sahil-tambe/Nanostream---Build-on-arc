import React, { useState } from 'react';
import { Terminal, RefreshCw, Cpu, CheckCircle2, Play, ChevronRight, Zap } from 'lucide-react';

interface CircleCliConsoleProps {
  onRunCliCommand: (command: string) => Promise<any>;
}

export const CircleCliConsole: React.FC<CircleCliConsoleProps> = ({ onRunCliCommand }) => {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Circle Agent Stack CLI v0.0.6 (latest)',
    'Type `circle update` or `circle skill update --tool claude-code` or select a shortcut command.',
    'System status: Arc Settlement Gateway connected. Wallet Manager initialized.',
  ]);
  const [inputCmd, setInputCmd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const runCommand = async (cmdString: string) => {
    if (!cmdString.trim()) return;
    setIsExecuting(true);
    setTerminalOutput((prev) => [...prev, `$ ${cmdString}`]);

    try {
      if (cmdString === 'circle update' || cmdString === 'circle skill update --tool claude-code') {
        const res = await onRunCliCommand(cmdString);
        if (res.logs) {
          setTerminalOutput((prev) => [...prev, ...res.logs, '✓ Done.']);
        }
      } else if (cmdString === 'circle status') {
        setTerminalOutput((prev) => [
          ...prev,
          '=== Circle Agent Stack Diagnostics ===',
          'CLI Version: v0.0.6',
          'Arc Settlement Adapter: ONLINE (EVM RPC 12ms latency)',
          'Circle SDK Wallet Stack: Active',
          'x402 Header Paywall Engine: Operational',
          'PostgreSQL Ledger: Connected',
        ]);
      } else if (cmdString === 'circle --version') {
        setTerminalOutput((prev) => [...prev, 'circle-cli version 0.0.6-release']);
      } else {
        setTerminalOutput((prev) => [
          ...prev,
          `Unknown or simulated command: '${cmdString}'. Available shortcuts: 'circle update', 'circle skill update --tool claude-code', 'circle status'`,
        ]);
      }
    } catch (err: any) {
      setTerminalOutput((prev) => [...prev, `Error executing command: ${err.message}`]);
    } finally {
      setIsExecuting(false);
      setInputCmd('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(inputCmd);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Circle Agent Stack Self-Updating CLI</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-500/20 text-green-400 border border-green-500/30">
              v0.0.6+ Verified
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1 font-medium">
            Keep your agent updated on the latest Circle patterns and products with a single command.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runCommand('circle update')}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin text-white' : ''}`} />
            <span>circle update</span>
          </button>

          <button
            onClick={() => runCommand('circle skill update --tool claude-code')}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span>circle skill update</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-2 shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] text-white/50 ml-2 font-sans font-bold">
              Circle CLI & Skill Manager Console
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">Target: Claude Code / AI Studio</span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-[11px] leading-relaxed">
          {terminalOutput.map((line, idx) => (
            <div
              key={idx}
              className={
                line.startsWith('$')
                  ? 'text-indigo-400 font-bold'
                  : line.startsWith('✓')
                  ? 'text-green-400 font-bold'
                  : line.startsWith('Error')
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>

        {/* Command Prompt Line */}
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-2 pt-2 border-t border-white/10">
          <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type 'circle update' or 'circle status'..."
            className="w-full bg-transparent border-none text-xs text-indigo-300 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={isExecuting}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs cursor-pointer"
          >
            <Play className="w-3 h-3" />
          </button>
        </form>
      </div>

    </div>
  );
};

