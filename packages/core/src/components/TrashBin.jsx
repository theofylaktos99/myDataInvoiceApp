import React, { useMemo } from 'react';
import { formatDate, formatDateTime as fmtDT } from '../utils/date.js';
import { TrashIcon, HistoryIcon } from './icons.jsx';

const TrashBin = ({
  entries = [],
  branches = {},
  dateFormat='DD-MM-YYYY',
  onRestore,
  onDeleteForever,
  onEmpty,
  disableActions = false,
}) => {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [entries]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('el-GR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

  const formatDeletedAt = (value) => {
    if (!value) return '—';
    const raw = fmtDT(value, dateFormat);
    return raw || '—';
  };

  const renderEmptyState = () => (
    <div className="py-12 text-center text-slate-500">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-900/70 text-slate-400">
        <HistoryIcon className="h-6 w-6" />
      </div>
      <h4 className="text-lg font-semibold text-slate-200 mb-2">Ο κάδος ανακύκλωσης είναι άδειος</h4>
      <p className="text-sm text-slate-400">Τα διαγραμμένα τιμολόγια θα εμφανιστούν εδώ για πιθανή επαναφορά.</p>
    </div>
  );

  return (
    <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800/60 overflow-hidden backdrop-blur">
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-200">
              <TrashIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Κάδος Ανακύκλωσης</h3>
              <p className="text-sm text-slate-400">Δες και διαχειρίσου τιμολόγια που μετακινήθηκαν από το ιστορικό.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700/60 px-3 py-1">Σύνολο: {entries.length}</span>
            {onEmpty && (
              <button
                type="button"
                onClick={onEmpty}
                disabled={disableActions || !entries.length}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Άδειασμα κάδου
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {sortedEntries.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-100">
              <thead>
                <tr className="border-b border-slate-800/60 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <th className="text-left py-3 px-3 font-semibold">Διαγράφηκε</th>
                  <th className="text-left py-3 px-3 font-semibold">Αρ. Τιμ.</th>
                  <th className="text-left py-3 px-3 font-semibold">Υποκατάστημα</th>
                  <th className="text-left py-3 px-3 font-semibold">Πελάτης</th>
                  <th className="text-left py-3 px-3 font-semibold">ΑΦΜ</th>
                  <th className="text-right py-3 px-3 font-semibold">Σύνολο</th>
                  <th className="text-center py-3 px-3 font-semibold">Κατάσταση</th>
                  <th className="text-center py-3 px-3 font-semibold">MARK / Σφάλμα</th>
                  <th className="text-center py-3 px-3 font-semibold">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => {
                  const totals = entry?.totals || {};
                  const branchLabel = branches[entry.branchId]?.label || entry.branchId || '';
                  return (
                    <tr key={entry.id} className="border-b border-slate-800/40 hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">{formatDeletedAt(entry.deletedAt)}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-100">{entry.invoiceNumber || '—'}</td>
                      <td className="py-3 px-3 text-slate-300">{branchLabel}</td>
                      <td className="py-3 px-3 text-slate-300">{entry.customer?.name || '—'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{entry.customer?.vat || '—'}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-300">
                        {formatCurrency(totals?.gross ?? 0)} €
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.status === 'sent'
                              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20'
                              : 'bg-rose-500/20 text-rose-200 border border-rose-500/20'
                          }`}
                        >
                          {entry.status === 'sent' ? 'Επιτυχία' : 'Αποτυχία'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-center font-mono text-slate-400">{entry.mark || entry.error || '—'}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          {onRestore && (
                            <button
                              type="button"
                              onClick={() => onRestore(entry)}
                              disabled={disableActions}
                              className="px-3 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Επαναφορά
                            </button>
                          )}
                          {onDeleteForever && (
                            <button
                              type="button"
                              onClick={() => onDeleteForever(entry)}
                              disabled={disableActions}
                              className="px-3 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs font-medium text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Μόνιμη διαγραφή
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashBin;
