// jsPDF will be loaded via script tag in HTML
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './pdfGenerator.js';

// Import premium components
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import CustomerPanel from './components/CustomerPanel.jsx';
import InvoiceMetadata from './components/InvoiceMetadata.jsx';
import ItemsTable from './components/ItemsTable.jsx';
import TotalsPanel from './components/TotalsPanel.jsx';
import FailedSubmissions from './components/FailedSubmissions.jsx';
import HistoryTable from './components/HistoryTable.jsx';
import TrashBin from './components/TrashBin.jsx';
import DateSettings from './components/DateSettings.jsx';
import BackendControls from './components/BackendControls.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import PDFPreviewModal from './components/PDFPreviewModal.jsx';
import ExperienceRibbon from './components/ExperienceRibbon.jsx';
import PrinterSettings from './components/PrinterSettings.jsx';
import { DocumentStackIcon, CheckCircleIcon, HistoryIcon, WarningIcon } from './components/icons.jsx';
import { BRANCHES } from './branches/index.js';

// Default descriptions per branch
const DEFAULT_RESTAURANT_DESC = 'Γεύμα/Δείπνο';
const DEFAULT_VILLA_DESC = 'Παροχή υπηρεσιών βραχυχρόνιας μίσθωσης τουριστικού καταλύματος (βίλα)';
const RESTAURANT_BRANCH_IDS = ['kandavlos'];
const VILLA_BRANCH_IDS = [];

const INCOME_CLASSIFICATION_MAP = {
  // Εστίαση: Πώληση αγαθών (category1_1) - Χονδρικές-Επιτηδευματιών για τιμολόγια B2B (1.1)
  E3_RESTAURANT: { classificationType: 'E3_561_001', classificationCategory: 'category1_1' },
  // Διαμονή: Παροχή υπηρεσιών (category1_3) - Χονδρικές για τιμολόγια B2B (2.1)
  E3_ACCOMMODATION: { classificationType: 'E3_561_001', classificationCategory: 'category1_3' },
  // Τέλος Ανθεκτικότητας: Λοιπά έσοδα (category1_5)
  E3_SURCHARGE: { classificationType: 'E3_562', classificationCategory: 'category1_5' },
  // Γενικό fallback
  E3_GENERIC: { classificationType: 'E3_561_001', classificationCategory: 'category1_1' },
};

const getDefaultDescriptionForBranch = (branchId) => {
  if (RESTAURANT_BRANCH_IDS.includes(branchId)) return DEFAULT_RESTAURANT_DESC;
  if (VILLA_BRANCH_IDS.includes(branchId)) return DEFAULT_VILLA_DESC;
  return '';
};

// BRANCHES moved to src/branches
function validateInvoiceForAADE(invoice, branchCfg) {
  const errors = [];
  if (!invoice.invoiceNumber) errors.push('Αριθμός τιμολογίου είναι υποχρεωτικός.');
  if (!invoice.invoiceDate) errors.push('Ημερομηνία είναι υποχρεωτική.');
  if (!invoice.branchId || !BRANCHES[invoice.branchId]) errors.push('Άκυρο υποκατάστημα.');
  if (!invoice.customer?.name) errors.push('Επωνυμία πελάτη είναι υποχρεωτική.');
  if (!invoice.customer?.vat) errors.push('ΑΦΜ πελάτη είναι υποχρεωτικό.');
  if (!invoice.items?.length) errors.push('Πρέπει να υπάρχει τουλάχιστον μία γραμμή είδους/υπηρεσίας.');
  invoice.items.forEach((it, i) => {
    if (!it.description) errors.push(`Γραμμή ${i + 1}: Περιγραφή υποχρεωτική.`);
    if (!(it.qty > 0)) errors.push(`Γραμμή ${i + 1}: Ποσότητα > 0.`);
    if (!(it.price >= 0)) errors.push(`Γραμμή ${i + 1}: Τιμή >= 0.`);
    if (!branchCfg.revenueMapping.allowedVatRates.includes(Number(it.vatRate))) {
      errors.push(`Γραμμή ${i + 1}: Μη επιτρεπτός συντελεστής ΦΠΑ για ${branchCfg.label}.`);
    }
  });
  return errors;
}

function buildMyDataPayload(invoice, branchCfg, opts = {}) {
  const vatMap = branchCfg?.revenueMapping?.vatMap || { 13: 'VAT_13', 24: 'VAT_24', 0: 'VAT_0' };
  const e3Map = branchCfg?.revenueMapping?.e3 || { code: 'E3_GENERIC' };
  const header = {
    series: branchCfg.series,
    aa: invoice.invoiceNumber,
    issueDate: invoice.invoiceDate,
    docType: branchCfg.revenueMapping.documentType,
    issuer: branchCfg.issuer,
    counterparty: {
      name: invoice.customer.name,
      vat: invoice.customer.vat,
      email: invoice.customer.email || undefined,
      address: invoice.customer.address || undefined,
      city: invoice.customer.city || undefined,
    },
    paymentMethod: (invoice.paymentMethod || 'cash').toLowerCase(),
    paymentInfo: invoice.paymentInfo || undefined,
    currency: (invoice.currency || branchCfg.currency || 'EUR').toUpperCase(),
  };
  
  // Calculate totals FIRST with exact precision, then build lines
  let totalNetBeforeRound = 0;
  let totalVatBeforeRound = 0;
  
  const resolveIncomeClassification = (key, amount) => {
    const mapEntry = INCOME_CLASSIFICATION_MAP[key] || INCOME_CLASSIFICATION_MAP.E3_GENERIC;
    if (!mapEntry) return null;
    return {
      classificationType: mapEntry.classificationType,
      classificationCategory: mapEntry.classificationCategory,
      amount: round2(amount || 0),
    };
  };

  const baseLines = (invoice.items || []).map((it, idx) => {
    // Treat UI price as VAT-inclusive (gross)
    const qty = Number(it.qty || 0);
    const grossUnit = Number(it.price || 0);
    const rate = Number(it.vatRate || 0);
    const factor = 1 + (rate / 100);
    const lineGross = qty * grossUnit;
    const lineNet = factor > 0 ? lineGross / factor : lineGross;
    const vatAmt = lineGross - lineNet;
    const netRounded = round2(lineNet);
    const vatRounded = round2(vatAmt);
    
    // Accumulate WITHOUT rounding first
    totalNetBeforeRound += lineNet;
    totalVatBeforeRound += vatAmt;
    
    return {
      lineNumber: idx + 1,
      description: it.description,
      qty: qty,
      unitPrice: grossUnit,
      netAmount: netRounded,
      vatCategory: vatMap[it.vatRate] || `${it.vatRate}%`,
      vatAmount: vatRounded,
      revenueClassification: e3Map.code || branchCfg.revenueMapping.revenueCategory,
      incomeClassification: resolveIncomeClassification(e3Map.code, netRounded),
    };
  });
  const surcharge = Number(invoice.surcharge || 0);
  let lines = [...baseLines];
  
  // Use accumulated totals with proper final rounding
  let totals = { 
    net: round2(totalNetBeforeRound), 
    vat: round2(totalVatBeforeRound)
  };

  const mode = opts.surchargeMode || 'autoLine'; // 'autoLine' | 'separateInvoice' | 'surchargeOnly'
  if (mode === 'autoLine') {
    if (surcharge > 0) {
      const surchargeClassificationKey = (branchCfg?.revenueMapping?.e3Surcharge?.code) || (e3Map.surchargeCode) || 'E3_SURCHARGE';
      const surchargeRounded = round2(surcharge);
      lines.push({
        lineNumber: baseLines.length + 1,
        description: 'Τέλος Ανθεκτικότητας στην Κλιματική Κρίση (ΤΑΚΚ)',
        qty: 1,
        unitPrice: round2(surcharge),
        netAmount: surchargeRounded,
        vatCategory: vatMap[0] || 'VAT_0',
        vatAmount: 0,
        revenueClassification: (branchCfg?.revenueMapping?.e3Surcharge?.code) || (e3Map.surchargeCode) || 'E3_SURCHARGE',
        incomeClassification: resolveIncomeClassification(surchargeClassificationKey, surchargeRounded),
      });
    }
    totals = { net: totals.net + surcharge, vat: totals.vat };
  } else if (mode === 'separateInvoice') {
    // μην συμπεριλάβεις το surcharge εδώ
    totals = { net: totals.net, vat: totals.vat };
  } else if (mode === 'surchargeOnly') {
    // μόνο γραμμή surcharge
    lines = surcharge > 0 ? [{
      lineNumber: 1,
      description: 'Τέλος Ανθεκτικότητας στην Κλιματική Κρίση (ΤΑΚΚ)',
      qty: 1,
      unitPrice: round2(surcharge),
      netAmount: round2(surcharge),
      vatCategory: vatMap[0] || 'VAT_0',
      vatAmount: 0,
      revenueClassification: (branchCfg?.revenueMapping?.e3Surcharge?.code) || (e3Map.surchargeCode) || 'E3_SURCHARGE',
      incomeClassification: resolveIncomeClassification((branchCfg?.revenueMapping?.e3Surcharge?.code) || (e3Map.surchargeCode) || 'E3_SURCHARGE', round2(surcharge)),
    }] : [];
    totals = { net: round2(surcharge), vat: 0 };
  }

  const classificationAccumulator = new Map();
  lines.forEach((line) => {
    const cls = line.incomeClassification;
    if (!cls?.classificationCategory) return;
    const key = `${cls.classificationType || ''}::${cls.classificationCategory}`;
    const current = classificationAccumulator.get(key) || {
      classificationType: cls.classificationType,
      classificationCategory: cls.classificationCategory,
      amount: 0,
    };
    current.amount += Number(cls.amount || 0);
    classificationAccumulator.set(key, current);
  });

  const incomeClassifications = Array.from(classificationAccumulator.values()).map((entry) => ({
    classificationType: entry.classificationType,
    classificationCategory: entry.classificationCategory,
    amount: round2(entry.amount),
  }));

  return {
    header,
    lines,
    totals: {
      net: round2(totals.net),
      vat: round2(totals.vat),
      gross: round2(totals.net + totals.vat),
      withheld: 0,
      fees: 0,
      stampDuty: 0,
      otherTaxes: 0,
      deductions: 0,
      surcharge: round2(surcharge),
      incomeClassifications,
    },
    meta: {
      branchId: invoice.branchId,
      sandbox: true,
    },
  };
}

function calcTotals(items) {
  // Prices entered in UI are VAT-inclusive (gross)
  let net = 0;
  let vat = 0;
  for (const i of items) {
    const qty = Number(i.qty || 0);
    const grossUnit = Number(i.price || 0);
    const rate = Number(i.vatRate || 0);
    const factor = 1 + (rate / 100);
    const lineGross = qty * grossUnit;
    const lineNet = factor > 0 ? lineGross / factor : lineGross;
    const lineVat = lineGross - lineNet;
    net += lineNet;
    vat += lineVat;
  }
  return { net, vat };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// NOTE: mock submission removed for production readiness. All submissions go through configured backend.

function storageKeyCustomers(branchId){
  return `customers_${branchId}`;
}

function storageKeyHistory(){
  return 'invoices_history';
}

function storageKeyTrash(){
  return 'invoice_trash_bin';
}

function invoiceSequenceKey(branchId) {
  return `invoice_sequence_${branchId}`;
}

function parseInvoiceSequence(value) {
  const match = String(value ?? '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : null;
}

function computeHighestSequenceFromHistory(branchId, historyList) {
  return historyList.reduce((max, entry) => {
    if (entry.branchId !== branchId) return max;
    // Only count successfully submitted invoices (status: 'sent')
    // Fallback for old data without status field: assume 'sent' (backward compatibility)
    const entryStatus = entry.status || 'sent';
    if (entryStatus !== 'sent') return max;
    const seq = parseInvoiceSequence(entry.invoiceNumber);
    return seq !== null && seq > max ? seq : max;
  }, 0);
}

function syncInvoiceSequence(branchId, historyList) {
  const highest = computeHighestSequenceFromHistory(branchId, historyList);
  const stored = Number(localStorage.getItem(invoiceSequenceKey(branchId)) || 0);
  if (highest > stored) {
    localStorage.setItem(invoiceSequenceKey(branchId), String(highest));
  }
}

function generateNextInvoiceNumberValue(branchId, historyList) {
  const stored = Number(localStorage.getItem(invoiceSequenceKey(branchId)) || 0);
  const highest = computeHighestSequenceFromHistory(branchId, historyList);
  const next = Math.max(stored, highest) + 1;
  return next.toString().padStart(4, '0');
}

function commitInvoiceSequence(branchId, invoiceNumber) {
  const seq = parseInvoiceSequence(invoiceNumber);
  if (seq !== null) {
    localStorage.setItem(invoiceSequenceKey(branchId), String(seq));
  }
}

function InvoiceApp() {
  // Navigation state
  const [activeSection, setActiveSection] = useState('invoice');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('ui_sidebar_collapsed') === '1'; } catch { return false; }
  });

  useEffect(() => { try { localStorage.setItem('ui_sidebar_collapsed', sidebarCollapsed ? '1' : '0'); } catch {} }, [sidebarCollapsed]);
  
  // State management
  const [branch, setBranch] = useState('central');
  const branchCfg = useMemo(() => BRANCHES[branch], [branch]);
  const [customer, setCustomer] = useState({ name: '', vat: '', email: '', address: '', city: '' });
  // Initial branch is 'central' (Italian Corner) so prefill default description
  const [items, setItems] = useState([{ description: getDefaultDescriptionForBranch('central'), qty: 1, price: 0, vatRate: 13 }]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
  const [invoiceTime, setInvoiceTime] = useState(new Date().toTimeString().substring(0, 5));
  const [invoiceNumber, setInvoiceNumber] = useState('0001');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [surcharge, setSurcharge] = useState(0);
  const [separateSurcharge, setSeparateSurcharge] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [loadingState, setLoadingState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [failedQueue, setFailedQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aade_failed_queue') || '[]'); } catch { return []; }
  });
  const [customers, setCustomers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKeyCustomers('central')) || '[]'); } catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKeyHistory()) || '[]'); } catch { return []; }
  });
  const [trash, setTrash] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKeyTrash()) || '[]'); } catch { return []; }
  });
  const [dateFormat, setDateFormat] = useState(() => {
    try { return localStorage.getItem('app_date_format') || 'DD-MM-YYYY'; } catch { return 'DD-MM-YYYY'; }
  });
  const persistDateFormat = (fmt) => { setDateFormat(fmt); try { localStorage.setItem('app_date_format', fmt); } catch {} };
  // Backend is always enabled in production-ready app runs.
  // Keep this a simple boolean flag (no runtime toggle persisted anymore).
  const useBackend = true;
  
  // Helper: validate and correct backend URL
  const validateBackendUrl = (url) => {
    if (!url) return 'http://127.0.0.1:3000';
    // If user accidentally enters AADE URL, auto-correct to localhost
    if (url.includes('mydatapi.aade.gr') || url.includes('mydataapidev.aade.gr')) {
      console.warn('Invalid backend URL detected (AADE endpoint). Auto-correcting to localhost:3000');
      return 'http://127.0.0.1:3000';
    }
    // Clean up trailing slashes
    return url.replace(/\/$/, '');
  };
  
  const [backendBase, setBackendBase] = useState(() => {
    try { 
      const stored = localStorage.getItem('app_backend_base'); 
      if (stored !== null && stored !== '') return validateBackendUrl(stored);
    } catch {}
    // Default: assume backend is running locally on port 3000
    // This works for both localhost web and Electron desktop app
    return 'http://127.0.0.1:3000';
  });
  
  // Wrapper for setBackendBase that validates input
  const setBackendBaseValidated = (url) => {
    const validated = validateBackendUrl(url);
    setBackendBase(validated);
  };
  
  // Persist environment/backend base URL locally
  useEffect(() => { try { localStorage.setItem('app_backend_base', backendBase || ''); } catch {} }, [backendBase]);
  // AADE / Backend credentials and environment (stored locally on client machine)
  const [aadeEnv, setAadeEnv] = useState(() => {
    try {
      const stored = localStorage.getItem('aade_env');
      if (stored === 'sandbox') return 'preproduction';
      if (stored === 'production' || stored === 'preproduction') return stored;
      return stored || 'production';
    } catch {
      return 'production';
    }
  });
  const [aadeClientId, setAadeClientId] = useState(() => { try { return localStorage.getItem('aade_client_id') || 'mydata'; } catch { return 'mydata'; } });
  const [aadeClientSecret, setAadeClientSecret] = useState(() => { try { return localStorage.getItem('aade_client_secret') || 'mydata'; } catch { return 'mydata'; } });
  const [aadeApiKey, setAadeApiKey] = useState(() => { try { return localStorage.getItem('aade_api_key') || ''; } catch { return ''; } });
  const [aadeSubscriptionKey, setAadeSubscriptionKey] = useState(() => { try { return localStorage.getItem('aade_subscription_key') || ''; } catch { return ''; } });
  const [aadeTaxisnetUsername, setAadeTaxisnetUsername] = useState(() => { try { return localStorage.getItem('aade_taxisnet_username') || ''; } catch { return ''; } });
  const [aadeTaxisnetPassword, setAadeTaxisnetPassword] = useState(() => { try { return localStorage.getItem('aade_taxisnet_password') || ''; } catch { return ''; } });
  const [aadeBearerToken, setAadeBearerToken] = useState(() => { try { return localStorage.getItem('aade_bearer_token') || ''; } catch { return ''; } });
  const [aadeBearerTokenExpiry, setAadeBearerTokenExpiry] = useState(() => { try { return parseInt(localStorage.getItem('aade_bearer_token_expiry')) || 0; } catch { return 0; } });
  const [aadeCertPath, setAadeCertPath] = useState(() => { try { return localStorage.getItem('aade_cert_path') || ''; } catch { return ''; } });
  const [aadeCertPassword, setAadeCertPassword] = useState(() => { try { return localStorage.getItem('aade_cert_password') || ''; } catch { return ''; } });
  const [gsisUsername, setGsisUsername] = useState(() => { try { return localStorage.getItem('gsis_username') || ''; } catch { return ''; } });
  const [gsisPassword, setGsisPassword] = useState(() => { try { return localStorage.getItem('gsis_password') || ''; } catch { return ''; } });
  const [connectionStatus, setConnectionStatus] = useState({ state: 'idle', message: 'Δεν έχει εκτελεστεί έλεγχος σύνδεσης.' });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  // Update window object with GSIS credentials whenever they change
  useEffect(() => {
    try {
      if (gsisUsername) window.gsisUsername = gsisUsername;
      if (gsisPassword) window.gsisPassword = gsisPassword;
    } catch (e) {
      console.log('GSIS credentials set to window object.');
    }
  }, [gsisUsername, gsisPassword]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const timezoneLabel = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Athens';
    } catch {
      return 'Europe/Athens';
    }
  }, []);

  // OAuth Bearer Token Request (cached with expiry) — via local backend proxy
  // AADE uses direct header authentication - no token exchange needed
  // Just pass aade-user-id and ocp-apim-subscription-key headers with each request

  const handleConnectionTest = async () => {
    if (!backendBase) {
      setConnectionStatus({ state: 'error', message: 'Ορίστε τη διεύθυνση του backend πριν τον έλεγχο.' });
      return;
    }

    const normalizedBase = backendBase.replace(/\/$/, '');
    const endpoint = `${normalizedBase}/api/aade/validate`;
    setIsTestingConnection(true);
    setConnectionStatus({ state: 'pending', message: 'Εκτελείται δοκιμαστική κλήση προς myDATA…' });

    const invoicePayload = {
      header: {
        aa: 'HEALTH-CHECK',
        issueDate: new Date().toISOString().slice(0, 10),
        counterparty: { name: 'Health Check', vat: '000000000' },
      },
      lines: [{ lineNumber: 1, description: 'Ping', qty: 1, unitPrice: 1, vatCategory: 'VAT_24', vatAmount: 0 }],
      meta: { env: aadeEnv },
    };

    try {
      // Send credentials in request body (same format as serverValidate)
      const body = {
        aadeUserId: aadeTaxisnetUsername,
        subscriptionKey: aadeSubscriptionKey,
        invoicePayload,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.ok) {
        setConnectionStatus({ state: 'success', message: 'Η σύνδεση επιβεβαιώθηκε. Το backend έφτασε στο myDATA.' });
      } else {
        setConnectionStatus({ state: 'error', message: data?.error || 'Αποτυχία επικύρωσης από το backend.' });
      }
    } catch (error) {
      setConnectionStatus({ state: 'error', message: error?.message || 'Αποτυχία επικοινωνίας με το backend.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRefresh = async () => {
    // Call the connection test to update status
    if (!backendBase) {
      console.warn('Backend not configured, skipping health check');
      setTimeout(() => window.location.reload(), 300);
      return;
    }

    const normalizedBase = backendBase.replace(/\/$/, '');
    const endpoint = `${normalizedBase}/api/nodes`;

    try {
      const response = await fetch(endpoint, { method: 'GET' });
      if (response.ok) {
        console.log('✅ Backend health check passed');
        setConnectionStatus({ state: 'success', message: 'Σύνδεση backend εναργή.' });
      } else {
        console.warn('⚠️ Backend returned non-ok status');
        setConnectionStatus({ state: 'error', message: 'Το backend δεν ανταποκρίνεται σωστά.' });
      }
    } catch (err) {
      console.warn('⚠️ Backend not reachable:', err);
      setConnectionStatus({ state: 'error', message: 'Το backend δεν είναι διαθέσιμο.' });
    } finally {
      // Always reload after 500ms to let UI update
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      // Check if we're in Electron environment with auto-updater
      if (window.electron?.checkForUpdates) {
        // Electron app with auto-updater
        window.electron.checkForUpdates();
        return;
      }

      // Check if we're in web app
      if (!window.__TAURI__ && !window.electron) {
        // Web app - check backend for update availability
        if (!backendBase) {
          window.alert('⚠️ Δεν υπάρχει σύνδεση με backend');
          return;
        }

        const normalizedBase = backendBase.replace(/\/$/, '');
        const response = await fetch(`${normalizedBase}/api/update/check`, { method: 'GET' });
        const result = await response.json();

        if (result.data?.available) {
          window.alert(`✅ Νέα έκδοση διαθέσιμη: v${result.data.version}\n\nΑναβαθμίστε τη σελίδα για να λάβετε την ενημέρωση`);
        } else {
          window.alert('✅ Χρησιμοποιείτε την τελευταία έκδοση');
        }
        return;
      }

      // Fallback for older Electron without auto-updater
      window.alert('✅ Χρησιμοποιείτε την τελευταία έκδοση');
    } catch (err) {
      console.error('Update check failed:', err);
      window.alert(`⚠️ Έλεγχος ενημερώσεων δεν διαθέσιμος: ${err.message}`);
    }
  };

  const handleCancelInvoice = async (entry) => {
    // Show confirmation dialog with reason selection
    const reasonOptions = [
      { code: '1', label: 'Δεν είναι χρήσιμο πλέον' },
      { code: '2', label: 'Διπλότυπο' },
      { code: '3', label: 'Σφάλμα δεδομένων' },
      { code: '4', label: 'Λάθος πελάτης' },
    ];

    let selectedReason = null;
    const reasonPrompt = reasonOptions.map(r => `${r.code}. ${r.label}`).join('\n');
    const userInput = window.prompt(
      `⚠️ ΠΡΟΣΟΧΗ: Θα ακυρώσετε το παραστατικό ${entry.invoiceNumber}\n\nΕπιλέξτε λόγο ακύρωσης:\n\n${reasonPrompt}\n\nΕισάγετε αριθμό (1-4):`,
      ''
    );

    if (!userInput) return; // Cancelled
    
    selectedReason = reasonOptions.find(r => r.code === userInput);
    if (!selectedReason) {
      window.alert('❌ Μη έγκυρη επιλογή. Ακύρωση λειτουργίας.');
      return;
    }

    // Proceed with cancellation
    if (!window.confirm(`Είστε σίγουροι ότι θέλετε να ακυρώσετε;\n\nΛόγος: ${selectedReason.label}`)) {
      return;
    }

    setStatus({ type: 'loading', msg: '⏳ Ακύρωση παραστατικού...' });
    try {
      if (!backendBase) {
        throw new Error('Backend δεν έχει ρυθμιστεί');
      }

      const normalizedBase = backendBase.replace(/\/$/, '');
      const cancelUrl = `${normalizedBase}/api/aade/cancel-invoice`;

      const cancelPayload = {
        aadeUserId: aadeTaxisnetUsername || '',
        subscriptionKey: aadeSubscriptionKey || '',
        invoiceNumber: entry.invoiceNumber || '',
        branchId: entry.branchId || branch,
        cancelReasonCode: selectedReason.code,
        useTestingEndpoint: aadeEnv === 'preproduction',
      };

      console.log('📤 Sending cancel request:', { ...cancelPayload, subscriptionKey: '[REDACTED]' });

      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelPayload),
      });

      const result = await response.json();

      if (response.ok && result.cancelMark) {
        console.log('✅ Invoice cancelled successfully:', result.cancelMark);
        
        // Update history entry status to 'CANCELLED'
        setHistory(prevHistory =>
          prevHistory.map(h =>
            h.invoiceNumber === entry.invoiceNumber
              ? { ...h, status: 'CANCELLED', cancelMark: result.cancelMark }
              : h
          )
        );

        setStatus({ type: 'success', msg: `✅ Το παραστατικό ακυρώθηκε με επιτυχία! (Αριθμός: ${result.cancelMark})` });
        window.alert(`✅ Το παραστατικό ακυρώθηκε με επιτυχία!\n\nΑριθμός ακύρωσης: ${result.cancelMark}`);
      } else {
        const errorMsg = result.error || 'Άγνωστο σφάλμα';
        console.error('❌ Cancel failed:', errorMsg);
        setStatus({ type: 'error', msg: `❌ Αποτυχία ακύρωσης: ${errorMsg}` });
        window.alert(`❌ Αποτυχία ακύρωσης: ${errorMsg}`);
      }
    } catch (err) {
      console.error('❌ Error calling cancel endpoint:', err);
      setStatus({ type: 'error', msg: `❌ Σφάλμα: ${err.message}` });
      window.alert(`❌ Σφάλμα: ${err.message}`);
    }
  };

  const handleCustomerLookup = async (vatId) => {
    if (!vatId || !vatId.trim()) {
      window.alert('⚠️ Εισάγετε ΑΦΜ για αναζήτηση');
      return null;
    }

    try {
      if (!backendBase) {
        throw new Error('Backend δεν έχει ρυθμιστεί');
      }

      const normalizedBase = backendBase.replace(/\/$/, '');
      
      // Build URL with GSIS credentials if available
      let lookupUrl = `${normalizedBase}/api/gsis/lookup-customer?vat=${encodeURIComponent(vatId)}`;
      
      // Add credentials if they exist in BackendControls settings
      // These can be configured in the app settings
      if (typeof window.gsisUsername !== 'undefined' && window.gsisUsername) {
        lookupUrl += `&username=${encodeURIComponent(window.gsisUsername)}`;
      }
      if (typeof window.gsisPassword !== 'undefined' && window.gsisPassword) {
        lookupUrl += `&password=${encodeURIComponent(window.gsisPassword)}`;
      }

      console.log(`📤 Lookup customer for VAT: ${vatId}`);

      const response = await fetch(lookupUrl, { method: 'GET' });
      const result = await response.json();

      console.log('📦 Response:', result, 'Status:', response.status);

      if (response.ok && result.ok) {
        // Backend returns { ok: true, vat, name, city, postalCode, address, ... }
        const customerData = {
          name: result.name || '',
          vat: result.vat || vatId,
          city: result.city || '',
          postalCode: result.postalCode || '',
          address: result.address || ''
        };
        console.log('✅ Customer found:', customerData);
        return customerData;
      } else {
        const errorMsg = result.error || 'Δεν βρέθηκε πελάτης';
        console.warn('❌ Lookup failed:', errorMsg);
        window.alert(`⚠️ ${errorMsg}`);
        return null;
      }
    } catch (err) {
      console.error('❌ Error calling lookup endpoint:', err);
      window.alert(`❌ Σφάλμα αναζήτησης: ${err.message}`);
      return null;
    }
  };

  const [pdfPreviewState, setPdfPreviewState] = useState({ open: false, url: null, blob: null, fileName: '' });
  const totals = useMemo(() => calcTotals(items), [items]);
  const isVilla = VILLA_BRANCH_IDS.includes(branch);
  useEffect(() => { if (!isVilla) setSurcharge(0); }, [branch, isVilla]);
  // Auto-calc surcharge for villas based on simple per-branch rule
  useEffect(() => {
    if (!isVilla) return;
    const rule = branchCfg?.revenueMapping?.surchargeRule || null;
    if (!rule) return;
    let value = 0;
    // If rule has an effective date range, check invoiceDate falls within it
    try {
      if (rule.effectiveFrom || rule.effectiveTo) {
        const d = new Date(invoiceDate);
        const from = rule.effectiveFrom ? new Date(rule.effectiveFrom) : null;
        const to = rule.effectiveTo ? new Date(rule.effectiveTo) : null;
        if ((from && d < from) || (to && d > to)) {
          // Outside effective range -> no surcharge from this rule
          setSurcharge(0);
          return;
        }
      }
    } catch (err) {
      // ignore parse errors and continue
    }
    if (rule.mode === 'perNight') {
      const nights = items.reduce((s, it) => s + Number(it.qty || 0), 0);
      value = Number(rule.rate || 0) * nights;
    } else if (rule.mode === 'seasonalPerNight') {
      const nights = items.reduce((s, it) => s + Number(it.qty || 0), 0);
      const d = new Date(invoiceDate);
      const m = isNaN(d.getTime()) ? (new Date()).getMonth() + 1 : d.getMonth() + 1; // 1..12
      const isSummer = m >= 4 && m <= 10; // Απρίλιος-Οκτώβριος
      const rate = isSummer ? Number(rule.summerRate || 0) : Number(rule.winterRate || 0);
      value = rate * nights;
    } else if (rule.mode === 'percentNet') {
      const net = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0);
      value = net * Number(rule.percent || 0);
    } else if (rule.mode === 'flatPerInvoice') {
      value = Number(rule.amount || 0);
    }
    // snap to 2 decimals
    value = Math.round((value + Number.EPSILON) * 100) / 100;
    setSurcharge(value);
  }, [isVilla, branchCfg, items, invoiceDate]);
  useEffect(() => { try { const data = JSON.parse(localStorage.getItem(storageKeyCustomers(branch)) || '[]'); setCustomers(Array.isArray(data)?data:[]); } catch { setCustomers([]); } }, [branch]);
  // Sync internal invoice sequence counter with history when branch or history changes
  useEffect(() => { try { syncInvoiceSequence(branch, history); } catch {} }, [branch, history]);
  // Always compute and set the next invoice number automatically based on branch and history
  useEffect(() => {
    try {
      const nextVal = generateNextInvoiceNumberValue(branch, history);
      setInvoiceNumber(nextVal);
    } catch {}
  }, [branch, history]);
  // When switching to a restaurant branch, if all item descriptions are empty, set first to default
  useEffect(() => {
    if (!RESTAURANT_BRANCH_IDS.includes(branch)) return;
    if (!items || !items.length) return;
    const allEmpty = items.every(it => !String(it.description || '').trim());
    if (allEmpty) {
      const clone = [...items];
      clone[0] = { ...clone[0], description: DEFAULT_RESTAURANT_DESC };
      setItems(clone);
    }
  }, [branch]);

  // When switching to a villa branch, set villa default if empty and replace Italian default if present
  useEffect(() => {
    if (!isVilla) return;
    if (!items || !items.length) return;
    const allEmpty = items.every(it => !String(it.description || '').trim());
    if (allEmpty) {
      const clone = [...items];
      clone[0] = { ...clone[0], description: DEFAULT_VILLA_DESC };
      setItems(clone);
      return;
    }
    const needReplace = items.some(it => String(it.description || '').trim() === DEFAULT_RESTAURANT_DESC);
    if (needReplace) {
      const replaced = items.map((it, idx) => (String(it.description || '').trim() === DEFAULT_RESTAURANT_DESC ? { ...it, description: idx === 0 ? DEFAULT_VILLA_DESC : '' } : it));
      setItems(replaced);
    }
  }, [branch]);
  const persistFailedQueue = (q) => { setFailedQueue(q); localStorage.setItem('aade_failed_queue', JSON.stringify(q)); };
  const persistCustomers = (list) => { setCustomers(list); localStorage.setItem(storageKeyCustomers(branch), JSON.stringify(list)); };
  const persistHistory = (list) => { setHistory(list); localStorage.setItem(storageKeyHistory(), JSON.stringify(list)); };
  const persistTrash = (list) => { setTrash(list); localStorage.setItem(storageKeyTrash(), JSON.stringify(list)); };
  const openConfirm = (config) => setConfirmState(config);
  const closeConfirm = () => setConfirmState(null);
  const handleDialogConfirm = async () => {
    try {
      if (confirmState?.onConfirm) {
        await Promise.resolve(confirmState.onConfirm());
      }
    } finally {
      closeConfirm();
    }
  };
  const handleDialogCancel = () => closeConfirm();
  const saveDraft = () => {
    const draft = {
      branchId: branchCfg.id,
      invoiceDate,
      invoiceTime,
      invoiceNumber,
      customer,
      items,
      surcharge,
      paymentMethod,
      separateSurcharge,
    };
    localStorage.setItem('invoice_draft', JSON.stringify(draft));
    setStatus({ type: 'info', msg: 'Αποθηκεύτηκε πρόχειρο.' });
  };
  const loadDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem('invoice_draft') || 'null');
      if (!d) {
        setStatus({ type: 'error', msg: 'Δεν βρέθηκε πρόχειρο.' });
        return;
      }
      setBranch(d.branchId in BRANCHES ? d.branchId : 'central');
      setCustomer(d.customer || { name: '', vat: '', email: '', address: '', city: '' });
      const draftItems = d.items && Array.isArray(d.items) ? d.items : null;
      if (draftItems) {
        setItems(draftItems);
      } else {
        const b = d.branchId || 'central';
        const initDesc = getDefaultDescriptionForBranch(b);
        setItems([{ description: initDesc, qty: 1, price: 0, vatRate: branchCfg.revenueMapping.defaultVat }]);
      }
      setInvoiceDate(d.invoiceDate || new Date().toISOString().substring(0, 10));
      setInvoiceTime(d.invoiceTime || new Date().toTimeString().substring(0, 5));
      /* invoiceNumber auto-set by effect */
      setSurcharge(d.surcharge || 0);
      setPaymentMethod(d.paymentMethod || 'cash');
      setSeparateSurcharge(Boolean(d.separateSurcharge));
      setStatus({ type: 'success', msg: 'Φορτώθηκε πρόχειρο.' });
    } catch {
      setStatus({ type: 'error', msg: 'Σφάλμα ανάγνωσης προχείρου.' });
    }
  };
  const addItem = () => setItems((prev) => [...prev, { description: getDefaultDescriptionForBranch(branch), qty: 1, price: 0, vatRate: branchCfg.revenueMapping.defaultVat }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addCustomer = () => { if (!customer.name || !customer.vat) { setStatus({ type: 'error', msg: 'Συμπλήρωσε Επωνυμία και ΑΦΜ για αποθήκευση πελάτη.' }); return; } const exists = customers.some(c => c.vat === customer.vat); const list = exists ? customers.map(c => c.vat === customer.vat ? { ...customer } : c) : [{ ...customer }, ...customers]; persistCustomers(list); setStatus({ type: 'success', msg: exists ? 'Ενημερώθηκε ο πελάτης.' : 'Προστέθηκε νέος πελάτης.' }); };
  const deleteCustomer = (vat, name) => {
    const list = customers.filter(c => c.vat !== vat);
    persistCustomers(list);
    if (customer.vat === vat) setCustomer({ name: '', vat: '', email: '', address: '', city: '' });
    setStatus({ type: 'success', msg: `Διαγράφηκε ο πελάτης ${name || vat}.` });
  };
  const requestCustomerDeletion = (customerToRemove) => {
    if (!customerToRemove) return;
    const label = customerToRemove.name || customerToRemove.vat;
    openConfirm({
      title: 'Διαγραφή πελάτη',
      message: `Η επαφή «${label}» θα διαγραφεί από το πελατολόγιο. Θέλετε να συνεχίσετε;`,
      confirmLabel: 'Διαγραφή',
      cancelLabel: 'Άκυρο',
      intent: 'danger',
      onConfirm: () => deleteCustomer(customerToRemove.vat, label),
    });
  };
  const pickCustomer = (vat) => { const c = customers.find(x => x.vat === vat); if (c) setCustomer({ ...c }); };
  const addHistoryEntry = (entry) => { const list = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...entry }, ...history]; persistHistory(list); };
  const updateHistoryEntryByInvoice = (invoiceNumber, patch) => { const list = history.map(h => h.invoiceNumber === invoiceNumber ? { ...h, ...patch } : h); persistHistory(list); };
  const moveHistoryEntryToTrash = (entry) => {
    if (!entry) return;
    const current = history.find((h) => h.id === entry.id) || entry;
    const descriptor = current.invoiceNumber ? `#${current.invoiceNumber}` : (current.id || 'εγγραφή');
    const entryWithMeta = { ...current, deletedAt: new Date().toISOString() };
    const updatedHistory = history.filter((h) => h.id !== current.id);
    const nextTrash = [entryWithMeta, ...trash.filter((t) => t.id !== current.id)];
    persistHistory(updatedHistory);
    persistTrash(nextTrash);
    setStatus({ type: 'info', msg: `Το τιμολόγιο ${descriptor} μετακινήθηκε στον κάδο.` });
  };
  const requestDeleteHistory = (entry) => {
    if (!entry) return;
    const descriptor = entry.invoiceNumber ? `#${entry.invoiceNumber}` : (entry.id || 'εγγραφή');
    openConfirm({
      title: 'Μεταφορά στον κάδο',
      message: `Το τιμολόγιο ${descriptor} θα μεταφερθεί στον κάδο ανακύκλωσης. Μπορείς να το επαναφέρεις αργότερα από εκεί.`,
      confirmLabel: 'Μεταφορά',
      cancelLabel: 'Άκυρο',
      intent: 'danger',
      onConfirm: () => moveHistoryEntryToTrash(entry),
    });
  };
  const restoreHistoryEntry = (entryId) => {
    const entry = trash.find((t) => t.id === entryId);
    if (!entry) return;
    const { deletedAt, ...rest } = entry;
    const descriptor = rest.invoiceNumber ? `#${rest.invoiceNumber}` : (rest.id || 'εγγραφή');
    const nextHistory = [{ ...rest }, ...history.filter((h) => h.id !== rest.id)];
    const nextTrash = trash.filter((t) => t.id !== entryId);
    persistHistory(nextHistory);
    persistTrash(nextTrash);
    setStatus({ type: 'success', msg: `Το τιμολόγιο ${descriptor} επαναφέρθηκε από τον κάδο.` });
  };
  const requestRestoreFromTrash = (entry) => {
    if (!entry) return;
    const descriptor = entry.invoiceNumber ? `#${entry.invoiceNumber}` : (entry.id || 'εγγραφή');
    openConfirm({
      title: 'Επαναφορά τιμολογίου',
      message: `Το τιμολόγιο ${descriptor} θα επιστρέψει στο ιστορικό υποβολών.`,
      confirmLabel: 'Επαναφορά',
      cancelLabel: 'Άκυρο',
      intent: 'default',
      onConfirm: () => restoreHistoryEntry(entry.id),
    });
  };
  const deleteTrashEntry = (entryId) => {
    const nextTrash = trash.filter((t) => t.id !== entryId);
    persistTrash(nextTrash);
    setStatus({ type: 'info', msg: 'Το στοιχείο διαγράφηκε οριστικά από τον κάδο.' });
  };
  const requestDeleteTrashEntry = (entry) => {
    if (!entry) return;
    const descriptor = entry.invoiceNumber ? `#${entry.invoiceNumber}` : (entry.id || 'εγγραφή');
    openConfirm({
      title: 'Μόνιμη διαγραφή',
      message: `Το τιμολόγιο ${descriptor} θα αφαιρεθεί οριστικά από τον κάδο. Η ενέργεια δεν μπορεί να αναιρεθεί.`,
      confirmLabel: 'Διαγραφή',
      cancelLabel: 'Άκυρο',
      intent: 'danger',
      onConfirm: () => deleteTrashEntry(entry.id),
    });
  };
  const emptyTrash = () => {
    persistTrash([]);
    setStatus({ type: 'success', msg: 'Ο κάδος άδειασε επιτυχώς.' });
  };
  const requestEmptyTrash = () => {
    if (!trash.length) return;
    openConfirm({
      title: 'Άδειασμα κάδου',
      message: 'Όλα τα τιμολόγια στον κάδο θα διαγραφούν οριστικά. Θέλεις να συνεχίσεις;',
      confirmLabel: 'Άδειασμα',
      cancelLabel: 'Άκυρο',
      intent: 'danger',
      onConfirm: () => emptyTrash(),
    });
  };
  const serverValidate = async (payload) => {
    let base = backendBase.replace(/\/$/,'');
    if (base.includes('mydatapi') || base.includes('SendInvoices')) {
      base = 'http://127.0.0.1:3000';
      setBackendBase(base);
      throw new Error('Backend URL was invalid. Reset to default localhost:3000');
    }
    
    const url = `${base}/api/aade/validate`;
    const headers = { 'Content-Type': 'application/json' };
    
    // Backend expects credentials in the body
    const body = {
      aadeUserId: aadeTaxisnetUsername,
      subscriptionKey: aadeSubscriptionKey,
      invoicePayload: payload,
    };
    
    console.log('serverValidate: Sending', {
      aadeUserId: aadeTaxisnetUsername,
      subscriptionKey: aadeSubscriptionKey ? aadeSubscriptionKey.substring(0, 8) + '...' : 'N/A',
      payloadKeys: Object.keys(payload || {}),
      header_aa: payload?.header?.aa,
      header_issueDate: payload?.header?.issueDate,
      linesCount: payload?.lines?.length || 0,
      totals: payload?.totals,
    });
    
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Validate failed');
    return res.json();
  };

  const serverSubmit = async (payload) => {
    let base = backendBase.replace(/\/$/,'');
    if (base.includes('mydatapi') || base.includes('SendInvoices')) {
      base = 'http://127.0.0.1:3000';
      setBackendBase(base);
      throw new Error('Backend URL was invalid. Reset to default localhost:3000');
    }
    
    const url = `${base}/api/aade/submit`;
    const headers = { 'Content-Type': 'application/json' };
    
    // Backend expects credentials in the body, not headers
    const body = {
      aadeUserId: aadeTaxisnetUsername,
      subscriptionKey: aadeSubscriptionKey,
      invoicePayload: payload,
      useTestingEndpoint: aadeEnv === 'preproduction',
    };
    
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return res.json();
  };

  const serverRetry = async (payload) => {
    let base = backendBase.replace(/\/$/,'');
    if (base.includes('mydatapi') || base.includes('SendInvoices')) {
      base = 'http://127.0.0.1:3000';
      setBackendBase(base);
      throw new Error('Backend URL was invalid. Reset to default localhost:3000');
    }
    
    const url = `${base}/api/aade/retry`;
    const headers = { 'Content-Type': 'application/json' };
    
    // Backend expects credentials in the body
    const body = {
      aadeUserId: aadeTaxisnetUsername,
      subscriptionKey: aadeSubscriptionKey,
      invoicePayload: payload,
      useTestingEndpoint: aadeEnv === 'preproduction',
    };
    
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return res.json();
  };
  const removeFailedEntry = (index) => {
    const q = failedQueue.filter((_, idx) => idx !== index);
    persistFailedQueue(q);
    setStatus({ type: 'info', msg: 'Η αποτυχημένη υποβολή αφαιρέθηκε.' });
  };
  const handleSubmit = async () => {
    setStatus({ type: 'info', msg: 'Υποβολή σε AADE…' });
    
    // Check credentials first
    if (!aadeTaxisnetUsername || !aadeSubscriptionKey) {
      setStatus({ type: 'error', msg: 'Λείπουν τα credentials ΑΑΔΕ (AADE User ID ή Subscription Key). Συμπληρώστε τα στις Ρυθμίσεις.' });
      return;
    }
    
    if (!backendBase) {
      setStatus({ type: 'error', msg: 'Λείπει το Backend URL. Ορίστε το στις Ρυθμίσεις (default: http://127.0.0.1:3000).' });
      return;
    }
    
    const invoice = {
      branchId: branchCfg.id,
      invoiceDate,
      invoiceNumber,
      customer,
      items,
      surcharge,
      issueTime: invoiceTime,
      invoiceTime,
    };
    
    // Validate required fields before building payload
    if (!invoiceDate) {
      setStatus({ type: 'error', msg: 'Λείπει η ημερομηνία του τιμολογίου.' });
      return;
    }
    if (!invoiceNumber) {
      setStatus({ type: 'error', msg: 'Λείπει ο αριθμός του τιμολογίου.' });
      return;
    }
    if (!items || items.length === 0) {
      setStatus({ type: 'error', msg: 'Δεν υπάρχουν γραμμές στο τιμολόγιο.' });
      return;
    }
    
    const errors = validateInvoiceForAADE(invoice, branchCfg);
    if (errors.length) { setStatus({ type: 'error', msg: errors.join('\n') }); return; }
  const payload = buildMyDataPayload(invoice, branchCfg, { surchargeMode: (isVilla && separateSurcharge) ? 'separateInvoice' : 'autoLine' });
    setLoadingState({ type: 'submit', message: 'Υποβολή τιμολογίου στο myDATA…' });
    
    try {
      let result;
      // Always attempt real backend validate + submit
      try {
        const validateResult = await serverValidate(payload);
        if (!validateResult.ok) throw new Error(validateResult.error || 'Validate failed');
        const submitResult = await serverSubmit(payload);
        if (!submitResult.ok) throw new Error(submitResult.error || `Submit failed`);
        result = submitResult;
      } catch (err) {
        // Treat as failed submission to be retried later
        console.error('Backend submission failed:', err?.message || err);
        result = { ok: false, error: err?.message || String(err) };
      }
      
      if (result.ok) {
        const historyEntry = {
          ...invoice,
          totals: payload.totals,
          status: 'sent',
          mark: result.mark,
          timestamp: Date.now(),
          issueDate: invoiceDate,
          issueTime: invoiceTime,
        };
        addHistoryEntry(historyEntry);
        // Commit used invoice number and pre-fill next suggested number
        try {
          commitInvoiceSequence(branchCfg.id, invoiceNumber);
          const nextVal = generateNextInvoiceNumberValue(branchCfg.id, [historyEntry, ...history]);
          setInvoiceNumber(nextVal);
        } catch {}
        setStatus({ type: 'success', msg: `🎉 ΕΠΙΤΥΧΗΣ ΚΑΤΑΧΩΡΗΣΗ! 🎉\n\nΤο τιμολόγιο ${invoiceNumber} καταχωρήθηκε επιτυχώς στο myDATA.\nΚωδικός AADE: ${result.mark}` });
        // Note: automatic TAAK issuance disabled to restore previous behavior
        
        // Don't clear form automatically - let user decide
      } else {
        const failedEntry = {
          ts: Date.now(),
          payload,
          error: result.error || 'Άγνωστο σφάλμα'
        };
        const newQueue = [...failedQueue, failedEntry];
        persistFailedQueue(newQueue);
        
        const historyEntry = {
          ...invoice,
          totals: payload.totals,
          status: 'failed',
          error: result.error,
          timestamp: Date.now(),
          issueDate: invoiceDate,
          issueTime: invoiceTime,
        };
        addHistoryEntry(historyEntry);
        setStatus({ type: 'error', msg: `Αποτυχία υποβολής: ${result.error}` });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus({ type: 'error', msg: `Σφάλμα δικτύου: ${error.message}` });
    } finally {
      setLoadingState(null);
    }
  };

  const resetForm = () => {
    setBranch('central');
  setCustomer({ name: '', vat: '', email: '', address: '', city: '' });
  setItems([{ description: DEFAULT_RESTAURANT_DESC, qty: 1, price: 0, vatRate: 13 }]);
  setInvoiceDate(new Date().toISOString().substring(0, 10));
  setInvoiceTime(new Date().toTimeString().substring(0, 5));
  // invoiceNumber will be auto-set by the effect using branch/history
  setSurcharge(0);
  setSeparateSurcharge(false);
  setStatus({ type: 'info', msg: 'Καθαρίστηκαν όλα τα πεδία.' });
  };
  const requestFormReset = () => {
    openConfirm({
      title: 'Καθαρισμός φόρμας',
      message: 'Θα διαγραφούν τα δεδομένα του τρέχοντος τιμολογίου. Θέλετε να συνεχίσετε;',
      confirmLabel: 'Καθαρισμός',
      cancelLabel: 'Άκυρο',
      intent: 'danger',
      onConfirm: resetForm,
    });
  };

  const retryAll = async () => {
    if (!failedQueue.length) return;
    setStatus({ type: 'info', msg: 'Επανάληψη όλων των αποτυχημένων υποβολών...' });
    setLoadingState({ type: 'retryAll', message: 'Επανάληψη όλων των αποτυχημένων υποβολών…' });
    try {
      for (let i = 0; i < failedQueue.length; i++) {
        await retryOne(i, { showLoader: false });
      }
    } finally {
      setLoadingState(null);
    }
  };

  const retryOne = async (index, { showLoader = true } = {}) => {
    const entry = failedQueue[index];
    if (!entry) return;
    if (showLoader) setLoadingState({ type: 'retryOne', message: `Επανάληψη υποβολής #${index + 1}…` });
    
    try {
      const result = await serverRetry(entry.payload);
      if (result.ok) {
        removeFailedEntry(index);
        setStatus({ type: 'success', msg: `Επιτυχής επανάληψη υποβολής #${index + 1}` });
      } else {
        setStatus({ type: 'error', msg: `Αποτυχία επανάληψης: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: `Σφάλμα επανάληψης: ${err.message}` });
    } finally {
      if (showLoader) setLoadingState(null);
    }
  };

  const branchIssuer = branchCfg.issuer;
  const lastSuccessfulInvoice = useMemo(() => {
    let latestEntry = null;
    let latestTimestamp = -Infinity;
    for (const entry of history) {
      if (entry?.status !== 'sent') continue;
      const ts = entry.timestamp ?? new Date(entry.issueDate || entry.invoiceDate || 0).getTime();
      if (!Number.isFinite(ts)) continue;
      if (ts > latestTimestamp) {
        latestTimestamp = ts;
        latestEntry = entry;
      }
    }
    return latestEntry;
  }, [history]);

  const todaysBranchTotals = useMemo(() => {
    const accumulator = { net: 0, vat: 0, gross: 0 };
    const nowClone = new Date(currentTime);
    if (Number.isNaN(nowClone.getTime())) return accumulator;
    const todayISO = nowClone.toISOString().slice(0, 10);
    for (const entry of history) {
      if (entry.branchId !== branch) continue;
      const issueValue = entry.issueDate || entry.invoiceDate;
      if (!issueValue) continue;
      const dateObj = new Date(issueValue);
      if (Number.isNaN(dateObj.getTime())) continue;
      if (dateObj.toISOString().slice(0, 10) !== todayISO) continue;
      const t = entry.totals || {};
      const net = Number(t.net || 0);
      const vat = Number(t.vat || 0);
      const gross = t.gross != null ? Number(t.gross) : net + vat;
      accumulator.net += net;
      accumulator.vat += vat;
      accumulator.gross += gross;
    }
    return {
      net: round2(accumulator.net),
      vat: round2(accumulator.vat),
      gross: round2(accumulator.gross),
    };
  }, [history, branch, currentTime]);
  const buildCurrentInvoice = () => ({
    branchId: branchCfg.id,
    invoiceDate,
    issueDate: invoiceDate,
    issueTime: invoiceTime,
    invoiceNumber,
    customer: { ...customer },
    items: items.map((item) => ({ ...item })),
    paymentMethod,
    surcharge,
    dateFormat,
  });

  const prepareInvoiceForPreview = (invoiceData) => normalizeInvoiceForPdf(invoiceData);

  const openPreviewForInvoice = async (invoiceData) => {
    if (!window.PDFGenerator?.generateInvoicePDFBlob) {
      setStatus({ type: 'error', msg: 'Το PDF module δεν είναι διαθέσιμο. Παρακαλώ ανανεώστε τη σελίδα.' });
      return;
    }

    setLoadingState({ type: 'pdf-preview', message: 'Δημιουργία προεπισκόπησης PDF…' });
    try {
      const preparedInvoice = prepareInvoiceForPreview(invoiceData);
      const blob = await window.PDFGenerator.generateInvoicePDFBlob(preparedInvoice, BRANCHES);
      const fileName = `invoice_${preparedInvoice.invoiceNumber || 'preview'}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      setPdfPreviewState((prev) => {
        if (prev.url) URL.revokeObjectURL(prev.url);
        return { open: true, url: objectUrl, blob, fileName };
      });
    } catch (error) {
      console.error('PDF preview error:', error);
      setStatus({ type: 'error', msg: `Σφάλμα δημιουργίας PDF: ${error.message}` });
    } finally {
      setLoadingState(null);
    }
  };

  const handlePreviewCurrentInvoice = async () => {
    const invoice = buildCurrentInvoice();
    const errors = validateInvoiceForAADE(invoice, branchCfg);
    if (errors.length) {
      setStatus({ type: 'error', msg: errors.join('\n') });
      return;
    }
    const invoiceWithTotals = {
      ...invoice,
      totals: {
        net: round2(totals.net),
        vat: round2(totals.vat),
        gross: round2(totals.net + totals.vat + ((isVilla && separateSurcharge) ? 0 : Number(surcharge || 0))),
        surcharge: round2(Number(surcharge || 0)),
      },
    };
    await openPreviewForInvoice(invoiceWithTotals);
  };

  const handlePreviewHistoryInvoice = async (historyEntry) => {
    if (!historyEntry) return;
    await openPreviewForInvoice(historyEntry);
  };

  const handleReceiptHistoryInvoice = (historyEntry) => {
    if (!historyEntry) return;
    if (typeof window.PDFGenerator?.generateThermalReceiptPDFBlob !== 'function') {
      setStatus({ type: 'error', msg: 'Το PDF module δεν υποστηρίζει thermal αποδείξεις.' });
      return;
    }
    (async () => {
      try {
        setLoadingState({ type: 'pdf-preview', message: 'Δημιουργία προεπισκόπησης αποδείκτη…' });
        const prepared = normalizeInvoiceForPdf(historyEntry);
        const blob = await window.PDFGenerator.generateThermalReceiptPDFBlob(prepared, BRANCHES, null, { qr: true });
        const fileName = `receipt_${prepared.invoiceNumber || 'preview'}.pdf`;
        const objectUrl = URL.createObjectURL(blob);
        setPdfPreviewState((prev) => {
          if (prev.url) URL.revokeObjectURL(prev.url);
          return { open: true, url: objectUrl, blob, fileName };
        });
      } catch (err) {
        console.error('Receipt preview error', err);
        setStatus({ type: 'error', msg: `Σφάλμα δημιουργίας αποδέκτη: ${err.message || String(err)}` });
      } finally {
        setLoadingState(null);
      }
    })();
  };

  const handlePrintThermalCurrentInvoice = () => {
    const invoice = buildCurrentInvoice();
    const errors = validateInvoiceForAADE(invoice, branchCfg);
    if (errors.length) {
      setStatus({ type: 'error', msg: errors.join('\n') });
      return;
    }
    if (typeof window.PDFGenerator?.generateThermalReceiptPDFBlob !== 'function') {
      setStatus({ type: 'error', msg: 'Το PDF module δεν υποστηρίζει thermal αποδείξεις.' });
      return;
    }
    (async () => {
      try {
        setLoadingState({ type: 'pdf-preview', message: 'Δημιουργία προεπισκόπησης αποδείκτη…' });
        const prepared = normalizeInvoiceForPdf({
          ...invoice,
          totals: {
            net: round2(totals.net),
            vat: round2(totals.vat),
            gross: round2(totals.net + totals.vat + ((isVilla && separateSurcharge) ? 0 : Number(surcharge || 0))),
            surcharge: round2(Number(surcharge || 0)),
          }
        });
        const blob = await window.PDFGenerator.generateThermalReceiptPDFBlob(prepared, BRANCHES, null, { qr: true });
        const fileName = `receipt_${prepared.invoiceNumber || 'preview'}.pdf`;
        const objectUrl = URL.createObjectURL(blob);
        setPdfPreviewState((prev) => {
          if (prev.url) URL.revokeObjectURL(prev.url);
          return { open: true, url: objectUrl, blob, fileName };
        });
      } catch (err) {
        console.error('Receipt preview error', err);
        setStatus({ type: 'error', msg: `Σφάλμα δημιουργίας αποδέκτη: ${err.message || String(err)}` });
      } finally {
        setLoadingState(null);
      }
    })();
  };

  const closePdfPreview = () => {
    setPdfPreviewState((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { open: false, url: null, blob: null, fileName: '' };
    });
  };

  // Issue separate ΤΑΚΚ document for a history invoice (villas)
  const handleIssueSurchargeForHistory = async (historyEntry) => {
    if (!historyEntry) return;
    const targetBranch = historyEntry.branchId;
    const cfg = BRANCHES[targetBranch];
  if (!cfg) { setStatus({ type: 'error', msg: 'Άγνωστο υποκατάστημα για ΤΑΚΚ.' }); return; }
  const isVillaRow = VILLA_BRANCH_IDS.includes(targetBranch);
  if (!isVillaRow) { setStatus({ type: 'error', msg: 'Το ΤΑΚΚ ισχύει μόνο για τις βίλες.' }); return; }

    // Υπολόγισε surcharge βάσει κανόνα/ημερομηνίας του entry
    let surchargeValue = Number(historyEntry?.surcharge || historyEntry?.totals?.surcharge || 0);
    if (!surchargeValue) {
      // αν δεν έχει αποθηκευτεί, υπολόγισε ξανά με βάση τον κανόνα του branch
      const rule = cfg?.revenueMapping?.surchargeRule;
      if (rule) {
        const nights = (historyEntry.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
        let v = 0;
        if (rule.mode === 'seasonalPerNight') {
          const d = new Date(historyEntry.issueDate || historyEntry.invoiceDate || new Date());
          const m = isNaN(d.getTime()) ? (new Date()).getMonth() + 1 : d.getMonth() + 1;
          const isSummer = m >= 4 && m <= 10;
          const rate = isSummer ? Number(rule.summerRate || 0) : Number(rule.winterRate || 0);
          v = rate * nights;
        } else if (rule.mode === 'perNight') {
          v = Number(rule.rate || 0) * nights;
        } else if (rule.mode === 'flatPerInvoice') {
          v = Number(rule.amount || 0);
        }
        surchargeValue = Math.round((v + Number.EPSILON) * 100) / 100;
      }
    }
  if (!surchargeValue) { setStatus({ type: 'error', msg: 'Δεν προέκυψε ποσό ΤΑΚΚ για έκδοση.' }); return; }

  // Δημιούργησε νέο τιμολόγιο μόνο με ΤΑΚΚ
    const newNumber = generateNextInvoiceNumberValue(targetBranch, history);
    const today = new Date().toISOString().slice(0,10);
    const surchargeInvoice = {
      branchId: targetBranch,
      invoiceDate: today,
      issueDate: today,
      invoiceNumber: newNumber,
      customer: { ...(historyEntry.customer || {}) },
      items: [],
      surcharge: surchargeValue,
      paymentMethod: historyEntry.paymentMethod || 'cash',
    };
    const payload = buildMyDataPayload(surchargeInvoice, cfg, { surchargeMode: 'surchargeOnly' });

  setLoadingState({ type: 'submit', message: 'Έκδοση ΤΑΚΚ…' });
    try {
      const result = await serverSubmit(payload);
      const historyEntry2 = {
        ...surchargeInvoice,
        totals: payload.totals,
        status: result.ok ? 'sent' : 'failed',
        mark: result.ok ? result.mark : undefined,
        error: result.ok ? undefined : (result.error || 'Άγνωστο σφάλμα'),
        timestamp: Date.now(),
      };
      addHistoryEntry(historyEntry2);
      if (result.ok) {
        commitInvoiceSequence(targetBranch, newNumber);
        setStatus({ type: 'success', msg: `Εκδόθηκε ΤΑΚΚ #${newNumber} (${surchargeValue.toFixed(2)} €). MARK: ${result.mark}` });
      } else {
        setStatus({ type: 'error', msg: `Αποτυχία έκδοσης ΤΑΚΚ: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: `Σφάλμα δικτύου: ${err.message}` });
    } finally {
      setLoadingState(null);
    }
  };

  const handlePreviewDownload = () => {
    const { blob, fileName, url } = pdfPreviewState;
    if (!blob && !url) return;
    const downloadUrl = url || URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'invoice.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (!url && blob) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  useEffect(() => () => {
    if (pdfPreviewState.url) {
      URL.revokeObjectURL(pdfPreviewState.url);
    }
  }, [pdfPreviewState.url]);

  const summaryStats = useMemo(() => {
    const branchHistory = history.filter((entry) => entry.branchId === branch);
    const totalInvoices = branchHistory.length;
    const sentInvoices = branchHistory.filter((entry) => entry.status === 'sent').length;
    const failedInvoices = branchHistory.filter((entry) => entry.status === 'failed').length;
    const queueLength = failedQueue.length;
    const sentPercentage = totalInvoices ? Math.round((sentInvoices / totalInvoices) * 100) : 0;

    const now = new Date();
    const monthlyHistory = branchHistory.filter((entry) => {
      const issue = entry.issueDate || entry.invoiceDate;
      if (!issue) return false;
      const date = new Date(issue);
      return !Number.isNaN(date.getTime()) &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth();
    });

    const monthlyTotals = monthlyHistory.reduce(
      (acc, entry) => {
        const totals = entry.totals || {};
        const net = Number(totals.net || 0);
        const vat = Number(totals.vat || 0);
        const gross = totals.gross != null ? Number(totals.gross) : net + vat;
        acc.net += net;
        acc.vat += vat;
        acc.gross += gross;
        return acc;
      },
      { net: 0, vat: 0, gross: 0 }
    );

    return {
      totalInvoices,
      currentBranchLabel: branchCfg.label,
      sentInvoices,
      failedInvoices,
      queueLength,
      sentPercentage,
      monthlyNet: round2(monthlyTotals.net || 0),
      monthlyVat: round2(monthlyTotals.vat || 0),
      monthlyGross: round2(monthlyTotals.gross || 0),
    };
  }, [branch, branchCfg.label, failedQueue.length, history]);
  const loadingType = loadingState?.type;
  const isProcessing = Boolean(loadingState);
  const handleNavigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // Render invoice creation section
  const renderInvoiceSection = () => (
    <div className="space-y-6">
      <InvoiceMetadata
        branch={branch}
        branches={BRANCHES}
        branchCfg={branchCfg}
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        paymentMethod={paymentMethod}
        invoiceTime={invoiceTime}
        onBranchChange={setBranch}
        onInvoiceNumberChange={setInvoiceNumber}
        onInvoiceDateChange={setInvoiceDate}
        onPaymentMethodChange={setPaymentMethod}
        onInvoiceTimeChange={setInvoiceTime}
      />

      <CustomerPanel
        customer={customer}
        customers={customers}
        onCustomerChange={setCustomer}
        onAddCustomer={addCustomer}
        onRequestDeleteCustomer={(payload) => requestCustomerDeletion(payload)}
        onPickCustomer={(vat) => pickCustomer(vat)}
        onLookupCustomer={async (vatId) => {
          const foundCustomer = await handleCustomerLookup(vatId);
          if (foundCustomer) {
            setCustomer({
              name: foundCustomer.name || '',
              vat: foundCustomer.vat || vatId,
              city: foundCustomer.city || '',
              address: foundCustomer.address || '',
              postalCode: foundCustomer.postalCode || '',
              email: ''
            });
            window.alert(`✅ Πελάτης βρέθηκε!\n\n${foundCustomer.name}`);
          }
        }}
      />

      <ItemsTable
        items={items}
        branchCfg={branchCfg}
        onChangeItem={(idx, patch) => {
          const arr = [...items];
          arr[idx] = { ...arr[idx], ...patch };
          setItems(arr);
        }}
        onAddItem={addItem}
        onRemoveItem={removeItem}
      />

      <TotalsPanel
        isVilla={isVilla}
        totals={totals}
        surcharge={surcharge}
        onSurchargeChange={setSurcharge}
        separateSurcharge={separateSurcharge}
        onToggleSeparateSurcharge={setSeparateSurcharge}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <button
          onClick={handlePreviewCurrentInvoice}
          disabled={isProcessing}
          className="w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 px-5 py-4 text-left text-slate-100 transition hover:border-sky-400/70 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-100">
              <DocumentStackIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Προεπισκόπηση PDF</p>
              <p className="text-xs text-slate-300">Οπτικός έλεγχος πριν την υποβολή</p>
            </div>
          </div>
        </button>

        <div className="lg:col-span-1 xl:col-span-2">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500 px-5 py-4 text-left text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-50">
                <CheckCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-semibold">Υποβολή στο myDATA</p>
                <p className="text-xs text-emerald-900/90">Αποστολή μέσω ασφαλούς backend</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handlePrintThermalCurrentInvoice}
          disabled={isProcessing}
          className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4 text-left text-slate-100 transition hover:border-slate-500/70 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-200">
              <HistoryIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Print Receipt (80mm)</p>
              <p className="text-xs text-slate-400">Θερμική απόδειξη με QR</p>
            </div>
          </div>
        </button>

        <button
          onClick={requestFormReset}
          disabled={isProcessing}
          className="w-full rounded-2xl border border-slate-700/50 bg-transparent px-5 py-4 text-left text-slate-300 transition hover:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
              <WarningIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Καθαρισμός</p>
              <p className="text-xs text-slate-400">Επαναφορά φόρμας και πεδίων</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Render history section
  const renderHistorySection = () => (
    <HistoryTable
      history={history}
      branches={BRANCHES}
      currentBranchId={branch}
      dateFormat={dateFormat}
      onPreview={handlePreviewHistoryInvoice}
      onDownload={downloadInvoicePDF}
      onReceipt={handleReceiptHistoryInvoice}
      onIssueSurcharge={handleIssueSurchargeForHistory}
      onDeleteEntry={requestDeleteHistory}
      onCancel={handleCancelInvoice}
      disableActions={isProcessing}
    />
  );

  // Render failed submissions section
  const renderFailedSection = () => (
    <FailedSubmissions
      failedQueue={failedQueue}
      branches={BRANCHES}
      onRetryAll={retryAll}
      onRetryOne={retryOne}
      loadingType={loadingType}
      onRequestDeleteOne={(index, entry) => {
        if (typeof index !== 'number') return;
        const descriptor = entry?.invoiceNumber ? `#${entry.invoiceNumber}` : 'που επιλέξατε';
        openConfirm({
          title: 'Διαγραφή αποτυχημένης υποβολής',
          message: `Η αποτυχημένη υποβολή για το τιμολόγιο ${descriptor} θα αφαιρεθεί από τη λίστα. Η ενέργεια δεν μπορεί να αναιρεθεί.`,
          confirmLabel: 'Διαγραφή',
          cancelLabel: 'Άκυρο',
          intent: 'danger',
          onConfirm: () => removeFailedEntry(index),
        });
      }}
    />
  );

  // Render settings section
  const renderSettingsSection = () => (
    <div className="space-y-6">
      <BackendControls
        useBackend={useBackend}
        backendBase={backendBase}
        setBackendBase={setBackendBaseValidated}
        aadeEnv={aadeEnv}
        setAadeEnv={setAadeEnv}
        aadeClientId={aadeClientId}
        setAadeClientId={setAadeClientId}
        aadeClientSecret={aadeClientSecret}
        setAadeClientSecret={setAadeClientSecret}
        aadeApiKey={aadeApiKey}
        setAadeApiKey={setAadeApiKey}
        aadeSubscriptionKey={aadeSubscriptionKey}
        setAadeSubscriptionKey={setAadeSubscriptionKey}
        aadeTaxisnetUsername={aadeTaxisnetUsername}
        setAadeTaxisnetUsername={setAadeTaxisnetUsername}
        aadeTaxisnetPassword={aadeTaxisnetPassword}
        setAadeTaxisnetPassword={setAadeTaxisnetPassword}
        aadeCertPath={aadeCertPath}
        setAadeCertPath={setAadeCertPath}
        aadeCertPassword={aadeCertPassword}
        setAadeCertPassword={setAadeCertPassword}
        gsisUsername={gsisUsername}
        setGsisUsername={setGsisUsername}
        gsisPassword={gsisPassword}
        setGsisPassword={setGsisPassword}
        connectionStatus={connectionStatus}
        onTestConnection={handleConnectionTest}
        isTestingConnection={isTestingConnection}
      />
      <DateSettings dateFormat={dateFormat} onChange={persistDateFormat} />
      <PrinterSettings />
    </div>
  );

  const renderTrashSection = () => (
    <TrashBin
      entries={trash}
      branches={BRANCHES}
      dateFormat={dateFormat}
      onRestore={requestRestoreFromTrash}
      onDeleteForever={requestDeleteTrashEntry}
      onEmpty={requestEmptyTrash}
      disableActions={isProcessing}
    />
  );

  return (
    <div className="app-shell">
      <div className="app-shell__grid" aria-hidden />
      <div className="app-shell__glow app-shell__glow--emerald" aria-hidden />
      <div className="app-shell__glow app-shell__glow--amber" aria-hidden />
      <div className="relative min-h-screen bg-transparent lg:flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        useBackend={useBackend}
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header & Operational Ribbon */}
        <div className="px-4 pt-6 sm:px-6 lg:px-8 space-y-4">
          <Header
            branchName={branchCfg.label}
            issuer={branchIssuer}
            onToggleSidebar={() => setSidebarOpen(true)}
            onToggleSidebarCollapse={() => setSidebarCollapsed((s) => !s)}
            isSidebarCollapsed={sidebarCollapsed}
            onRefresh={handleRefresh}
            onCheckUpdate={handleCheckUpdate}
          />
          <ExperienceRibbon
            branchName={branchCfg.label}
            aadeEnv={aadeEnv}
            backendBase={backendBase}
            connectionStatus={connectionStatus}
            queueLength={failedQueue.length}
            lastSuccess={lastSuccessfulInvoice}
            now={currentTime}
            timezone={timezoneLabel}
          />
        </div>

        {/* Content with padding and scroll */}
        <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Status Message */}
            {status.type !== 'idle' && (
              <div className="sticky top-4 z-10">
                <StatusMessage status={status} onDismiss={() => setStatus({ type: 'idle', msg: '' })} />
              </div>
            )}

            {/* Dynamic Section Rendering */}
            {activeSection === 'invoice' && renderInvoiceSection()}
            {activeSection === 'history' && renderHistorySection()}
            {activeSection === 'failed' && renderFailedSection()}
            {activeSection === 'settings' && renderSettingsSection()}
            {activeSection === 'trash' && renderTrashSection()}
          </div>
        </div>
      </div>
      </div>

      {loadingState && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/80 px-6 py-4 shadow-xl">
            <span className="h-10 w-10 rounded-full border-2 border-emerald-400/40 border-t-transparent animate-spin" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-200">{loadingState.message}</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        intent={confirmState?.intent}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      <PDFPreviewModal
        open={pdfPreviewState.open}
        pdfUrl={pdfPreviewState.url}
        fileName={pdfPreviewState.fileName}
        onClose={closePdfPreview}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
}

function normalizeInvoiceForPdf(invoice) {
  const safeInvoice = invoice ? { ...invoice } : {};
  const items = Array.isArray(safeInvoice.items) ? safeInvoice.items.map((item) => ({ ...item })) : [];
  const computedTotals = calcTotals(items);
  const existingTotals = safeInvoice.totals || {};
  const surchargeValue = Number(safeInvoice.surcharge || 0);
  const net = existingTotals.net != null ? Number(existingTotals.net) : computedTotals.net;
  const vat = existingTotals.vat != null ? Number(existingTotals.vat) : computedTotals.vat;
  const gross = existingTotals.gross != null ? Number(existingTotals.gross) : net + vat + surchargeValue;

  return {
    ...safeInvoice,
    items,
    customer: safeInvoice.customer ? { ...safeInvoice.customer } : undefined,
    issueDate: safeInvoice.issueDate || safeInvoice.invoiceDate,
    issueTime: safeInvoice.issueTime || safeInvoice.invoiceTime || '',
    totals: {
      net: round2(net),
      vat: round2(vat),
      gross: round2(gross),
      surcharge: round2(existingTotals.surcharge != null ? Number(existingTotals.surcharge) : surchargeValue),
    },
  };
}

// Συνάρτηση για εξαγωγή PDF (χρησιμοποιεί το PDF Generator module)
function downloadInvoicePDF(invoice) {
  // Έλεγχος εάν το PDFGenerator module είναι διαθέσιμο
  if (typeof window.PDFGenerator === 'undefined') {
    alert('Το PDFGenerator module δεν είναι διαθέσιμο. Παρακαλώ φορτώστε τη σελίδα ξανά.');
    return;
  }

  // Κλήση της downloadInvoicePDF από το PDFGenerator module
  window.PDFGenerator.downloadInvoicePDF(normalizeInvoiceForPdf(invoice), BRANCHES);
}

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<InvoiceApp />);
}



