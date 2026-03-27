import React, { useEffect, useMemo, useState } from "react";

// Invoice application (MVP) with local persistence and mock myDATA integration.
// This component renders a full invoicing UI with editable master data (company,
// customers and items), invoice lines with VAT calculations, a discount field,
// toast notifications, modal dialogs for editing master data, a JSON preview
// representing the myDATA payload and basic print‑friendly styling. It uses
// Tailwind utility classes for styling; ensure Tailwind is included in your
// project for the classes to take effect.

// Currency symbol for display. Adjust if you need a different currency.
const CURRENCY = "€";

// Compose conditional class names into a single string. Filters out falsy values.
function classNames(...s) {
  return s.filter(Boolean).join(" ");
}

// Format numbers with two decimal places using the Greek locale. Tailor this
// function if you need a different formatting style.
function number(n) {
  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Generic modal component. It accepts an open flag, a title, child content,
// optional actions and an onClose callback. Clicking on the backdrop or
// pressing Escape closes the modal.
function Modal({ open, title, children, onClose, actions }) {
  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape" && open) onClose?.();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              className="text-slate-400 hover:text-slate-200"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto">{children}</div>
          <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2 justify-end">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main application component. All invoicing logic lives here.
export default function InvoiceApp() {
  // ----- State declarations (all at the top) -----
  const [env, setEnv] = useState("SANDBOX");
  const [company, setCompany] = useState({
    name: "Τεντοπέργκολες Παπαδομιχελάκης",
    vat: "801234567",
    doy: "Ρεθύμνου",
    address: "Giampoudaki 43, Ρέθυμνο 74100",
    phone: "2831 025964",
    email: "tentespapadimixelakis@gmail.com",
    iban: "GR12 0110 1250 0000 0001 2300 695",
    contact: "Παπαδομιχελάκης Εμμανουήλ Κ.",
  });
  const [customers, setCustomers] = useState([
    {
      id: "c1",
      name: "Πελάτης Α",
      vat: "099999999",
      doy: "Α' Αθηνών",
      address: "Λ. Κηφισίας 100, Αθήνα",
    },
    {
      id: "c2",
      name: "Πελάτης Β",
      vat: "123456789",
      doy: "Δ' Θεσσαλονίκης",
      address: "Τσιμισκή 50, Θεσσαλονίκη",
    },
    {
      id: "c3",
      name: "Πελάτης Γ",
      vat: "082233445",
      doy: "Πειραιά",
      address: "Κουντουριώτη 10, Πειραιάς",
    },
  ]);
  const [items, setItems] = useState([
    {
      id: "i1",
      code: "TEN-001",
      description: "Τέντα πέργκολα (εγκατάσταση)",
      unitPrice: 400,
      vatRate: 24,
    },
    {
      id: "i2",
      code: "TEN-002",
      description: "Κατασκευή τέντας σκίασης",
      unitPrice: 250,
      vatRate: 24,
    },
    {
      id: "i3",
      code: "TEN-003",
      description: "Επίσκεψη – συντήρηση τέντας",
      unitPrice: 70,
      vatRate: 24,
    },
    {
      id: "i4",
      code: "TEN-004",
      description: "Διάφανη ζελατίνα γκιλοτίνα",
      unitPrice: 180,
      vatRate: 24,
    },
  ]);

  // ----- Invoice and modal state -----
  const [invoice, setInvoice] = useState({
    series: "A",
    number: 1,
    issueDate: new Date().toISOString().slice(0, 10),
    customerId: "c1",
    paymentMethod: "Τραπεζική κατάθεση",
    notes: "Ευχαριστούμε για τη συνεργασία.",
    docType: "1.1",
    discountRate: 0,
  });
  const [lines, setLines] = useState([{ id: 1, itemId: "i1", qty: 1 }]);
  const [status, setStatus] = useState({
    state: "draft",
    mark: null,
    message: "Δεν έχει διαβιβαστεί",
  });
  const [toast, setToast] = useState(null);
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openItems, setOpenItems] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openJson, setOpenJson] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ----- Effects -----
  useEffect(() => {
    try {
      const savedCompany = localStorage.getItem("company");
      if (savedCompany) setCompany(JSON.parse(savedCompany));
      const savedCustomers = localStorage.getItem("customers");
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      const savedItems = localStorage.getItem("items");
      if (savedItems) setItems(JSON.parse(savedItems));
    } catch (err) {
      console.warn("Failed to load from localStorage", err);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("company", JSON.stringify(company));
    } catch (err) {}
  }, [company]);
  useEffect(() => {
    try {
      localStorage.setItem("customers", JSON.stringify(customers));
    } catch (err) {}
  }, [customers]);
  useEffect(() => {
    try {
      localStorage.setItem("items", JSON.stringify(items));
    } catch (err) {}
  }, [items]);

  // Series and document types; adjust to match your needs. The IDs map to
  // myDATA codes (1.1=services invoice, 1.2=sales invoice, 5.2=credit note).
  const seriesOptions = [
    { id: "A", label: "Σειρά Α (Υπηρεσίες)" },
    { id: "B", label: "Σειρά Β (Προϊόντα)" },
  ];
  const docTypes = [
    { id: "1.1", label: "Τιμολόγιο Παροχής Υπηρεσιών (1.1)" },
    { id: "1.2", label: "Τιμολόγιο Πώλησης (1.2)" },
    { id: "5.2", label: "Πιστωτικό Τιμολόγιο (5.2)" },
  ];

  // Derived: current customer object based on invoice.customerId
  const customer = useMemo(() => {
    return customers.find((c) => c.id === invoice.customerId);
  }, [invoice.customerId, customers]);
  // Enrich lines with item details and compute net/vat per line.
  const enrichedLines = useMemo(() => {
    return lines.map((l) => {
      const item = items.find((i) => i.id === l.itemId);
      const qty = Number(l.qty) || 0;
      const unit = item?.unitPrice ?? 0;
      const vatRate = item?.vatRate ?? 24;
      const net = unit * qty;
      const vat = net * (vatRate / 100);
      return { ...l, item, qty, unit, net, vat, vatRate };
    });
  }, [lines, items]);
  // Compute totals including discount. We apply discount uniformly across net and VAT.
  const totals = useMemo(() => {
    const netSum = enrichedLines.reduce((s, l) => s + l.net, 0);
    const vatSum = enrichedLines.reduce((s, l) => s + l.vat, 0);
    const discountRate = Number(invoice.discountRate) || 0;
    const discountFactor = 1 - discountRate / 100;
    const netAfter = netSum * discountFactor;
    const vatAfter = vatSum * discountFactor;
    const discountAmount = netSum - netAfter;
    const gross = netAfter + vatAfter;
    return { net: netSum, vat: vatSum, discountRate, discountAmount, netAfter, vatAfter, gross };
  }, [enrichedLines, invoice.discountRate]);
  // Determine if the invoice can be sent: must have a customer and at least one line with positive amount.
  const canSend = invoice.customerId && enrichedLines.length > 0 && totals.gross > 0;

  // ----- Helpers -----
  function updateLine(id, patch) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLine() {
    const nextId = Math.max(0, ...lines.map((l) => l.id)) + 1;
    setLines((prev) => [
      ...prev,
      { id: nextId, itemId: items[0]?.id || "", qty: 1 },
    ]);
  }
  function requestRemoveLine(id) {
    setConfirmDelete({ kind: "line", id });
  }
  function reallyRemoveLine(id) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }
  function simulateSendToMyDATA() {
    if (!canSend) return;
    setStatus({ state: "sending", mark: null, message: "Αποστολή στη myDATA…" });
    // Simulate network latency
    setTimeout(() => {
      const randomMark = `MARK-${Math.floor(Math.random() * 9000000) + 1000000}`;
      setStatus({ state: "accepted", mark: randomMark, message: "Έγινε αποδοχή από myDATA" });
      setToast({ type: "success", text: "Η διαβίβαση ολοκληρώθηκε (mock)." });
      // Auto‑increment the invoice number after successful send
      setInvoice((prev) => ({ ...prev, number: prev.number + 1 }));
      setTimeout(() => setToast(null), 2500);
    }, 1200);
  }
  function resetToDraft() {
    setStatus({ state: "draft", mark: null, message: "Δεν έχει διαβιβαστεί" });
  }
  function saveDraft() {
    setToast({ type: "info", text: "Το πρόχειρο αποθηκεύτηκε τοπικά (mock)." });
    setTimeout(() => setToast(null), 2200);
  }
  // Build a JSON representation of the invoice approximating the myDATA schema.
  function buildMyDataPayload() {
    const header = {
      series: invoice.series,
      aa: invoice.number,
      issueDate: invoice.issueDate,
      invoiceType: invoice.docType,
    };
    const issuer = {
      vatNumber: company.vat,
      country: "GR",
      branch: "0",
    };
    const counterparty = {
      vatNumber: customer?.vat,
      country: "GR",
      branch: "0",
    };
    const invoiceSummary = {
      netValue: totals.netAfter,
      vatAmount: totals.vatAfter,
      totalAmount: totals.gross,
    };
    const details = enrichedLines.map((l, idx) => ({
      lineNumber: idx + 1,
      netValue: (l.net * (1 - totals.discountRate / 100)).toFixed(2),
      vatCategory: l.vatRate.toString(),
      vatAmount: (l.vat * (1 - totals.discountRate / 100)).toFixed(2),
      incomeClassification: {
        type: l.vatRate === 24 ? "E3_561_007" : "OTHER",
      },
    }));
    return { header, issuer, counterparty, details, invoiceSummary };
  }
  // Copy text to clipboard. Modern browsers support navigator.clipboard; fall back
  // to a hidden textarea for older ones.
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (err) {}
      document.body.removeChild(textarea);
    }
    setToast({ type: "success", text: "Αντιγράφηκε στο clipboard!" });
    setTimeout(() => setToast(null), 2000);
  }

  // ----- Customers modal content -----
  function CustomersBody() {
    const [form, setForm] = useState({ id: "", name: "", vat: "", doy: "", address: "" });
    const editing = !!form.id;
    function clear() {
      setForm({ id: "", name: "", vat: "", doy: "", address: "" });
    }
    function selectForEdit(c) {
      setForm(c);
    }
    function save() {
      if (!form.name || !form.vat) {
        return;
      }
      if (editing) {
        setCustomers((cs) => cs.map((c) => (c.id === form.id ? form : c)));
      } else {
        const id = `c${Date.now()}`;
        setCustomers((cs) => [...cs, { ...form, id }]);
      }
      clear();
    }
    function askDelete(id) {
      setConfirmDelete({ kind: "customer", id });
    }
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Επωνυμία</th>
                <th className="text-left px-3 py-2">ΑΦΜ</th>
                <th className="text-left px-3 py-2">ΔΟΥ</th>
                <th className="text-left px-3 py-2">Διεύθυνση</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.vat}</td>
                  <td className="px-3 py-2">{c.doy}</td>
                  <td className="px-3 py-2 text-slate-300">{c.address}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="text-xs border border-slate-700 rounded px-2 py-1"
                      onClick={() => selectForEdit(c)}
                    >
                      Επεξεργασία
                    </button>
                    <button
                      className="text-xs border border-rose-700 text-rose-300 rounded px-2 py-1"
                      onClick={() => askDelete(c.id)}
                    >
                      Διαγραφή
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Επωνυμία
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            ΑΦΜ
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.vat}
              onChange={(e) => setForm((v) => ({ ...v, vat: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            ΔΟΥ
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.doy}
              onChange={(e) => setForm((v) => ({ ...v, doy: e.target.value }))}
            />
          </label>
          <label className="text-sm col-span-2">
            Διεύθυνση
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.address}
              onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-emerald-600 text-emerald-300 px-3 py-1"
            onClick={save}
          >
            {editing ? "Αποθήκευση" : "Προσθήκη"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-3 py-1"
            onClick={clear}
          >
            Καθαρισμός
          </button>
        </div>
      </div>
    );
  }

  // ----- Items modal content -----
  function ItemsBody() {
    const [form, setForm] = useState({ id: "", code: "", description: "", unitPrice: 0, vatRate: 24 });
    const editing = !!form.id;
    function clear() {
      setForm({ id: "", code: "", description: "", unitPrice: 0, vatRate: 24 });
    }
    function selectForEdit(it) {
      setForm(it);
    }
    function save() {
      if (!form.code || !form.description) {
        return;
      }
      const parsedPrice = Number(form.unitPrice) || 0;
      const parsedVat = Number(form.vatRate) || 0;
      const record = { ...form, unitPrice: parsedPrice, vatRate: parsedVat };
      if (editing) {
        setItems((arr) => arr.map((i) => (i.id === form.id ? record : i)));
      } else {
        const id = `i${Date.now()}`;
        setItems((arr) => [...arr, { ...record, id }]);
      }
      clear();
    }
    function askDelete(id) {
      setConfirmDelete({ kind: "item", id });
    }
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Κωδικός</th>
                <th className="text-left px-3 py-2">Περιγραφή</th>
                <th className="text-right px-3 py-2">Τιμή</th>
                <th className="text-right px-3 py-2">ΦΠΑ</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{it.code}</td>
                  <td className="px-3 py-2">{it.description}</td>
                  <td className="px-3 py-2 text-right">
                    {number(it.unitPrice)} {CURRENCY}
                  </td>
                  <td className="px-3 py-2 text-right">{it.vatRate}%</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="text-xs border border-slate-700 rounded px-2 py-1"
                      onClick={() => selectForEdit(it)}
                    >
                      Επεξεργασία
                    </button>
                    <button
                      className="text-xs border border-rose-700 text-rose-300 rounded px-2 py-1"
                      onClick={() => askDelete(it.id)}
                    >
                      Διαγραφή
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Κωδικός
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.code}
              onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Περιγραφή
            <input
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Τιμή Μονάδας
            <input
              type="number"
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.unitPrice}
              onChange={(e) => setForm((v) => ({ ...v, unitPrice: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            ΦΠΑ (%)
            <input
              type="number"
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
              value={form.vatRate}
              onChange={(e) => setForm((v) => ({ ...v, vatRate: e.target.value }))}
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-emerald-600 text-emerald-300 px-3 py-1"
            onClick={save}
          >
            {editing ? "Αποθήκευση" : "Προσθήκη"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-3 py-1"
            onClick={clear}
          >
            Καθαρισμός
          </button>
        </div>
      </div>
    );
  }

  // ----- Settings modal content -----
  function SettingsBody() {
    const [form, setForm] = useState(company);
    function save() {
      setCompany(form);
      setOpenSettings(false);
      setToast({ type: "success", text: "Οι ρυθμίσεις ενημερώθηκαν." });
      setTimeout(() => setToast(null), 2000);
    }
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label>
          Επωνυμία
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
          />
        </label>
        <label>
          ΑΦΜ
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.vat}
            onChange={(e) => setForm((v) => ({ ...v, vat: e.target.value }))}
          />
        </label>
        <label>
          ΔΟΥ
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.doy}
            onChange={(e) => setForm((v) => ({ ...v, doy: e.target.value }))}
          />
        </label>
        <label className="col-span-2">
          Διεύθυνση
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.address}
            onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
          />
        </label>
        <label className="col-span-2">
          Τηλέφωνο
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.phone || ""}
            onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
          />
        </label>
        <label className="col-span-2">
          Email
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.email || ""}
            onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
          />
        </label>
        <label className="col-span-2">
          IBAN
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.iban}
            onChange={(e) => setForm((v) => ({ ...v, iban: e.target.value }))}
          />
        </label>
        <label className="col-span-2">
          Υπεύθυνος Επικοινωνίας
          <input
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
            value={form.contact || ""}
            onChange={(e) => setForm((v) => ({ ...v, contact: e.target.value }))}
          />
        </label>
        <div className="col-span-2 flex items-center justify-end gap-2 mt-2">
          <button
            className="rounded-lg border border-slate-700 px-3 py-1"
            onClick={() => setOpenSettings(false)}
          >
            Άκυρο
          </button>
          <button
            className="rounded-lg border border-emerald-600 text-emerald-300 px-3 py-1"
            onClick={save}
          >
            Αποθήκευση
          </button>
        </div>
      </div>
    );
  }

  // ----- Confirm delete body -----
  function ConfirmBody() {
    if (!confirmDelete) return null;
    const { kind, id } = confirmDelete;
    let text = "Θέλεις σίγουρα να διαγράψεις;";
    if (kind === "line") text = "Διαγραφή γραμμής παραστατικού;";
    if (kind === "item") text = "Διαγραφή είδους/υπηρεσίας;";
    if (kind === "customer") text = "Διαγραφή πελάτη;";
    function doDelete() {
      if (kind === "line") reallyRemoveLine(id);
      if (kind === "item") setItems((arr) => arr.filter((i) => i.id !== id));
      if (kind === "customer") setCustomers((arr) => arr.filter((c) => c.id !== id));
      setConfirmDelete(null);
    }
    return (
      <div className="space-y-4 text-sm">
        <p>{text}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            className="rounded-lg border border-slate-700 px-3 py-1"
            onClick={() => setConfirmDelete(null)}
          >
            Άκυρο
          </button>
          <button
            className="rounded-lg border border-rose-700 text-rose-300 px-3 py-1"
            onClick={doDelete}
          >
            Διαγραφή
          </button>
        </div>
      </div>
    );
  }

  // ----- JSON preview body -----
  function JsonBody() {
    const payload = buildMyDataPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    return (
      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <div className="font-semibold">myDATA Payload (Mock)</div>
          <button
            className="text-xs border border-slate-700 rounded px-2 py-1"
            onClick={() => copyToClipboard(jsonString)}
          >
            Αντιγραφή JSON
          </button>
        </div>
        <pre className="p-3 bg-slate-900 border border-slate-800 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
          {jsonString}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Toast */}
      {toast && (
        <div
          className={classNames(
            "fixed top-3 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border shadow",
            toast.type === "success" && "bg-emerald-500/10 border-emerald-700 text-emerald-200",
            toast.type === "info" && "bg-sky-500/10 border-sky-700 text-sky-200",
            toast.type === "error" && "bg-rose-500/10 border-rose-700 text-rose-200"
          )}
        >
          {toast.text}
        </div>
      )}
      {/* Top bar */}
      <header className="border-b border-slate-800 sticky top-0 z-30 bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-semibold tracking-tight text-lg">Invoicer • MVP</div>
          <span className="text-slate-500">—</span>
          <select
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm"
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            aria-label="Περιβάλλον"
          >
            <option value="SANDBOX">SANDBOX</option>
            <option value="PRODUCTION">PRODUCTION</option>
          </select>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setOpenSettings(true)}
              className="text-xs rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-800"
            >
              Ρυθμίσεις εταιρείας
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{company.name}</div>
              <div className="text-xs text-slate-400">
                ΑΦΜ {company.vat} • ΔΟΥ {company.doy}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center font-bold text-slate-950">
              {company.name.split(" ")[0][0]}
            </div>
          </div>
        </div>
      </header>
      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-1">
            {[
              { id: "dash", label: "Dashboard", icon: "📊" },
              { id: "invoices", label: "Παραστατικά", icon: "🧾", active: true },
              { id: "customers", label: "Πελάτες", icon: "👥", onClick: () => setOpenCustomers(true) },
              { id: "items", label: "Είδη/Υπηρεσίες", icon: "🧩", onClick: () => setOpenItems(true) },
              { id: "settings", label: "Ρυθμίσεις", icon: "⚙️", onClick: () => setOpenSettings(true) },
            ].map((i) => (
              <button
                key={i.id}
                onClick={i.onClick}
                className={classNames(
                  "w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border",
                  i.active ? "bg-slate-900 border-slate-700" : "border-transparent hover:bg-slate-900/60"
                )}
              >
                <span>{i.icon}</span>
                <span className={classNames("text-sm", i.active && "font-medium")}>{i.label}</span>
                {i.active && (
                  <span className="ml-auto text-[10px] rounded bg-emerald-400/10 text-emerald-300 px-2 py-0.5 border border-emerald-700/30">
                    myDATA Ready
                  </span>
                )}
              </button>
            ))}
          </nav>
          {/* Status card */}
          <div className="mt-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="text-xs uppercase tracking-wide text-slate-400">Κατάσταση Διαβίβασης</div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={classNames(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border",
                  status.state === "accepted" && "bg-emerald-500/10 text-emerald-300 border-emerald-700/40",
                  status.state === "sending" && "bg-amber-500/10 text-amber-300 border-amber-700/40",
                  status.state === "draft" && "bg-slate-700/30 text-slate-300 border-slate-600/40"
                )}
              >
                {status.state === "accepted"
                  ? "Αποδεκτό"
                  : status.state === "sending"
                  ? "Αποστολή…"
                  : "Πρόχειρο"}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-300">{status.message}</div>
            {status.mark && (
              <div className="mt-2 text-xs text-slate-400">
                ΜΑΡΚ: <span className="font-mono text-slate-200">{status.mark}</span>
              </div>
            )}
          </div>
          {/* Tips */}
          <div className="mt-6 text-xs text-slate-400 space-y-2">
            <p>
              • Το περιβάλλον{' '}
              <span className="text-slate-200 font-medium">{env}</span> δεν καταχωρεί
              πραγματικά στοιχεία.
            </p>
            <p>• Μετά την αποδοχή, το ΜΑΡΚ εμφανίζεται και στο PDF.</p>
          </div>
        </aside>
        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 grid lg:grid-cols-2 gap-6">
          {/* Invoice Form */}
          <section className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Έκδοση Τιμολογίου</h2>
              <button
                onClick={resetToDraft}
                className="text-xs rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-800"
              >
                Επαναφορά σε πρόχειρο
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="text-sm">
                Τύπος Παραστατικού
                <select
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.docType}
                  onChange={(e) => setInvoice((v) => ({ ...v, docType: e.target.value }))}
                >
                  {docTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Σειρά
                <select
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.series}
                  onChange={(e) => setInvoice((v) => ({ ...v, series: e.target.value }))}
                >
                  {seriesOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Αριθμός
                <input
                  type="number"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.number}
                  onChange={(e) => setInvoice((v) => ({ ...v, number: Number(e.target.value) }))}
                />
              </label>
              <label className="text-sm">
                Ημερομηνία
                <input
                  type="date"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.issueDate}
                  onChange={(e) => setInvoice((v) => ({ ...v, issueDate: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                Πελάτης
                <div className="flex gap-2">
                  <select
                    className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                    value={invoice.customerId}
                    onChange={(e) => setInvoice((v) => ({ ...v, customerId: e.target.value }))}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="mt-1 text-xs border border-slate-700 rounded px-2"
                    onClick={() => setOpenCustomers(true)}
                  >
                    …
                  </button>
                </div>
              </label>
              <label className="text-sm">
                Έκπτωση (%)
                <input
                  type="number"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.discountRate}
                  onChange={(e) => setInvoice((v) => ({ ...v, discountRate: e.target.value }))}
                  min={0}
                  max={100}
                />
              </label>
            </div>
            {/* Lines */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Γραμμές</div>
                <button
                  onClick={addLine}
                  className="text-xs rounded-lg border border-cyan-700 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20"
                >
                  + Προσθήκη
                </button>
              </div>
              <div className="overflow-auto rounded-xl border border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-300">
                    <tr>
                      <th className="text-left px-3 py-2">Κωδικός</th>
                      <th className="text-left px-3 py-2">Περιγραφή</th>
                      <th className="text-right px-3 py-2">Τιμή</th>
                      <th className="text-right px-3 py-2">Ποσότητα</th>
                      <th className="text-right px-3 py-2">ΦΠΑ</th>
                      <th className="text-right px-3 py-2">Σύνολο</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedLines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-800">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <select
                              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                              value={l.itemId}
                              onChange={(e) => updateLine(l.id, { itemId: e.target.value })}
                            >
                              {items.map((it) => (
                                <option key={it.id} value={it.id}>
                                  {it.code}
                                </option>
                              ))}
                            </select>
                            <button
                              className="text-xs border border-slate-700 rounded px-2"
                              onClick={() => setOpenItems(true)}
                            >
                              …
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-200">
                          {l.item?.description}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {number(l.unit)} {CURRENCY}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-right"
                            value={l.qty}
                            onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) })}
                            min={0}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          {l.vatRate}%
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {number((l.net + l.vat) * (1 - totals.discountRate / 100))} {CURRENCY}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => requestRemoveLine(l.id)}
                            className="text-xs rounded-md px-2 py-1 border border-rose-700 text-rose-300 hover:bg-rose-500/10"
                          >
                            Διαγραφή
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Payment & notes */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="text-sm">
                Τρόπος πληρωμής
                <select
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.paymentMethod}
                  onChange={(e) => setInvoice((v) => ({ ...v, paymentMethod: e.target.value }))}
                >
                  {["Τραπεζική κατάθεση", "Μετρητά", "Κάρτα"].map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Σημειώσεις
                <input
                  type="text"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1"
                  value={invoice.notes}
                  onChange={(e) => setInvoice((v) => ({ ...v, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <button
                onClick={simulateSendToMyDATA}
                disabled={!canSend || status.state === "sending"}
                className={classNames(
                  "rounded-xl px-4 py-2 text-sm font-medium border",
                  canSend && status.state !== "sending"
                    ? "bg-emerald-500/10 border-emerald-600 text-emerald-300 hover:bg-emerald-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed"
                )}
              >
                Αποστολή στη myDATA
              </button>
              <button
                onClick={saveDraft}
                className="rounded-xl px-4 py-2 text-sm font-medium border bg-slate-900 border-slate-700 hover:bg-slate-800"
              >
                Αποθήκευση Πρόχειρου
              </button>
              <button
                onClick={() => setOpenJson(true)}
                className="rounded-xl px-4 py-2 text-sm font-medium border bg-slate-900 border-slate-700 hover:bg-slate-800"
              >
                Προβολή myDATA JSON
              </button>
            </div>
          </section>
          {/* Preview */}
          <section className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h2 className="text-base font-semibold">Προεπισκόπηση PDF</h2>
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{company.name}</div>
                  <div className="text-xs text-slate-400">
                    ΑΦΜ {company.vat} • ΔΟΥ {company.doy}
                  </div>
                    <div className="text-xs text-slate-400">{company.address}</div>
                  {company.phone && (
                    <div className="text-xs text-slate-400">Τηλ. {company.phone}</div>
                  )}
                  {company.email && (
                    <div className="text-xs text-slate-400">Email {company.email}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">ΤΙΜΟΛΟΓΙΟ</div>
                  <div className="text-xs text-slate-400">Τύπος {invoice.docType}</div>
                  <div className="text-xs text-slate-400">
                    Σειρά {invoice.series} • #{invoice.number}
                  </div>
                  <div className="text-xs text-slate-400">Ημ/νία {invoice.issueDate}</div>
                  {status.mark && (
                    <div className="text-[10px] mt-1 font-mono inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-700/40 text-emerald-300 px-2 py-0.5">
                      ΜΑΡΚ: {status.mark}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-slate-400">Προς</div>
                  <div className="font-medium">{customer?.name}</div>
                  <div className="text-slate-400 text-xs">
                    ΑΦΜ {customer?.vat} • ΔΟΥ {customer?.doy}
                  </div>
                  <div className="text-slate-400 text-xs">{customer?.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-slate-400">Πληρωμή</div>
                  <div className="text-sm">{invoice.paymentMethod}</div>
                  <div className="text-xs text-slate-400">IBAN {company.iban}</div>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="text-left px-3 py-2">Περιγραφή</th>
                      <th className="text-right px-3 py-2">Τιμή</th>
                      <th className="text-right px-3 py-2">Ποσ.</th>
                      <th className="text-right px-3 py-2">ΦΠΑ</th>
                      <th className="text-right px-3 py-2">Σύνολο</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedLines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-800">
                        <td className="px-3 py-2">{l.item?.description}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {number(l.unit)} {CURRENCY}
                        </td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right">{l.vatRate}%</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {number((l.net + l.vat) * (1 - totals.discountRate / 100))} {CURRENCY}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-sm">
                  <div className="text-xs uppercase text-slate-400">Σημειώσεις</div>
                  <div className="text-slate-300">{invoice.notes}</div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Καθαρή αξία</span>
                    <span className="font-medium">
                      {number(totals.netAfter)} {CURRENCY}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Έκπτωση ({totals.discountRate}%)</span>
                    <span className="font-medium">
                      -{number(totals.discountAmount)} {CURRENCY}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ΦΠΑ</span>
                    <span className="font-medium">
                      {number(totals.vatAfter)} {CURRENCY}
                    </span>
                  </div>
                  <div className="mt-1 border-t border-slate-800 pt-1 flex items-center justify-between text-base font-semibold">
                    <span>Πληρωτέο</span>
                    <span>
                      {number(totals.gross)} {CURRENCY}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-[10px] text-slate-500">
                * Mock προεπισκόπηση. Τα δεδομένα διαβίβασης myDATA θα οριστούν
                βάσει των επίσημων κωδικοποιήσεων (τύπος παραστατικού, χαρακτηρισμοί,
                ΦΠΑ).
              </div>
            </div>
          </section>
        </main>
      </div>
      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Demo UI • Δεν αποτελεί φορολογικό στοιχείο • {new Date().getFullYear()}
      </footer>
      {/* Modals */}
      <Modal open={openCustomers} title="Πελάτες" onClose={() => setOpenCustomers(false)} actions={null}>
        <CustomersBody />
      </Modal>
      <Modal open={openItems} title="Είδη/Υπηρεσίες" onClose={() => setOpenItems(false)} actions={null}>
        <ItemsBody />
      </Modal>
      <Modal open={openSettings} title="Ρυθμίσεις Εταιρείας" onClose={() => setOpenSettings(false)} actions={null}>
        <SettingsBody />
      </Modal>
      <Modal
        open={!!confirmDelete}
        title="Επιβεβαίωση Διαγραφής"
        onClose={() => setConfirmDelete(null)}
        actions={null}
      >
        <ConfirmBody />
      </Modal>
      <Modal
        open={openJson}
        title="myDATA JSON Preview"
        onClose={() => setOpenJson(false)}
        actions={null}
      >
        <JsonBody />
      </Modal>
    </div>
  );
}
