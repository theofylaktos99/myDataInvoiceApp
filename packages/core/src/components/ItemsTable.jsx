import React, { useState } from 'react';

// Utility function for rounding to 2 decimals
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const RESTAURANT_BRANCH_IDS = ['central', 'kandavlos'];
const VILLA_BRANCH_IDS = ['villa1', 'villa2'];

const descriptionPlaceholderForBranch = (branchId) => {
  if (RESTAURANT_BRANCH_IDS.includes(branchId)) return 'Γεύμα/Δείπνο';
  if (VILLA_BRANCH_IDS.includes(branchId)) return 'Παροχή υπηρεσιών βραχυχρόνιας μίσθωσης τουριστικού καταλύματος (βίλα)';
  return 'Περιγραφή';
};

// Custom numeric input that allows typing decimals smoothly
const NumericInput = ({ value, onChange, className, step, min }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value when external value changes (and not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setLocalValue(raw);
    
    // Parse and update parent only if valid number
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(num);
    } else if (raw === '' || raw === '-') {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On blur, format the value properly
    const num = parseFloat(localValue);
    if (isNaN(num)) {
      setLocalValue('0');
      onChange(0);
    } else {
      setLocalValue(String(num));
      onChange(num);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    e.target.select();
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};

const ItemsTable = ({ items, branchCfg, onChangeItem, onAddItem, onRemoveItem }) => {
  return (
    <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800/60 overflow-hidden backdrop-blur">
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Είδη / Υπηρεσίες</h3>
        <button
          onClick={onAddItem}
          className="px-4 py-2 bg-sky-500/90 hover:bg-sky-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-md shadow-sky-500/30"
        >
          Νέα Γραμμή
        </button>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-100">
            <thead>
                <tr className="border-b border-slate-800/60 text-xs uppercase tracking-widest text-slate-400">
                <th className="text-left px-2 py-3 font-semibold">Περιγραφή</th>
                <th className="px-2 py-3 font-semibold">
                  <div className="w-24 px-3 mx-auto text-center whitespace-nowrap">Ποσότητα</div>
                </th>
                <th className="px-2 py-3 font-semibold">
                  <div className="w-28 px-3 mx-auto text-center whitespace-nowrap">Τιμή (€)</div>
                </th>
                <th className="text-center px-2 py-3 font-semibold">ΦΠΑ</th>
                <th className="text-right px-2 py-3 font-semibold">Καθαρή</th>
                <th className="text-right px-2 py-3 font-semibold">ΦΠΑ €</th>
                <th className="text-right px-2 py-3 font-semibold">Σύνολο</th>
                <th className="text-center px-2 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                // Treat entered price as VAT-inclusive (gross)
                const qty = Number(item.qty || 0);
                const grossUnit = Number(item.price || 0);
                const rate = Number(item.vatRate || 0);
                const factor = 1 + (rate / 100);
                const gross = round2(qty * grossUnit);
                const net = round2(gross / (factor || 1));
                const vat = round2(gross - net);

                return (
                  <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-900/60 transition-colors">
                      <td className="py-2 px-2 align-middle">
                        <input
                          className="w-full px-3 h-10 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          placeholder={descriptionPlaceholderForBranch(branchCfg?.id)}
                          value={item.description}
                          onChange={(e) => onChangeItem(idx, { description: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2 align-middle">
                        <NumericInput
                          className="w-24 px-3 h-10 bg-slate-950 border border-slate-800 rounded-lg text-right text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          value={item.qty}
                          onChange={(val) => onChangeItem(idx, { qty: val })}
                        />
                      </td>
                      <td className="py-2 px-2 align-middle">
                        <NumericInput
                          className="w-28 px-3 h-10 bg-slate-950 border border-slate-800 rounded-lg text-right text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          value={item.price}
                          onChange={(val) => onChangeItem(idx, { price: val })}
                        />
                      </td>
                      <td className="py-2 px-2 text-center align-middle">
                        <select
                          className="px-3 h-10 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                          value={item.vatRate}
                          onChange={(e) => onChangeItem(idx, { vatRate: Number(e.target.value) })}
                        >
                          {branchCfg.revenueMapping.allowedVatRates.map(r => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-slate-200 align-middle">{net.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-medium text-slate-200 align-middle">{vat.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-300 align-middle">{gross.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center align-middle">
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold text-lg"
                        title="Διαγραφή"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">📋</div>
            <p>Δεν υπάρχουν γραμμές ειδών/υπηρεσιών</p>
            <p className="text-sm mt-1">Πατήστε "Νέα Γραμμή" για να προσθέσετε</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsTable;

