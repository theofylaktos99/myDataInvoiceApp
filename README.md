# myDATA Invoice App - Monorepo

Multi-client invoice management system for Greek businesses with AADE myDATA integration.

## 📁 Structure

```
myDataInvoiceApp/
├── packages/
│   ├── core/                    # Shared code
│   │   ├── backend/             # AADE Backend service
│   │   ├── src/components/      # React components
│   │   └── src/utils/           # Utilities
│   ├── italian-corner/          # Italian Corner client
│   │   ├── src/branches/        # Branch configs
│   │   └── assets/              # Logos, icons
│   ├── kandavlos/               # Kandavlos client
│   │   ├── src/branches/        # Branch configs
│   │   └── assets/              # Logos, icons
│   └── papadomichelakis/        # Παπαδομιχελάκης client
│       ├── src/branches/        # Branch configs
│       └── assets/              # Logos, icons
├── package.json                 # Workspaces config
└── README.md
```

## 🚀 Quick Start

```bash
# Install all dependencies
npm install

# Start backend
npm run backend

# Development (Italian Corner)
npm run dev:italian-corner

# Development (Kandavlos)
npm run dev:kandavlos

# Development (Παπαδομιχελάκης)
npm run dev:papadomichelakis
```

## 🔧 Build Commands

```bash
# Build Italian Corner
npm run build:italian-corner
npm run electron:italian-corner

# Build Kandavlos
npm run build:kandavlos
npm run electron:kandavlos

# Build Παπαδομιχελάκης
npm run build:papadomichelakis
npm run electron:papadomichelakis

# Build all clients
npm run build-all
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

| Client | Branches | Status |
|--------|----------|--------|
| Italian Corner | central, villa1, villa2 | ✅ Active |
| Kandavlos | kandavlos | ✅ Active |
| Παπαδομιχελάκης | papadomichelakis | ✅ Active |

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
