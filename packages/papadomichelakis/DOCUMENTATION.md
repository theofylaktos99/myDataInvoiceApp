## 🛠️ Tech Stack & Dependencies

### 📦 Core Technologies

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **React** | `^19.1.1` | UI Library | ✅ |
| **React DOM** | `^19.1.1` | DOM Rendering | ✅ |
| **TypeScript** | `~5.8.3` | Type Safety | ✅ |
| **Vite** | `^7.1.2` | Build Tool & Dev Server | ✅ |
| **Tailwind CSS** | `^3.4.17` | Utility-First CSS | ✅ |

### 🔧 Development Tools

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| **ESLint** | `^9.33.0` | Code Linting | ✅ |
| **PostCSS** | `^8.5.6` | CSS Processing | ✅ |
| **Autoprefixer** | `^10.4.21` | CSS Vendor Prefixes | ✅ |
| **TypeScript ESLint** | `^8.39.1` | TS Linting Rules | ✅ |

### 📊 Bundle Analysis

**Production Build Stats:**
```bash
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-sFd1uqN_.css   15.59 kB │ gzip:  3.86 kB  
dist/assets/index-C3ZM6Bj5.js   219.83 kB │ gzip: 66.36 kB
```

**Build Performance:** ⚡ Built in 1.89s

## 🚀 Installation & Setup

### 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** (for cloning)

### 🔽 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/invoice-app.git
cd invoice-app

# 2. Install dependencies  
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### 🌐 Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **Development** | `npm run dev` | Start Vite dev server |
| **Build** | `npm run build` | TypeScript compile + Vite build |
| **Preview** | `npm run preview` | Preview production build |
| **Lint** | `npm run lint` | Run ESLint checks |

## 🎨 UI/UX Features

### 🎭 Design System

**Color Palette:**
- 🌙 **Primary Dark:** Slate-950 (`#020617`)
- 🔹 **Secondary:** Slate-800 (`#1e293b`) 
- 🟢 **Success:** Emerald-400 (`#34d399`)
- 🔴 **Error:** Rose-400 (`#fb7185`)
- 🟡 **Warning:** Amber-400 (`#fbbf24`)
- 🔵 **Info:** Sky-400 (`#38bdf8`)

**Typography:**
- 📝 **Base Font:** System font stack
- 📏 **Scale:** 0.75rem - 1.125rem
- **⚖️ Weights:** 400 (normal), 500 (medium), 600 (semibold)

### 📱 Responsive Design

```css
/* Breakpoint Strategy */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */ 
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large */
```

**Layout Patterns:**
- 📱 **Mobile First:** Single column layout
- 💻 **Desktop:** Sidebar + main content grid
- 🖥️ **Large Screens:** Optimized spacing

### 🎪 Interactive Components

| Component | Description | Features |
|-----------|-------------|----------|
| **Modal System** | Generic modal with backdrop | ✅ Escape key, ✅ Click outside |
| **Toast Notifications** | User feedback system | ✅ Auto-dismiss, ✅ Type variants |
| **Form Controls** | Styled inputs & selects | ✅ Focus states, ✅ Validation |
| **Data Tables** | Master data management | ✅ CRUD operations, ✅ Sorting |

## 💰 Business Logic

### 🧮 VAT Calculation Engine

```javascript
// Core calculation logic
const enrichedLines = useMemo(() => {
  return lines.map((line) => {
    const item = items.find((i) => i.id === line.itemId);
    const qty = Number(line.qty) || 0;
    const unit = item?.unitPrice ?? 0;
    const vatRate = item?.vatRate ?? 24;
    const net = unit * qty;
    const vat = net * (vatRate / 100);
    return { ...line, item, qty, unit, net, vat, vatRate };
  });
}, [lines, items]);

// Totals with discount application
const totals = useMemo(() => {
  const netSum = enrichedLines.reduce((s, l) => s + l.net, 0);
  const vatSum = enrichedLines.reduce((s, l) => s + l.vat, 0);
  const discountRate = Number(invoice.discountRate) || 0;
  const discountFactor = 1 - discountRate / 100;
  const netAfter = netSum * discountFactor;
  const vatAfter = vatSum * discountFactor;
  const gross = netAfter + vatAfter;
  return { net: netSum, vat: vatSum, discountRate, netAfter, vatAfter, gross };
}, [enrichedLines, invoice.discountRate]);
```

### 📊 myDATA Integration Schema

**Supported Document Types:**
- `1.1` - Τιμολόγιο Παροχής Υπηρεσιών
- `1.2` - Τιμολόγιο Πώλησης  
- `5.2` - Πιστωτικό Τιμολόγιο

**JSON Payload Structure:**
```json
{
  "header": {
    "series": "A",
    "aa": 1,
    "issueDate": "2025-09-04",
    "invoiceType": "1.1"
  },
  "issuer": {
    "vatNumber": "999999999",
    "country": "GR", 
    "branch": "0"
  },
  "counterparty": {
    "vatNumber": "888888888",
    "country": "GR",
    "branch": "0"
  },
  "details": [...],
  "invoiceSummary": {
    "netValue": 400.00,
    "vatAmount": 96.00,
    "totalAmount": 496.00
  }
}
```

## 💾 Data Persistence

### 🗄️ LocalStorage Schema

**Storage Keys:**
- `company` - Company information object
- `customers` - Array of customer objects  
- `items` - Array of item/service objects

**Data Validation:**
```javascript
useEffect(() => {
  try {
    const savedCompany = localStorage.getItem("company");
    if (savedCompany) setCompany(JSON.parse(savedCompany));
    // ... other data loading
  } catch (err) {
    console.warn("Failed to load from localStorage", err);
  }
}, []);
```

## 🌐 Deployment & Production

### 🚀 Vercel Deployment

**Live URL:** [https://invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app](https://invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app)

**Deployment Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist", 
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Build Stats:**
- ⚡ **Build Time:** ~2.5 seconds
- 📦 **Bundle Size:** 219.83 kB (66.36 kB gzipped)
- 🎨 **CSS Size:** 15.59 kB (3.86 kB gzipped)
- 🌍 **CDN:** Global edge deployment

### 🔒 Security Headers

```json
{
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

## 🐛 Troubleshooting & Debug

### ⚠️ Common Issues

| Issue | Solution | Status |
|-------|----------|--------|
| **PostCSS Config Conflicts** | Use `.cjs` extensions | ✅ Fixed |
| **useState Initialization** | Declare before useEffect | ✅ Fixed |
| **Tailwind Content Paths** | Include root JSX files | ✅ Fixed |
| **TypeScript JSX Import** | Use @ts-expect-error | ✅ Working |

### 🔧 Development Commands

```bash
# Clear build cache
rm -rf dist node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for updates
npm outdated

# Audit security
npm audit
```

## 📊 Performance Metrics

### ⚡ Lighthouse Scores (Estimated)

| Metric | Score | Status |
|--------|-------|--------|
| **Performance** | 95+ | 🟢 Excellent |
| **Accessibility** | 90+ | 🟢 Good |
| **Best Practices** | 100 | 🟢 Perfect |
| **SEO** | 85+ | 🟡 Good |

### 📈 Bundle Analysis

**Largest Dependencies:**
1. **React + React DOM** (~45% of bundle)
2. **Tailwind CSS** (~25% of bundle) 
3. **Application Logic** (~30% of bundle)

## 🔮 Future Roadmap

### 🎯 Planned Features

- [ ] **Real myDATA API Integration**
- [ ] **User Authentication System**
- [ ] **Multi-tenant Support**
- [ ] **PDF Generation Library**
- [ ] **Email Integration**
- [ ] **Advanced Reporting**
- [ ] **Mobile App (React Native)**
- [ ] **API Backend (Node.js)**

### 🔧 Technical Improvements

- [ ] **Unit Testing** (Jest + Testing Library)
- [ ] **E2E Testing** (Playwright)
- [ ] **State Management** (Zustand/Redux)
- [ ] **Form Validation** (React Hook Form + Zod)
- [ ] **API Layer** (TanStack Query)
- [ ] **Internationalization** (i18next)

## 👥 Contributing

### 🤝 Development Guidelines

1. **Code Style:** Follow ESLint configuration
2. **Commits:** Use conventional commit messages
3. **Testing:** Add tests for new features  
4. **Documentation:** Update README for changes

### 🐛 Bug Reports

Please include:
- Browser & version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## 📜 License & Legal

### ⚖️ License Information

**Type:** Proprietary Software
**Owner:** theofylaktos99@gmail.com
**Usage:** Commercial license required for production use

### 🏛️ Compliance Notes

- **GDPR:** No personal data stored remotely
- **myDATA:** Mock integration only - requires official API access
- **Tax Compliance:** Consult tax advisor for production use

---

## 📞 Support & Contact

**Developer:** theofylaktos99@gmail.com  
**Live Demo:** [Invoice App](https://invoice-ajns9k8tb-theofylaktos99s-projects.vercel.app)  
**Last Updated:** September 4, 2025

---

*🎯 **Ready for client demonstration and commercial licensing discussion** 🎯*
