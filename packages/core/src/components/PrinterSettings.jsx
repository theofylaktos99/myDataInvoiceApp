import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_CONFIG = {
  mode: 'network',
  host: '',
  port: 9100,
  deviceName: '',
  silent: true,
};

const ESC = '\x1B';
const GS = '\x1D';

function encodeBase64(text) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function buildSampleTicket(now = new Date()) {
  const lines = [];
  lines.push(`${ESC}@`); // init printer
  lines.push(`${ESC}!\x00`); // default font
  lines.push('ITALIAN CORNER — ΔΟΚΙΜΗ');
  lines.push('Προεπισκόπηση Desktop App');
  lines.push('------------------------------');
  lines.push(`${now.toLocaleDateString('el-GR')} ${now.toLocaleTimeString('el-GR')}`);
  lines.push('Σύνολο: 123,45 €');
  lines.push('ΦΠΑ 13%: 14,22 €');
  lines.push('------------------------------');
  lines.push('Ευχαριστούμε!');
  lines.push(`${GS}V\x00`); // full cut
  return encodeBase64(lines.join('\n'));
}

export default function PrinterSettings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const isDesktop = Boolean(window.desktop?.env?.isDesktop);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (window.desktop?.settings?.loadDraft) {
          const saved = await window.desktop.settings.loadDraft();
          if (saved?.printer) {
            setConfig((prev) => ({ ...prev, ...saved.printer }));
          }
        } else {
          const raw = localStorage.getItem('printer_settings');
          if (raw) {
            setConfig((prev) => ({ ...prev, ...JSON.parse(raw) }));
          }
        }
      } catch (error) {
        console.warn('PrinterSettings bootstrap error', error);
      }
    }
    bootstrap();
  }, []);

  const persist = async (next) => {
    setConfig(next);
    try {
      if (window.desktop?.settings?.saveDraft) {
        const existing = await window.desktop.settings.loadDraft();
        await window.desktop.settings.saveDraft({ ...existing, printer: next });
      } else {
        localStorage.setItem('printer_settings', JSON.stringify(next));
      }
    } catch (error) {
      console.warn('PrinterSettings persist error', error);
    }
  };

  const updateField = (field, value) => {
    persist({ ...config, [field]: value });
  };

  const modeDescription = useMemo(() => {
    if (config.mode === 'network') {
      return 'Αποστέλλει απευθείας ESC/POS εντολές σε printer TCP/IP (port 9100).';
    }
    return 'Χρησιμοποιεί τον driver των Windows (System Print) μέσω Electron webContents.print().';
  }, [config.mode]);

  const handleRefreshPrinters = async () => {
    if (!window.desktop?.printer?.listPrinters) {
      setStatus('Η λίστα εκτυπωτών είναι διαθέσιμη μόνο σε desktop build.');
      return;
    }
    const printers = await window.desktop.printer.listPrinters();
    setAvailablePrinters(printers);
    setStatus(`Βρέθηκαν ${printers.length} εκτυπωτές συστήματος.`);
  };

  const handleTestNetwork = async () => {
    if (!isDesktop) {
      setStatus('Η δοκιμή είναι διαθέσιμη μόνο στο desktop app.');
      return;
    }
    if (!config.host) {
      setStatus('Ορίστε IP/όνομα φιλοξενίας.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Αποστολή δοκιμαστικής εκτύπωσης…');
      const payloadBase64 = buildSampleTicket();
      const response = await window.desktop?.printer?.printRawNetwork({
        host: config.host,
        port: Number(config.port) || 9100,
        payloadBase64,
      });
      if (response?.success) {
        setStatus('Η δοκιμαστική εκτύπωση εστάλη επιτυχώς.');
      } else {
        setStatus(`Αποτυχία: ${response?.error || 'Άγνωστο σφάλμα'}`);
      }
    } catch (error) {
      setStatus(`Σφάλμα: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSystemPrint = async () => {
    if (!isDesktop) {
      setStatus('Η λειτουργία απαιτεί desktop app.');
      return;
    }
    if (!config.deviceName) {
      setStatus('Επιλέξτε system printer.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Αποστολή μέσω system print…');
      const response = await window.desktop?.printer?.printSystem({
        deviceName: config.deviceName,
        silent: Boolean(config.silent),
      });
      if (response?.success) {
        setStatus('Το system print ολοκληρώθηκε.');
      } else {
        setStatus(`Αποτυχία: ${response?.failureReason || 'Άγνωστο σφάλμα'}`);
      }
    } catch (error) {
      setStatus(`Σφάλμα: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-white">Ρυθμίσεις Εκτυπωτή</h3>
          <p className="text-sm text-slate-400">Διαμόρφωση thermal printer για την desktop έκδοση.</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {isDesktop ? 'Desktop Mode' : 'Web Preview'}
        </span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">Λειτουργία</label>
          <select
            value={config.mode}
            onChange={(e) => updateField('mode', e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:ring-0"
          >
            <option value="network">Network ESC/POS (TCP 9100)</option>
            <option value="system">System Printer (driver)</option>
          </select>
          <p className="text-xs text-slate-400">{modeDescription}</p>
        </div>

        {config.mode === 'network' ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">IP / Hostname</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => updateField('host', e.target.value)}
              placeholder="π.χ. 192.168.1.50"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:ring-0"
            />
            <label className="block text-sm font-medium text-slate-200">Θύρα</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => updateField('port', e.target.value)}
              className="w-32 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:ring-0"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefreshPrinters}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
              >
                Αναζήτηση Εκτυπωτών
              </button>
              <span className="text-xs text-slate-400">Χρησιμοποιήστε το desktop app για να εμφανιστούν.</span>
            </div>
            <label className="block text-sm font-medium text-slate-200">System Printer</label>
            <select
              value={config.deviceName}
              onChange={(e) => updateField('deviceName', e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:ring-0"
            >
              <option value="">-- Επιλέξτε --</option>
              {availablePrinters.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName || printer.name}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={config.silent}
                onChange={(e) => updateField('silent', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              Silent printing (χωρίς dialog)
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleTestNetwork}
          disabled={loading || config.mode !== 'network'}
          className="rounded-2xl bg-emerald-500/90 px-5 py-3 text-sm font-semibold text-emerald-950 transition disabled:cursor-not-allowed disabled:bg-slate-700/60"
        >
          Test Network Print
        </button>
        <button
          type="button"
          onClick={handleTestSystemPrint}
          disabled={loading || config.mode !== 'system'}
          className="rounded-2xl border border-slate-700/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Test System Print
        </button>
        {loading && <span className="text-sm text-slate-400">Εκτελείται…</span>}
      </div>

      {status && (
        <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
          {status}
        </div>
      )}
    </div>
  );
}
