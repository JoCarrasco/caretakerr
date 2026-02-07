# CareTaker 🏥

A cross-platform, self-hostable elderly home management system.

## Features

- 📦 **Inventory Management** - Track medicines and supplies with low stock alerts
- 📅 **Schedule & Calendar** - Manage caretaker shifts with visual calendar
- 💊 **Medicine Reminders** - Medication schedules and administration tracking
- ✅ **Tasks & Activities** - Task assignment and activity scheduling
- 💰 **Flexible Payroll** - Multi-rate work hours tracking with special day bonuses
- 📴 **Offline Support** - Work offline with automatic sync when reconnected

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Offline**: IndexedDB + Service Workers
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ (or use Docker)
- npm or yarn

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd caretakerr
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the database** (using Docker)
   ```bash
   docker-compose up -d postgres
   ```

4. **Run database migrations**
   ```bash
   npm run migrate --workspace=backend
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API: http://localhost:3001
   - Frontend App: http://localhost:5173

### Docker Deployment

**Linux/macOS (Production)**
```bash
docker-compose up -d
```

**Windows (Self-hosted)**
See [docs/windows-deployment.md](docs/windows-deployment.md)

## Project Structure

```
caretakerr/
├── backend/          # Node.js/Express API
├── frontend/         # React PWA
├── docker/           # Docker configurations
├── docs/             # Documentation
└── package.json      # Root workspace config
```

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## License

MIT License - Open Source

## Support

For issues and questions, please open a GitHub issue.
