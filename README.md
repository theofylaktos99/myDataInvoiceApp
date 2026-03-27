# myDATA Invoice App - Monorepo

Multi-client invoice management system for Greek businesses with AADE myDATA integration.

## 📁 Structure

```
myDataInvoiceApp/
├── packages/
│   ├── core/                    # Shared code & backend
│   │   ├── backend/             # AADE Backend service
│   │   ├── src/components/      # React components
│   │   └── src/utils/           # Utilities
│   ├── italian-corner/          # Italian Corner (standard version)
│   │   ├── src/branches/        # Branch configs (central, villa1, villa2)
│   │   └── assets/              # Logos, icons
│   ├── kandavlos/               # Kandavlos Restaurant
│   │   ├── src/branches/        # Branch config
│   │   └── assets/              # Logos, icons
│   ├── seg-advanced/            # Italian Corner (advanced version with GSIS + Electron)
│   │   ├── src/                 # Enhanced components
│   │   ├── backendaade/         # Backend service
│   │   ├── DELIVERY/            # Auto-update package
│   │   └── docs/                # GitHub Pages docs
│   └── papadomichelakis/        # Τεντοπέργκολες Παπαδομιχελάκης
│       ├── src/                 # React + TypeScript components
│       ├── public/              # Static assets
│       └── final_invoice_app.jsx # Main invoice component
├── package.json                 # Workspaces config
└── README.md
```

## 🚀 Quick Start

```bash
# Install all dependencies
npm install

# Start backend
npm run backend

# Development - Choose a client:
npm run dev:italian-corner        # Standard version
npm run dev:seg-advanced          # Advanced version (GSIS + Electron)
npm run dev:kandavlos             # Kandavlos restaurant
npm run dev:papadomichelakis      # Tent pergolas
```

## 🔧 Build Commands

```bash
# Build specific clients:
npm run build:italian-corner
npm run build:seg-advanced
npm run build:kandavlos
npm run build:papadomichelakis

# Build all clients
npm run build-all

# Electron (Desktop) builds:
npm run electron:italian-corner
npm run electron:kandavlos

# Run backend standalone:
npm run backend
```

## 📦 Adding a New Client

1. Create new folder in `packages/`:
   ```
   packages/new-client/
   ├── src/branches/
   │   ├── index.js          # Export BRANCHES and CLIENT_CONFIG
   │   └── newBranch.js      # Branch configuration
   ├── assets/               # Logo, icons
   └── package.json          # Client-specific config
   ```

2. Copy template files from existing client

3. Update `src/branches/index.js` with your branches

4. Add scripts to root `package.json`:
   ```json
   "dev:new-client": "npm run dev --workspace=@mydata/new-client",
   "build:new-client": "npm run build --workspace=@mydata/new-client"
   ```

## 🏢 Current Clients

| Client | Type | Branches | Status | Notes |
|--------|------|----------|--------|-------|
| Italian Corner | Standard | central, villa1, villa2 | ✅ Active | Original version |
| SEG Advanced | Enterprise | Multi-branch | ✅ Active | GSIS Lookup, Electron, Auto-update |
| Kandavlos | Restaurant | kandavlos | ✅ Active | Single location |
| Παπαδομιχελάκης | Tent Pergolas | - | ✅ Active | Τεντοπέργκολες (new client) |

## 📋 Features

- ✅ AADE myDATA integration (production ready)
- ✅ GSIS VAT lookup
- ✅ Invoice cancellation
- ✅ PDF generation with QR codes
- ✅ Auto-update via GitHub releases
- ✅ Multi-branch support per client
- ✅ Customer management
- ✅ Invoice history & trash

## 🔐 Backend

The shared backend runs on `http://127.0.0.1:3000` and handles:
- AADE myDATA API communication
- GSIS VAT lookups
- Invoice submission & cancellation

Start with: `npm run backend`

## 📄 License

MIT
