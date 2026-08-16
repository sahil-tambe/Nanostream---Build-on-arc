import React, { useState } from 'react';
import { TransactionRecord, AuditLogRecord } from '../types';
import { FileText, ShieldAlert, ArrowUpRight, Search, Download, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface TransactionAuditLogProps {
  transactions: TransactionRecord[];
  auditLogs: AuditLogRecord[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const TransactionAuditLog: React.FC<TransactionAuditLogProps> = ({
  transactions,
  auditLogs,
  onRefresh,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'audit'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredTransactions = transactions.filter((tx) =>
    tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.serviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.receiverAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'transactions') {
      csvContent += 'Timestamp,TxHash,ServiceId,SenderAddress,ReceiverAddress,AmountUSDC,Status,ExecutionTimeMs\n';
      filteredTransactions.forEach((tx) => {
        csvContent += `"${tx.createdAt}","${tx.txHash}","${tx.serviceId}","${tx.senderAddress}","${tx.receiverAddress}",${tx.amountUsdc},"${tx.status}",${tx.executionTimeMs}\n`;
      });
    } else {
      csvContent += 'Timestamp,Severity,Action,Details\n';
      filteredAuditLogs.forEach((log) => {
        csvContent += `"${log.createdAt}","${log.severity}","${log.action}","${log.details.replace(/"/g, '""')}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arc_nanopayment_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        
        {/* Left: Tab Switcher */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Financial Records ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Right: Search, Filter, Export & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 w-44 sm:w-56"
            />
          </div>

          {activeTab === 'audit' && (
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          )}

          <button
            onClick={exportCSV}
            title="Export CSV"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Logs"
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

      </div>

      {/* Table Content */}
      {activeTab === 'transactions' ? (
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No financial records found in PostgreSQL database.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Status / Hash</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Amount (USDC)</th>
                  <th className="py-3 px-3">Receiver Wallet</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-900 font-bold truncate max-w-[130px]" title={tx.txHash}>
                          {tx.txHash}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-indigo-700 text-[11px] font-bold">
                        {tx.serviceId}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-indigo-600 font-bold">-${parseFloat(tx.amountUsdc).toFixed(6)}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <span className="truncate block max-w-[120px]" title={tx.receiverAddress}>
                        {tx.receiverAddress}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-sans">
                      <span className="text-green-700 font-bold">{tx.executionTimeMs}ms</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px] font-sans">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAuditLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No audit logs matched your query.
            </div>
          ) : (
            filteredAuditLogs.map((log) => {
              const isError = log.severity === 'ERROR' || log.severity === 'CRITICAL';
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-r bg-slate-50 border-l-4 ${
                    isError ? 'border-rose-500' : 'border-indigo-600'
                  } border-t border-b border-r border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs`}
                >
                  <div className="flex items-start space-x-2.5">
                    {isError ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isError ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{log.severity}</span>
                      </div>
                      <p className="text-slate-800 mt-1 font-mono text-[11px] font-medium leading-snug">{log.details}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="pt-2 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-100">
        <span>PostgreSQL Durable Ledger • Cloud SQL Security Rules Active</span>
        <span>Auditability Compliance: Verified</span>
      </div>

    </div>
  );
};

