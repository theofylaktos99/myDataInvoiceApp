# 🧾 Invoice App - myDATA Integration MVP

> **Πλήρης εφαρμογή τιμολόγησης με προσομοίωση myDATA integration για ελληνικές επιχειρήσεις**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-00C7B7?style=for-the-badge)](https://invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app)
[![Tech Stack](https://img.shields.io/badge/⚛️_React_19-TypeScript-61DAFB?style=for-the-badge)](https://react.dev/)
[![Framework](https://img.shields.io/badge/⚡_Vite_7.1-Build_Tool-646CFF?style=for-the-badge)](https://vitejs.dev/)
[![Styling](https://img.shields.io/badge/🎨_Tailwind_CSS-Utility_First-06B6D4?style=for-the-badge)](https://tailwindcss.com/)

## 📋 Περιγραφή Project

Μια **πλήρης εφαρμογή τιμολόγησης MVP** που προσομοιώνει την ενσωμάτωση με το myDATA της ΑΑΔΕ. Αναπτύχθηκε για ελληνικές επιχειρήσεις με στόχο την απλοποίηση της διαδικασίας έκδοσης παραστατικών.

### 🎯 Κύρια Χαρακτηριστικά

- ✅ **Ελληνικό UI** - Πλήρως μεταφρασμένη διεπαφή
- ✅ **myDATA Mock Integration** - Προσομοίωση αποστολής στη myDATA
- ✅ **PDF Preview** - Προεπισκόπηση τιμολογίου
- ✅ **Dark Theme** - Σύγχρονο σκοτεινό θέμα
- ✅ **Responsive Design** - Λειτουργεί σε όλες τις συσκευές
- ✅ **Local Storage** - Αποθήκευση δεδομένων τοπικά
- ✅ **VAT Calculations** - Αυτόματοι υπολογισμοί ΦΠΑ
- ✅ **Customer & Items Management** - Διαχείριση πελατών και ειδών

## 🏗️ Αρχιτεκτονική Project

### 📁 Δομή Αρχείων

```
C:\DEV PORTOFOLIO\INVOICE APP/
├── 📄 final_invoice_app.jsx      # Κύρια εφαρμογή (1,206 γραμμές)
├── 📁 src/
│   ├── 🎯 App.tsx                # TypeScript wrapper
│   ├── 🎨 App.css               # Component styles  
│   ├── 🎨 index.css             # Tailwind directives
│   ├── 🚀 main.tsx              # React entry point
│   ├── 📝 final_invoice_app.d.ts # TypeScript definitions
│   ├── 🌍 vite-env.d.ts         # Vite environment types
│   └── 📁 assets/               # Static assets
├── 📁 dist/                     # Production build
│   ├── 📄 index.html            # Entry HTML (0.46 kB)
│   ├── 🖼️ vite.svg             # Vite logo
│   └── 📁 assets/
│       ├── 🎨 index-*.css       # Bundled CSS (15.59 kB)
│       └── 📦 index-*.js        # Bundled JS (219.83 kB)
├── ⚙️ Configuration Files
│   ├── 📦 package.json          # Dependencies & scripts
│   ├── 🎨 tailwind.config.cjs   # Tailwind configuration
│   ├── 🔧 postcss.config.cjs    # PostCSS setup
│   ├── 🔧 vite.config.ts        # Vite configuration  
│   ├── 📘 tsconfig.json         # TypeScript config
│   ├── 🌐 vercel.json           # Vercel deployment
│   └── 🧹 eslint.config.js      # Code linting
└── 📝 README.md                 # Αυτό το αρχείο
```

### 🎯 Core Components Analysis

#### 🧾 `final_invoice_app.jsx` (Main Application)
**Μέγεθος:** 1,206 γραμμές | **Τύπος:** React Component | **Γλώσσα:** JSX

**Κύριες Λειτουργίες:**
- 📊 **Invoice Management** - Δημιουργία, επεξεργασία τιμολογίων
- 👥 **Customer Management** - CRUD operations για πελάτες  
- 🧩 **Items Management** - Διαχείριση ειδών/υπηρεσιών
- 💰 **VAT Calculations** - Αυτόματοι υπολογισμοί ΦΠΑ
- 🏢 **Company Settings** - Ρυθμίσεις εταιρείας
- 📋 **myDATA JSON Preview** - Προβολή payload για myDATA

**State Management:**
```jsx
// Company & Master Data
const [company, setCompany] = useState({...})
const [customers, setCustomers] = useState([...])  
const [items, setItems] = useState([...])

// Invoice State
const [invoice, setInvoice] = useState({...})
const [lines, setLines] = useState([...])
const [status, setStatus] = useState({...})

// UI State
const [toast, setToast] = useState(null)
const [openCustomers, setOpenCustomers] = useState(false)
// ... και άλλα modals
```

**Αξιοσημείωτα Features:**
- 🎭 **Modal System** - Generic modal component για dialogs
- 🍞 **Toast Notifications** - User feedback system
- 💾 **LocalStorage Persistence** - Αυτόματη αποθήκευση
- 🧮 **Advanced Calculations** - Με εκπτώσεις και ΦΠΑ
- 📋 **Clipboard Integration** - Copy JSON payload

#### 🎯 `src/App.tsx` (TypeScript Wrapper)
```tsx
// @ts-expect-error importing jsx file as module (no types)
import InvoiceApp from '../final_invoice_app.jsx';

export default function App() {
  return (
    <div className="w-full h-full">
      <InvoiceApp />
    </div>
  );
}
```

**Σκοπός:** Wrapper component που επιτρέπει την εισαγωγή JSX αρχείου σε TypeScript project

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 📊 Project Stats

- **📄 Lines of Code:** 1,206 (main app)
- **📦 Bundle Size:** 219.83 kB (66.36 kB gzipped)
- **⚡ Build Time:** ~2.5 seconds
- **🌐 Live Demo:** [invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app](https://invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app)

## 🎯 Key Features

✅ **Ελληνικό UI** - Complete Greek interface  
✅ **myDATA Mock** - Simulated AADE integration  
✅ **VAT Calculations** - Automatic tax calculations  
✅ **PDF Preview** - Invoice preview functionality  
✅ **Dark Theme** - Modern dark UI design  
✅ **Responsive** - Works on all devices  
✅ **Local Storage** - Persistent data storage  

## 💼 Commercial Value

### 🏷️ Pricing Strategy

| Package | Price | Target Market |
|---------|-------|---------------|
| **Basic License** | €299-499 | Freelancers |
| **Professional** | €799-1,299 | Small Business |
| **Enterprise** | €1,999+ | Large Companies |
| **SaaS Subscription** | €15-149/month | Recurring Revenue |

### 🎯 Target Customers

- 🏢 **Small-Medium Enterprises** (SMEs)
- 👨‍💼 **Freelancers & Consultants**  
- 🏪 **Retail Businesses**
- 🔧 **Service Providers**

## 📋 Full Documentation

For complete technical documentation, architecture details, and development guidelines, see:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

## 📞 Contact

**Developer:** theofylaktos99@gmail.com  
**Status:** 🎯 Ready for client demo & licensing  
**Last Updated:** September 4, 2025

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
