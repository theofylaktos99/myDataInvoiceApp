# 🏗️ Technical Specifications - Invoice App

> **Complete technical analysis and architecture documentation**

## 📋 Project Overview

**Project Name:** Invoice App - myDATA Integration MVP  
**Type:** Single Page Application (SPA)  
**Primary Language:** JavaScript (JSX) + TypeScript  
**Architecture:** Component-based React application  
**Build System:** Vite 7.1.2  
**Deployment:** Vercel (Production)  

## 🎯 Core Architecture

### 📁 File Structure Analysis

```
C:\DEV PORTOFOLIO\INVOICE APP/                     [Root Directory]
├── 📄 final_invoice_app.jsx                       [1,206 lines - Main App]
├── 📁 src/                                        [React App Structure]
│   ├── 🎯 App.tsx                                 [11 lines - TS Wrapper]
│   ├── 🎨 App.css                                 [Component Styles]
│   ├── 🎨 index.css                               [Tailwind Directives]
│   ├── 🚀 main.tsx                                [React Entry Point]
│   ├── 📝 final_invoice_app.d.ts                  [Type Definitions]
│   ├── 🌍 vite-env.d.ts                           [Vite Types]
│   └── 📁 assets/                                 [Static Assets]
├── 📁 dist/                                       [Production Build]
│   ├── 📄 index.html                              [0.46 kB]
│   ├── 🖼️ vite.svg                               
│   └── 📁 assets/
│       ├── 🎨 index-sFd1uqN_.css                  [15.59 kB → 3.86 kB gzip]
│       └── 📦 index-C3ZM6Bj5.js                   [219.83 kB → 66.36 kB gzip]
├── ⚙️ Configuration Files
│   ├── 📦 package.json                            [Dependencies & Scripts]
│   ├── 🎨 tailwind.config.cjs                     [Tailwind Config]
│   ├── 🔧 postcss.config.cjs                      [PostCSS Setup]
│   ├── 🔧 vite.config.ts                          [Vite Config]
│   ├── 📘 tsconfig.json                           [TypeScript Config]
│   ├── 📘 tsconfig.app.json                       [App TS Config]
│   ├── 📘 tsconfig.node.json                      [Node TS Config]
│   ├── 🌐 vercel.json                             [Deployment Config]
│   ├── 🧹 eslint.config.js                        [Linting Rules]
│   ├── 🙈 .gitignore                              [Git Ignore Rules]
│   └── 🔒 package-lock.json                       [Dependency Lock]
├── 📁 .vercel/                                    [Vercel Deployment Data]
├── 📁 node_modules/                               [Dependencies]
├── 📁 public/                                     [Public Assets]
├── 📝 README.md                                   [Project Overview]
└── 📋 DOCUMENTATION.md                            [Full Documentation]
```

## 🧩 Component Architecture

### 🎯 Main Application Component (`final_invoice_app.jsx`)

**Component Hierarchy:**
```
InvoiceApp [Root Component]
├── Modal [Generic Modal System]
│   ├── CustomersBody [Customer Management]
│   ├── ItemsBody [Items Management]  
│   ├── SettingsBody [Company Settings]
│   ├── JsonBody [myDATA Preview]
│   └── ConfirmBody [Delete Confirmation]
├── Toast [Notification System]
├── Header [Top Navigation]
├── Sidebar [Navigation Menu]
├── InvoiceForm [Main Form]
└── PDFPreview [Invoice Preview]
```

**Component Properties:**

| Component | Lines | Purpose | State Management |
|-----------|-------|---------|------------------|
| `InvoiceApp` | 1,206 | Root container | 15+ useState hooks |
| `Modal` | ~50 | Generic modal | Props-based |
| `CustomersBody` | ~100 | Customer CRUD | Local form state |
| `ItemsBody` | ~100 | Items CRUD | Local form state |
| `SettingsBody` | ~80 | Company settings | Local form state |
| `JsonBody` | ~30 | JSON preview | Computed data |

### 🗄️ State Management Schema

**Primary State Objects:**

```javascript
// Master Data
const [company, setCompany] = useState({
  name: "ΤΕΝΤΕΣ ΑΘΗΝΩΝ ΑΕ",
  vat: "999999999", 
  doy: "Α' Αθηνών",
  address: "Λεωφόρος Μεσογείων 100, Αθήνα",
  phone: "210-1234567",
  email: "info@tentes-athinon.gr", 
  iban: "GR1601101250000000012300695",
  contact: "Γιάννης Παπαδόπουλος"
});

const [customers, setCustomers] = useState([
  {
    id: "c1",
    name: "ΜΑΡΙΝΑ ΑΕ",
    vat: "888888888",
    doy: "Πειραιά", 
    address: "Κουντουριώτη 10, Πειραιάς"
  }
  // ... more customers
]);

const [items, setItems] = useState([
  {
    id: "i1",
    code: "TEN-001",
    description: "Τέντα πέργκολα (εγκατάσταση)",
    unitPrice: 400,
    vatRate: 24
  }
  // ... more items
]);

// Invoice State
const [invoice, setInvoice] = useState({
  series: "A",
  number: 1,
  issueDate: "2025-09-04",
  customerId: "c1", 
  paymentMethod: "Τραπεζική κατάθεση",
  notes: "Ευχαριστούμε για τη συνεργασία.",
  docType: "1.1",
  discountRate: 0
});

const [lines, setLines] = useState([
  { id: 1, itemId: "i1", qty: 1 }
]);

// Application State
const [status, setStatus] = useState({
  state: "draft", // draft | sending | accepted
  mark: null,     // myDATA MARK number
  message: "Δεν έχει διαβιβαστεί"
});

// UI State
const [toast, setToast] = useState(null);
const [openCustomers, setOpenCustomers] = useState(false);
const [openItems, setOpenItems] = useState(false);
const [openSettings, setOpenSettings] = useState(false);
const [openJson, setOpenJson] = useState(false);
const [confirmDelete, setConfirmDelete] = useState(null);
```

### 🧮 Business Logic Engine

**VAT Calculation Algorithm:**
```javascript
// 1. Enrich lines with item details
const enrichedLines = useMemo(() => {
  return lines.map((line) => {
    const item = items.find((i) => i.id === line.itemId);
    const qty = Number(line.qty) || 0;
    const unit = item?.unitPrice ?? 0;
    const vatRate = item?.vatRate ?? 24;
    
    // Calculate net and VAT per line
    const net = unit * qty;
    const vat = net * (vatRate / 100);
    
    return { 
      ...line, 
      item, 
      qty, 
      unit, 
      net, 
      vat, 
      vatRate 
    };
  });
}, [lines, items]);

// 2. Calculate totals with discount
const totals = useMemo(() => {
  const netSum = enrichedLines.reduce((sum, line) => sum + line.net, 0);
  const vatSum = enrichedLines.reduce((sum, line) => sum + line.vat, 0);
  
  const discountRate = Number(invoice.discountRate) || 0;
  const discountFactor = 1 - discountRate / 100;
  
  const netAfter = netSum * discountFactor;
  const vatAfter = vatSum * discountFactor;
  const discountAmount = netSum - netAfter;
  const gross = netAfter + vatAfter;
  
  return { 
    net: netSum, 
    vat: vatSum, 
    discountRate, 
    discountAmount, 
    netAfter, 
    vatAfter, 
    gross 
  };
}, [enrichedLines, invoice.discountRate]);
```

**myDATA Payload Builder:**
```javascript
function buildMyDataPayload() {
  const header = {
    series: invoice.series,
    aa: invoice.number,
    issueDate: invoice.issueDate,
    invoiceType: invoice.docType
  };
  
  const issuer = {
    vatNumber: company.vat,
    country: "GR",
    branch: "0"
  };
  
  const counterparty = {
    vatNumber: customer?.vat,
    country: "GR", 
    branch: "0"
  };
  
  const invoiceSummary = {
    netValue: totals.netAfter,
    vatAmount: totals.vatAfter,
    totalAmount: totals.gross
  };
  
  const details = enrichedLines.map((line, index) => ({
    lineNumber: index + 1,
    netValue: (line.net * (1 - totals.discountRate / 100)).toFixed(2),
    vatCategory: line.vatRate.toString(),
    vatAmount: (line.vat * (1 - totals.discountRate / 100)).toFixed(2),
    incomeClassification: {
      type: line.vatRate === 24 ? "E3_561_007" : "OTHER"
    }
  }));
  
  return { header, issuer, counterparty, details, invoiceSummary };
}
```

## 🎨 UI/UX Architecture

### 🎭 Design System

**Color System (Tailwind CSS):**
```css
/* Primary Palette */
--slate-950: #020617;    /* Primary background */
--slate-900: #0f172a;    /* Secondary background */
--slate-800: #1e293b;    /* Border color */
--slate-700: #334155;    /* Border hover */
--slate-600: #475569;    /* Text secondary */
--slate-400: #94a3b8;    /* Text muted */
--slate-300: #cbd5e1;    /* Text primary */
--slate-200: #e2e8f0;    /* Text emphasis */
--slate-100: #f1f5f9;    /* Text high emphasis */

/* Accent Colors */
--emerald-300: #6ee7b7;  /* Success */
--emerald-400: #34d399;  /* Success hover */
--emerald-600: #059669;  /* Success border */
--emerald-700: #047857;  /* Success border dark */

--rose-300: #fda4af;     /* Error */
--rose-400: #fb7185;     /* Error hover */
--rose-700: #be123c;     /* Error border */

--cyan-400: #22d3ee;     /* Info/accent */
--blue-600: #2563eb;     /* Info dark */

--amber-300: #fcd34d;    /* Warning */
--amber-400: #fbbf24;    /* Warning hover */
--amber-700: #b45309;    /* Warning border */

--sky-400: #38bdf8;      /* Info light */
--sky-700: #0369a1;      /* Info border */
```

**Typography Scale:**
```css
/* Font Sizes */
.text-xs    { font-size: 0.75rem; }   /* 12px */
.text-sm    { font-size: 0.875rem; }  /* 14px */
.text-base  { font-size: 1rem; }      /* 16px */
.text-lg    { font-size: 1.125rem; }  /* 18px */

/* Font Weights */
.font-normal    { font-weight: 400; }
.font-medium    { font-weight: 500; }
.font-semibold  { font-weight: 600; }
.font-bold      { font-weight: 700; }
```

**Spacing System:**
```css
/* Padding/Margin Scale */
.p-1   { padding: 0.25rem; }   /* 4px */
.p-2   { padding: 0.5rem; }    /* 8px */
.p-3   { padding: 0.75rem; }   /* 12px */
.p-4   { padding: 1rem; }      /* 16px */
.p-6   { padding: 1.5rem; }    /* 24px */

/* Gap Scale */
.gap-2 { gap: 0.5rem; }        /* 8px */
.gap-3 { gap: 0.75rem; }       /* 12px */
.gap-4 { gap: 1rem; }          /* 16px */
.gap-6 { gap: 1.5rem; }        /* 24px */
```

### 📱 Responsive Design Strategy

**Breakpoint System:**
```css
/* Mobile First Approach */
/* Default: 0px - 639px (Mobile) */

@media (min-width: 640px) {   /* sm: Small tablets */
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .sm\:flex-row { flex-direction: row; }
}

@media (min-width: 768px) {   /* md: Tablets */
  .md\:col-span-3 { grid-column: span 3; }
  .md\:col-span-9 { grid-column: span 9; }
}

@media (min-width: 1024px) {  /* lg: Desktop */
  .lg\:col-span-2 { grid-column: span 2; }
  .lg\:col-span-10 { grid-column: span 10; }
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {  /* xl: Large desktop */
  /* Additional optimizations */
}
```

**Layout Patterns:**
- **Mobile (< 768px):** Single column, stacked layout
- **Tablet (768px+):** Sidebar + main content (3/9 split)
- **Desktop (1024px+):** Optimized sidebar + main content (2/10 split)
- **Large (1280px+):** Main content uses 2-column grid

### 🎪 Interactive Components

**Modal System Architecture:**
```javascript
function Modal({ open, title, children, onClose, actions }) {
  // Escape key handling
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button onClick={onClose}>✕</button>
          </div>
          {/* Body */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Toast Notification System:**
```javascript
// Toast state management
const [toast, setToast] = useState(null);

// Auto-dismiss functionality
function showToast(type, text, duration = 2500) {
  setToast({ type, text });
  setTimeout(() => setToast(null), duration);
}

// Toast component rendering
{toast && (
  <div className={classNames(
    "fixed top-3 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border shadow",
    toast.type === "success" && "bg-emerald-500/10 border-emerald-700 text-emerald-200",
    toast.type === "info" && "bg-sky-500/10 border-sky-700 text-sky-200", 
    toast.type === "error" && "bg-rose-500/10 border-rose-700 text-rose-200"
  )}>
    {toast.text}
  </div>
)}
```

## 💾 Data Management

### 🗄️ LocalStorage Implementation

**Storage Schema:**
```javascript
// Company data structure
localStorage.setItem("company", JSON.stringify({
  name: "Company Name",
  vat: "999999999",
  doy: "Tax Office",
  address: "Full Address",
  phone: "Phone Number", 
  email: "Email Address",
  iban: "Bank Account",
  contact: "Contact Person"
}));

// Customers array structure
localStorage.setItem("customers", JSON.stringify([
  {
    id: "c1",        // Unique identifier
    name: "Customer Name",
    vat: "VAT Number", 
    doy: "Tax Office",
    address: "Customer Address"
  }
]));

// Items/Services array structure  
localStorage.setItem("items", JSON.stringify([
  {
    id: "i1",              // Unique identifier
    code: "ITEM-001",      // Item code
    description: "Item Description",
    unitPrice: 100.00,    // Price per unit
    vatRate: 24           // VAT percentage
  }
]));
```

**Persistence Hooks:**
```javascript
// Load data on component mount
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

// Save data on state changes
useEffect(() => {
  try {
    localStorage.setItem("company", JSON.stringify(company));
  } catch (err) {
    console.warn("Failed to save company data", err);
  }
}, [company]);

useEffect(() => {
  try {
    localStorage.setItem("customers", JSON.stringify(customers));
  } catch (err) {
    console.warn("Failed to save customers data", err);
  }
}, [customers]);

useEffect(() => {
  try {
    localStorage.setItem("items", JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to save items data", err);
  }
}, [items]);
```

### 🧮 Calculation Engine

**Line Enrichment Process:**
```javascript
const enrichedLines = useMemo(() => {
  return lines.map((line) => {
    // 1. Find associated item
    const item = items.find((i) => i.id === line.itemId);
    
    // 2. Parse quantities and prices
    const qty = Number(line.qty) || 0;
    const unit = item?.unitPrice ?? 0;
    const vatRate = item?.vatRate ?? 24;
    
    // 3. Calculate line totals
    const net = unit * qty;                    // Net amount
    const vat = net * (vatRate / 100);         // VAT amount
    
    // 4. Return enriched line
    return { 
      ...line,    // Original line data
      item,       // Full item object
      qty,        // Parsed quantity
      unit,       // Unit price
      net,        // Net total
      vat,        // VAT total
      vatRate     // VAT rate
    };
  });
}, [lines, items]);
```

**Total Calculation with Discount:**
```javascript
const totals = useMemo(() => {
  // 1. Sum all line amounts
  const netSum = enrichedLines.reduce((sum, line) => sum + line.net, 0);
  const vatSum = enrichedLines.reduce((sum, line) => sum + line.vat, 0);
  
  // 2. Apply discount
  const discountRate = Number(invoice.discountRate) || 0;
  const discountFactor = 1 - discountRate / 100;
  
  // 3. Calculate final amounts
  const netAfter = netSum * discountFactor;      // Net after discount
  const vatAfter = vatSum * discountFactor;      // VAT after discount  
  const discountAmount = netSum - netAfter;      // Discount amount
  const gross = netAfter + vatAfter;             // Final total
  
  return { 
    net: netSum,           // Original net
    vat: vatSum,           // Original VAT
    discountRate,          // Discount percentage
    discountAmount,        // Discount in euros
    netAfter,             // Net after discount
    vatAfter,             // VAT after discount
    gross                 // Final total
  };
}, [enrichedLines, invoice.discountRate]);
```

## 🌐 Build & Deployment

### 🔧 Build Configuration

**Vite Configuration (`vite.config.ts`):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['tailwindcss']
        }
      }
    }
  }
})
```

**TypeScript Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Tailwind Configuration (`tailwind.config.cjs`):**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./final_invoice_app.jsx"  // Include root JSX file
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

**PostCSS Configuration (`postcss.config.cjs`):**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},    // Note: Classic plugin, not @tailwindcss/postcss
    autoprefixer: {}
  }
}
```

### 🚀 Deployment Architecture

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev", 
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {},
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

**Build Process:**
1. **TypeScript Compilation:** `tsc -b` (Type checking)
2. **Vite Build:** Bundle assets and optimize
3. **Asset Generation:** 
   - `index.html` (0.46 kB)
   - `index-*.css` (15.59 kB → 3.86 kB gzipped)
   - `index-*.js` (219.83 kB → 66.36 kB gzipped)
4. **Deployment:** Upload to Vercel edge network

**Performance Optimizations:**
- **Code Splitting:** Automatic by Vite
- **Tree Shaking:** Remove unused code
- **Minification:** esbuild minifier
- **Gzip Compression:** ~70% size reduction
- **CDN Distribution:** Global edge deployment

## 📊 Performance Analysis

### ⚡ Bundle Size Breakdown

| Asset Type | Size (Uncompressed) | Size (Gzipped) | Percentage |
|------------|-------------------|----------------|------------|
| **JavaScript** | 219.83 kB | 66.36 kB | ~85% |
| **CSS** | 15.59 kB | 3.86 kB | ~12% |
| **HTML** | 0.46 kB | 0.30 kB | ~3% |
| **Total** | 235.88 kB | 70.52 kB | 100% |

### 🎯 Performance Metrics

**Build Performance:**
- ⚡ **Build Time:** 1.89 seconds
- 🔄 **Hot Reload:** <100ms
- 📦 **Bundle Generation:** <500ms
- 🌐 **Deployment Time:** ~10 seconds

**Runtime Performance:**
- 🚀 **Initial Load:** <2 seconds (estimated)
- 💫 **Time to Interactive:** <3 seconds (estimated)
- 🔄 **Route Transitions:** Instant (SPA)
- 💾 **LocalStorage Ops:** <10ms

## 🔒 Security Considerations

### 🛡️ Client-Side Security

**Data Protection:**
- ✅ **LocalStorage Only:** No sensitive data transmission
- ✅ **Input Sanitization:** React's built-in XSS protection
- ✅ **No Eval:** No dynamic code execution
- ✅ **HTTPS Only:** Secure transmission (Vercel)

**Header Security:**
- ✅ **X-Frame-Options:** SAMEORIGIN (clickjacking protection)
- ⚠️ **CSP:** Not implemented (future enhancement)
- ⚠️ **HSTS:** Vercel default (minimal configuration)

**Potential Vulnerabilities:**
- ⚠️ **LocalStorage Access:** Data accessible via DevTools
- ⚠️ **No Authentication:** Public access to application
- ⚠️ **No Data Validation:** Client-side only validation

### 🔐 Recommended Security Enhancements

1. **Content Security Policy (CSP)**
2. **Input Validation Library** (Zod)
3. **User Authentication** (Auth0/Firebase)
4. **Data Encryption** (for sensitive information)
5. **Rate Limiting** (for production API)

## 🧪 Testing Strategy

### 🔬 Current Testing Status

**Implemented:**
- ✅ **ESLint:** Code quality checks
- ✅ **TypeScript:** Compile-time type checking
- ✅ **Manual Testing:** User acceptance testing

**Missing (Recommended):**
- ❌ **Unit Tests:** Jest + React Testing Library
- ❌ **Integration Tests:** Component interaction tests
- ❌ **E2E Tests:** Playwright/Cypress automation
- ❌ **Performance Tests:** Lighthouse CI
- ❌ **Accessibility Tests:** axe-core integration

### 📋 Recommended Testing Implementation

**Test Structure:**
```
src/
├── __tests__/              # Test files
│   ├── components/         # Component tests
│   ├── utils/             # Utility function tests
│   ├── integration/       # Integration tests
│   └── e2e/              # End-to-end tests
├── __mocks__/             # Mock implementations
└── test-utils/            # Testing utilities
```

**Sample Test Cases:**
1. **VAT Calculation Tests**
2. **Modal Interaction Tests**  
3. **LocalStorage Persistence Tests**
4. **Form Validation Tests**
5. **myDATA Payload Generation Tests**

## 🔮 Future Technical Enhancements

### 🎯 High Priority

1. **Real myDATA Integration**
   - API authentication
   - Official endpoint integration
   - Error handling & validation

2. **State Management Enhancement**
   - Zustand or Redux Toolkit
   - Optimistic updates
   - Undo/redo functionality

3. **Form Validation**
   - React Hook Form integration
   - Zod schema validation
   - Real-time validation feedback

### 🚀 Medium Priority

4. **PDF Generation**
   - jsPDF or Puppeteer integration
   - Custom invoice templates
   - Print optimization

5. **Database Integration**
   - PostgreSQL/MongoDB backend
   - Real-time synchronization
   - Multi-user support

6. **API Backend**
   - Node.js/Express server
   - Authentication & authorization
   - Data validation & sanitization

### 💡 Low Priority

7. **Advanced Features**
   - Multi-language support (i18next)
   - Advanced reporting & analytics
   - Email integration (SendGrid)
   - Mobile app (React Native)

---

**Document Version:** 1.0  
**Last Updated:** September 4, 2025  
**Author:** theofylaktos99@gmail.com
