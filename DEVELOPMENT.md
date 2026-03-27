# 👨‍💻 Development Guide

Complete development documentation for contributors.

---

## 📁 Project Structure

```
myDataInvoiceApp (monorepo, npm workspaces)
├── packages/
│   ├── core/                         # Shared code
│   │   ├── backend/
│   │   │   ├── aade-backend-standalone.cjs   # Backend server
│   │   │   └── api.js                        # API implementations
│   │   ├── src/
│   │   │   ├── components/           # Shared React components
│   │   │   ├── utils/                # Utility functions
│   │   │   └── hooks/                # Custom React hooks
│   │   └── package.json
│   │
│   ├── italian-corner/               # Client: Italian Corner (Standard)
│   │   ├── src/
│   │   │   ├── main.jsx
│   │   │   ├── branches/             # Multi-branch config
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── assets/
│   │   ├── vite.config.js
│   │   ├── electron.js               # Electron main process
│   │   └── package.json
│   │
│   ├── kandavlos/                    # Client: Kandavlos (Restaurant)
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── seg-advanced/                 # Client: Italian Corner (Advanced)
│   │   ├── src/                      # Enhanced components
│   │   ├── backendaade/              # Custom backend
│   │   ├── DELIVERY/                 # Auto-update scripts
│   │   ├── docs/                     # GitHub Pages
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   └── papadomichelakis/             # Client: Τεντοπέργκολες
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   └── css/
│       ├── final_invoice_app.jsx     # Main app component
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                      # Root workspace config
├── README.md
├── QUICKSTART.md
├── CLIENTS.md
├── MIGRATION.md
├── DEVELOPMENT.md                   # This file
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/theofylaktos99/myDataInvoiceApp.git
cd myDataInvoiceApp
npm install
```

### 2. Understand npm Workspaces
This is a **monorepo** using npm workspaces. Run commands from root:

```bash
# Run in specific package
npm run dev --workspace=@mydata/italian-corner

# Or use shorthand from root scripts
npm run dev:italian-corner
```

### 3. Development Environment

```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend
npm run dev:italian-corner

# VS Code: Open multiple terminals
# Terminal → New Terminal (repeat)
```

---

## 🔧 Development Workflow

### Making Changes

**Backend Changes:**
```bash
# Edit: packages/core/backend/
# Changes reload automatically (backend restarts on file change)
# Test via: curl http://localhost:3000/api/...
```

**Frontend Changes:**
```bash
# Edit: packages/italian-corner/src/
# Changes reload instantly (HMR - Hot Module Replacement)
# Browser updates automatically on save
```

**Shared Code Changes:**
```bash
# Edit: packages/core/src/
# All clients using shared code must rebuild
npm run build:italian-corner
npm run build:kandavlos
```

### Testing Your Changes

```bash
# 1. Manual testing
npm run dev:italian-corner
# → Test in browser

# 2. Build test
npm run build:italian-corner
npm run preview:italian-corner

# 3. Build all clients
npm run build-all

# 4. Lint (if configured)
npm run lint --workspace=@mydata/italian-corner
```

---

## 📦 Package Scripts Reference

### All Clients (Root Level)

```bash
# Development
npm run dev:italian-corner
npm run dev:kandavlos
npm run dev:seg-advanced
npm run dev:papadomichelakis

# Build
npm run build:italian-corner
npm run build:kandavlos
npm run build:seg-advanced
npm run build:papadomichelakis
npm run build-all

# Desktop (Electron)
npm run electron:italian-corner
npm run electron:kandavlos

# Backend
npm run backend
```

### Individual Package Commands

```bash
# From root, run package-specific commands:
npm run [script] --workspace=@mydata/italian-corner

# Examples:
npm run dev --workspace=@mydata/italian-corner          # Start dev
npm run build --workspace=@mydata/italian-corner        # Build
npm run preview --workspace=@mydata/italian-corner      # Preview build
npm run lint --workspace=@mydata/italian-corner         # Lint (if available)
```

---

## 🏗️ Adding a New Client

### Step 1: Create Package Structure
```bash
mkdir -p packages/new-client/src
mkdir -p packages/new-client/assets
```

### Step 2: Create package.json
```json
{
  "name": "@mydata/new-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@mydata/core": "*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

### Step 3: Create Vite Config
```javascript
// packages/new-client/vite.config.js
import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
};
```

### Step 4: Create Main Files
```bash
packages/new-client/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── App.css
└── branches/
    └── new-branch.js
```

### Step 5: Update Root package.json
```json
{
  "scripts": {
    "dev:new-client": "npm run dev --workspace=@mydata/new-client",
    "build:new-client": "npm run build --workspace=@mydata/new-client"
  }
}
```

### Step 6: Test
```bash
npm install
npm run dev:new-client
```

---

## 🔄 Git Workflow

### Local Development
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add packages/italian-corner/src/MyComponent.jsx
git commit -m "feat: Add MyComponent"

# Keep updated
git pull origin main
```

### Pushing Changes
```bash
# Push branch
git push origin feature/my-feature

# Create Pull Request on GitHub
# → Request review
# → Merge to main
```

### Commit Message Format
```
type(scope): subject

body (optional)
footer (optional)

Examples:
- feat(italian-corner): Add GSIS VAT lookup
- fix(core): Fix invoice numbering
- docs(clients): Update client documentation
- refactor(seg-advanced): Improve component structure
```

Type options: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 🧪 Testing

### Manual Testing
```bash
# Start backend + client
npm run backend &
npm run dev:italian-corner

# Test features in browser
# - Create invoice
# - Add items
# - Calculate totals
# - Export PDF
# - Submit to myDATA (mock)
```

### Automated Testing (If Configured)
```bash
npm run test --workspace=@mydata/italian-corner
npm run test:all
```

---

## 🐛 Debugging

### Browser DevTools
```javascript
// Add debugging to React components
console.log('State:', state);
console.error('Error:', error);

// Use React DevTools browser extension
// https://github.com/facebook/react-devtools
```

### Backend Debugging
```bash
# Start with debug logging
DEBUG=* npm run backend

# Or in code:
console.log('Request:', req.body);
```

### Network Requests
```bash
# Check API calls
curl -X GET http://localhost:3000/api/customers

# With body
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

---

## 📚 Shared Code

### Using Shared Components
```javascript
// In any client package
import { InvoiceForm } from '@mydata/core';

export default function MyClient() {
  return <InvoiceForm />;
}
```

### Adding to Shared Code
```bash
# 1. Add component to packages/core/src/components/
# 2. Export from packages/core/src/index.js
# 3. Run npm install (re-link workspaces)
# 4. Use in any client
```

### Core Package Structure
```
packages/core/
├── backend/
│   ├── aade-backend-standalone.cjs
│   └── api.js
├── src/
│   ├── components/
│   │   ├── InvoiceForm.jsx
│   │   ├── CustomerManager.jsx
│   │   └── ...
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── ...
│   ├── hooks/
│   │   ├── useInvoice.js
│   │   └── ...
│   └── index.js
└── package.json
```

---

## 📋 Environment Variables

Create `.env` files in each package:

```bash
# packages/italian-corner/.env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="Italian Corner"

# Backend environment
# packages/core/backend/.env
PORT=3000
NODE_ENV=development
DEBUG=app:*
```

---

## 🚀 Building for Production

### Build Single Client
```bash
npm run build:seg-advanced
# Output: packages/seg-advanced/dist/
```

### Build All Clients
```bash
npm run build-all
```

### Build Electron Desktop App
```bash
npm run electron:italian-corner
# Output: packages/italian-corner/dist/
```

### Production Checklist
- [ ] Run `npm run build-all`
- [ ] Verify no build errors
- [ ] Test build output locally
- [ ] Run backend service
- [ ] Test in production environment
- [ ] Commit & push changes

---

## 📞 Troubleshooting

### Issue: Package not found
```bash
# Solution: Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use
```bash
# Change port
PORT=3001 npm run backend
VITE_PORT=5174 npm run dev:italian-corner
```

### Issue: Changes not reflecting
```bash
# Clear build cache
rm -rf packages/italian-corner/dist
npm run build:italian-corner

# Or restart dev server
# Ctrl+C and npm run dev:italian-corner
```

### Issue: Workspace not found
```bash
# Verify package.json exists with correct "name"
cat packages/new-client/package.json | grep '"name"'

# Should output: "@mydata/new-client"
```

---

## 🎯 Next Steps

- [ ] Understand monorepo structure
- [ ] Set up development environment
- [ ] Make your first commit
- [ ] Add a feature to a client
- [ ] Create a new client
- [ ] Deploy to production

**Good luck! Happy coding! 🚀**
