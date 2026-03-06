import React from 'react';

const OPTIONS = [
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (07-11-2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-11-07)' },
];

export default function DateSettings({ dateFormat, onChange }) {
  return (
    <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800/60 overflow-hidden backdrop-blur">
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800/60">
        <h3 className="text-lg font-semibold text-slate-100">Ρυθμίσεις Ημερομηνίας</h3>
        <p className="text-sm text-slate-400">Επίλεξε τη μορφή εμφάνισης ημερομηνιών στην εφαρμογή, CSV και PDF.</p>
      </div>
      <div className="p-6 space-y-4">
        <label className="block text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-2">Μορφή ημερομηνίας</label>
        <select
          value={dateFormat}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:border-slate-500/80 focus:outline-none"
        >
          {OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Η ρύθμιση αποθηκεύεται τοπικά και εφαρμόζεται σε όλες τις προβολές.</p>
      </div>
    </div>
  );
}
