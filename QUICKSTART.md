# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 🎯 Choose Your Path

### 👤 First Time Users
1. [Installation](#installation)
2. [Run a Client](#run-a-client)
3. [Build & Deploy](#build--deploy)

### 🚀 Developers
- Jump to [Development Workflow](#development-workflow)

### 🏭 DevOps/Deployment
- See [Production Deployment](#production-deployment)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/theofylaktos99/myDataInvoiceApp.git
cd myDataInvoiceApp

# 2. Install dependencies (uses npm workspaces)
npm install

# 3. Verify installation
npm run backend --help
```

**⚠️ Requirements:**
- Node.js 16+
- npm 7+ (for workspace support)
- Windows/macOS/Linux

---

## Run a Client

Pick **ONE** client to start:

### 1️⃣ Italian Corner (Standard)
```bash
npm run dev:italian-corner
```
Browser opens: `http://localhost:5173`

**Best for:** Standard invoice management with multiple branches

### 2️⃣ SEG Advanced (Recommended)
```bash
npm run dev:seg-advanced
```
Browser opens: `http://localhost:5173`

**Best for:** Production deployments (GSIS + Electron + Auto-update)

### 3️⃣ Kandavlos Restaurant
```bash
npm run dev:kandavlos
```
Browser opens: `http://localhost:5173`

**Best for:** Single location restaurants

### 4️⃣ Παπαδομιχελάκης (Τεντοπέργκολες)
```bash
npm run dev:papadomichelakis
```
Browser opens: `http://localhost:5173`

**Best for:** Standalone tent pergola business

---

## Backend

All clients use the same backend service:

```bash
# Terminal 1: Start backend (port 3000)
npm run backend

# Terminal 2: Start frontend client
npm run dev:italian-corner
```

Backend features:
- AADE myDATA API communication
- GSIS VAT validation
- Invoice submission & cancellation

---

## Build & Deploy

### Build Specific Client
```bash
npm run build:italian-corner
# Output: packages/italian-corner/dist/
```

### Build All Clients
```bash
npm run build-all
```

### Build Desktop App (Electron)
```bash
npm run electron:italian-corner
# Output: packages/italian-corner/dist/ (installer)
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Project overview & structure |
| [CLIENTS.md](./CLIENTS.md) | 📖 **Detailed client documentation** |
| [MIGRATION.md](./MIGRATION.md) | How repos were consolidated |
| [QUICKSTART.md](./QUICKSTART.md) | This file 👈 |

---

## Development Workflow

### Standard Pattern
```bash
# Terminal 1: Backend service
npm run backend

# Terminal 2: Frontend development
npm run dev:italian-corner

# Edit files → Auto-refresh on save
```

### Debug Mode
```bash
# Add debug logging:
DEBUG=* npm run dev:italian-corner

# Check backend logs:
curl http://localhost:3000/health
```

---

## Production Deployment

### Recommended: Use SEG Advanced
```bash
# 1. Build
npm run build:seg-advanced

# 2. Deploy static files
cp -r packages/seg-advanced/dist/* /var/www/html/

# 3. Run backend
npm run backend  # or use PM2, Docker, etc.
```

### Deploy with Docker
```bash
# Build image
docker build -t invoice-app .

# Run container
docker run -p 3000:3000 -p 5173:5173 invoice-app
```

### Deploy to GitHub Pages
```bash
npm run predeploy
npm run deploy
# Site: https://yourusername.github.io/myDataInvoiceApp
```

---

## 🐛 Common Issues

### `npm install` fails
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=3001 npm run backend
```

### Client not loading
```bash
# Clear browser cache
Press Ctrl+Shift+Delete

# Check logs
npm run dev:italian-corner -- --verbose

# Verify backend is running
curl http://localhost:3000
```

---

## 📞 Support

- **Issues**: Create an issue on GitHub
- **Docs**: See [CLIENTS.md](./CLIENTS.md) for detailed docs
- **Questions**: Check [README.md](./README.md)

---

## ✅ Next Steps

1. ✅ Install dependencies
2. ✅ Run a client
3. ✅ Create an invoice
4. ✅ Export to PDF
5. ✅ Submit via myDATA
6. ✅ Deploy! 🚀

**Happy invoicing!** 📄
