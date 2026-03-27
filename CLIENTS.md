# Invoice App Clients - Detailed Documentation

This monorepo contains multiple invoice management clients integrated into a single unified codebase.

## 📋 Clients Overview

### 1. Italian Corner (Standard) 🍝
**Package**: `packages/italian-corner`  
**Version**: 1.2.0  
**Status**: ✅ Active & Maintained

#### Description
The standard version of the Italian Corner invoice management system. Supports multiple branches and locations.

#### Features
- Multi-branch support (central, villa1, villa2)
- AADE myDATA integration
- Basic PDF generation
- Customer management
- Invoice history & draft management

#### Development
```bash
npm run dev:italian-corner
npm run build:italian-corner
npm run electron:italian-corner
```

#### Configuration
- **Branch Config**: `src/branches/index.js`
- **Client Assets**: `assets/`
- **Main Entry**: `src/main.jsx`

---

### 2. SEG Advanced (Enhanced Version) 🚀
**Package**: `packages/seg-advanced`  
**Version**: 1.0.0  
**Status**: ✅ Active & Recommended for Production

#### Description
Advanced version of Italian Corner with enhanced features, GSIS VAT lookup integration, Electron desktop support, and auto-update capability.

#### Features
- ✅ All standard features
- ✅ GSIS VAT lookup integration
- ✅ Electron desktop application (v1.1.0)
- ✅ Auto-update via GitHub releases (DELIVERY package)
- ✅ GitHub Pages deployment (`docs/` folder)
- ✅ Comprehensive documentation
- ✅ Multiple branches for Italian Corner group
- ✅ Advanced PDF generation with QR codes

#### Development
```bash
npm run dev:seg-advanced
npm run build:seg-advanced
```

#### Backend
```bash
node packages/seg-advanced/backendaade/aade-backend-stub.js
```

#### Deployment
```bash
# Deploy to GitHub Pages
npm run predeploy
npm run deploy
```

#### Structure
```
seg-advanced/
├── src/                    # React components
├── backendaade/           # Backend services
├── DELIVERY/              # Auto-update configuration
├── docs/                  # GitHub Pages deployment
├── API_DOCUMENTATION.md   # Detailed API docs
├── COMPONENT_ARCHITECTURE.md
├── DEPLOYMENT_GUIDE.md
├── DEVELOPER_EVALUATION.md
└── README.md
```

#### Important Files
- **documentation**: See `API_DOCUMENTATION.md` and `DEVELOPER_EVALUATION.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Build Process**: Uses Vite with environment-specific settings

---

### 3. Kandavlos 🏢
**Package**: `packages/kandavlos`  
**Version**: 1.2.0  
**Status**: ✅ Active

#### Description
Invoice management system for Kandavlos restaurant. Single location implementation.

#### Features
- Single branch/location support
- AADE myDATA integration
- Basic PDF generation
- Customer management
- Invoice history

#### Development
```bash
npm run dev:kandavlos
npm run build:kandavlos
npm run electron:kandavlos
```

#### Configuration
- **Branch Config**: `src/branches/kandavlos.js`
- **Client Assets**: `assets/`

---

### 4. Παπαδομιχελάκης (Tent Pergolas) ⛺
**Package**: `packages/papadomichelakis`  
**Version**: 0.1.0  
**Status**: ✅ Active (Standalone Implementation)

#### Description
Invoice application for Τεντοπέργκολες Παπαδομιχελάκης (tent pergola rental/sales business). Built with React + TypeScript using a monolithic component architecture.

#### Features
- Modern React 19 + TypeScript setup
- Tailwind CSS styling
- Local state management (no external store)
- Modal-based UI for data entry
- JSON-based data representation
- Mock myDATA integration
- Invoice generation with company/customer info
- VAT calculations
- Print-friendly styling

#### Development
```bash
npm run dev:papadomichelakis
npm run build:papadomichelakis
npm run lint:papadomichelakis
npm run preview:papadomichelakis
```

#### Company Details (Default)
- **Name**: Τεντοπέργκολες Παπαδομιχελάκης
- **VAT**: 801234567
- **Location**: Giampoudaki 43, Ρέθυμνο 74100
- **Contact**: Παπαδομιχελάκης Εμμανουήλ Κ.

#### Main Component
- **File**: `final_invoice_app.jsx` (1206 lines)
- **Architecture**: Single component with all invoice logic
- **State Management**: React hooks (useState, useReducer)
- **Styling**: Tailwind CSS with dark theme (slate-950)

#### Build Configuration
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **CSS**: PostCSS + Tailwind CSS

#### Structure
```
papadomichelakis/
├── src/
│   ├── App.tsx           # Main wrapper
│   ├── main.tsx          # Entry point
│   ├── App.css           # Component styles
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Type definitions
├── public/               # Static assets
├── final_invoice_app.jsx # Main invoice component (1206 lines)
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

#### Features
1. **Master Data Management**
   - Company information (name, VAT, contact details, IBAN)
   - Customer database with CRUD operations
   - Item/product catalog

2. **Invoice Operations**
   - Create invoices with line items
   - VAT calculation (per line)
   - Discount support
   - Draft saving and restoration

3. **User Interface**
   - Modal dialogs for data editing
   - Toast notifications
   - Responsive design
   - Dark theme optimized for usability

4. **Export & Reporting**
   - JSON preview (myDATA payload representation)
   - Print-friendly styling
   - Professional invoice layout

---

## 🔄 Migration from Standalone to Monorepo

All clients are now integrated into the monorepo while maintaining their independent functionality and configurations.

### Key Points
- Each client has its own `package.json` and scripts
- Shared code is in `packages/core/`
- Backend services can be run independently per client
- Build and dev commands are standardized in root `package.json`

---

## 🚀 Development Workflow

### Start Development for Specific Client
```bash
# Choose one:
npm run dev:italian-corner
npm run dev:seg-advanced
npm run dev:kandavlos
npm run dev:papadomichelakis

# Or run backend separately:
npm run backend
```

### Build All Clients
```bash
npm run build-all
```

### Build Specific Client
```bash
npm run build:kandavlos
```

---

## 📦 Shared Resources

All clients can use:
- `packages/core/src/components/` - Reusable React components
- `packages/core/src/utils/` - Utility functions
- `packages/core/backend/` - Backend services

---

## 🔐 Security & Configuration

Each client manages its own:
- **Company details** (VAT, contact info)
- **Branches/locations**
- **Assets** (logos, icons)
- **Environment variables** (.env files)
- **Build configuration** (Vite, Webpack, etc.)

---

## 📝 Notes

- **seg-advanced** is recommended for new deployments due to enhanced features and active maintenance
- **papadomichelakis** is a standalone implementation that can be refactored to use shared components
- All clients follow the same AADE myDATA API standards
- Regular updates are applied through GitHub releases with auto-update capability
