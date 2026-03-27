# myDATA Invoice App - Unified Monorepo 📋

Multi-client invoice management system for Greek businesses with **AADE myDATA integration**.

> ⭐ **New here?** Start with [QUICKSTART.md](./QUICKSTART.md) (5 min)  
> 🗺️ **Need documentation?** See [INDEX.md](./INDEX.md) (complete guide)

---

## 🎯 What Is This Project?

This repository consolidates **4 invoice management applications** into one **unified monorepo using npm workspaces**.

All clients share the same core infrastructure while maintaining independent frontends for different business types.

**Perfect for:**
- Restaurants 🍽️
- Hotels / Accommodation 🏨
- Service businesses 🔧
- Retailers 🛍️
- Any Greek business needing AADE compliance ✅

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Choose a client and run it
npm run dev:italian-corner          # Restaurants (standard)
npm run dev:seg-advanced            # Restaurants (advanced with Electron)
npm run dev:kandavlos               # Another restaurant
npm run dev:papadomichelakis        # Tent business

# 3. Backend (in another terminal)
npm run backend

# 4. Open browser: http://localhost:5173
```

**Done!** 🚀

For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)

---

## 📦 The 4 Clients in This Monorepo

### 1. Italian Corner (Standard) 🍝
- **Package**: `packages/italian-corner`
- **Version**: 1.2.0
- **Status**: ✅ Production
- **Location**: Multiple branches
- **Features**: Multi-branch invoicing

```bash
npm run dev:italian-corner
npm run build:italian-corner
npm run electron:italian-corner
```

### 2. SEG Advanced (Enterprise) 🚀
- **Package**: `packages/seg-advanced`
- **Version**: 1.0.0
- **Status**: ✅ Production
- **Location**: Multiple branches
- **Features**: GSIS lookup + Electron + Auto-update
- **Recommended for:** Production deployments

```bash
npm run dev:seg-advanced
npm run build:seg-advanced
```

### 3. Kandavlos 🏢
- **Package**: `packages/kandavlos`
- **Version**: 1.2.0
- **Status**: ✅ Active
- **Location**: Single location
- **Features**: Simple invoicing

```bash
npm run dev:kandavlos
npm run build:kandavlos
npm run electron:kandavlos
```

### 4. Παπαδομιχελάκης (Tent Pergolas) ⛺
- **Package**: `packages/papadomichelakis`
- **Version**: 0.1.0
- **Status**: ✅ Active
- **Tech**: React 19 + TypeScript
- **Features**: Standalone modern invoice app

```bash
npm run dev:papadomichelakis
npm run build:papadomichelakis
```

---

## 📁 Repository Structure

```
myDataInvoiceApp/
├── 📖 Documentation
│   ├── README.md              ← You are here
│   ├── QUICKSTART.md          ← Start here (5 min)
│   ├── INDEX.md               ← Find what you need
│   ├── CLIENTS.md             ← Client details
│   ├── DEVELOPMENT.md         ← Developer guide
│   └── MIGRATION.md           ← Consolidation info
│
├── 📦 Client Applications
│   ├── packages/core/                    # Shared code
│   ├── packages/italian-corner/         # Client 1
│   ├── packages/kandavlos/              # Client 2
│   ├── packages/seg-advanced/           # Client 3 (recommended)
│   └── packages/papadomichelakis/       # Client 4
│
└── ⚙️ Configuration
    ├── package.json           # Workspace config
    ├── .gitignore
    └── .git/
```

---

## ✨ Core Features (All Clients)

| Feature | Status | Notes |
|---------|--------|-------|
| **AADE myDATA Integration** | ✅ | Production ready |
| **GSIS VAT Lookup** | ✅ | Auto-validation |
| **PDF Generation** | ✅ | With QR codes |
| **Invoice Management** | ✅ | History, drafts, trash |
| **Customer Database** | ✅ | Full CRUD |
| **Multi-branch Support** | ✅ | Per client config |
| **Electron Desktop** | ✅ | italian-corner & kandavlos |
| **Auto-update** | ✅ | seg-advanced only |
| **Dark/Light Theme** | ✅ | UI configurable |
| **Mobile Responsive** | ✅ | Works on tablets |

---

## 🔧 Commands Reference

### Development
```bash
npm run dev:italian-corner          # Start Italian Corner
npm run dev:seg-advanced            # Start SEG Advanced
npm run dev:kandavlos               # Start Kandavlos
npm run dev:papadomichelakis        # Start Tent Pergolas
npm run backend                     # Start backend service
```

### Building
```bash
npm run build:italian-corner        # Build single client
npm run build-all                   # Build all 4 clients
npm run electron:italian-corner     # Build desktop app
```

### Other
```bash
npm install                         # Install all dependencies
npm run preview:italian-corner      # Preview production build
```

For more commands, see [DEVELOPMENT.md](./DEVELOPMENT.md#-package-scripts-reference)

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 5,554+ |
| **Main Packages** | 5 |
| **Client Apps** | 4 |
| **Technology** | React 19, TypeScript, Vite, Express |
| **Node Version** | 16+ |
| **npm Version** | 7+ |
| **License** | MIT |

---

## 🚀 Deployment

### Quick Deploy
```bash
# Build all clients
npm run build-all

# All output in packages/*/dist/
# Deploy dist folders to web server
```

### Production Checklist
- [ ] `npm install`
- [ ] `npm run build-all`
- [ ] Test builds locally
- [ ] Run backend service
- [ ] Configure environment variables
- [ ] Deploy to server
- [ ] Test in production

For detailed deployment, see:
- [QUICKSTART.md - Production Deployment](./QUICKSTART.md#production-deployment)
- [packages/seg-advanced/DEPLOYMENT_GUIDE.md](./packages/seg-advanced/DEPLOYMENT_GUIDE.md)

---

## 📚 Complete Documentation

| File | Purpose | Read Time |
|------|---------|-----------|
| **[QUICKSTART.md](./QUICKSTART.md)** ⭐ | Get running immediately | 5 min |
| **[INDEX.md](./INDEX.md)** 🗺️ | Navigate all docs | 5 min |
| **[CLIENTS.md](./CLIENTS.md)** 📋 | Each client explained | 20 min |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** 👨‍💻 | Developer deep dive | 30 min |
| **[MIGRATION.md](./MIGRATION.md)** 📝 | How repos consolidated | 10 min |

---

## 🏗️ Architecture

### Monorepo Structure
```
npm workspaces
   ↓
packages/
   ├── core/              All clients use this
   ├── italian-corner/    Independent app
   ├── kandavlos/         Independent app
   ├── seg-advanced/      Independent app
   └── papadomichelakis/  Independent app
```

### Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Build Tool**: Vite
- **Desktop**: Electron
- **Database**: Local (browser storage / backend)
- **API Integration**: AADE myDATA, GSIS

---

## 🔐 Security Notes

- ✅ VAT numbers validated via GSIS
- ✅ Invoices signed with QR codes
- ✅ AADE myDATA API integration
- ⚠️ Backend should run on HTTPS in production
- ⚠️ Store credentials securely (use environment variables)

---

## 🆘 Common Issues

### Installation fails
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Change port
PORT=3001 npm run backend
VITE_PORT=5174 npm run dev:italian-corner
```

### More issues?
See [QUICKSTART.md - Common Issues](./QUICKSTART.md#-common-issues) or [DEVELOPMENT.md - Troubleshooting](./DEVELOPMENT.md#-troubleshooting)

---

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Test everything
5. Push and create a Pull Request

For detailed guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md)

---

## 📞 Support

- 📖 **Documentation**: Check [INDEX.md](./INDEX.md) first
- 🐛 **Issues**: Create an issue on GitHub
- 💬 **Questions**: Check [DEVELOPMENT.md - Troubleshooting](./DEVELOPMENT.md#-troubleshooting)

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) file

---

## 🎯 Next Steps

- [ ] Read [QUICKSTART.md](./QUICKSTART.md)
- [ ] Install dependencies
- [ ] Run first client
- [ ] Create your first invoice
- [ ] Deploy to production

---

**Version**: 1.0.0 (March 27, 2026)  
**Status**: ✅ Production Ready  
**Repository**: [GitHub](https://github.com/theofylaktos99/myDataInvoiceApp)

🚀 **Happy invoicing!**
