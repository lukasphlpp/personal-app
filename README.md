# Time Tracking Web App

Moderne Zeiterfassung und Mitarbeiterverwaltung als Web-Anwendung.

## 🚀 Features

- ✅ **Mitarbeiterverwaltung** - Mitarbeiter anlegen, bearbeiten, löschen
- ✅ **Kalender** - Urlaube und Arbeitszeiten planen
- ✅ **Kategorien** - Anpassbare Abwesenheitsarten
- ✅ **Multi-User** - Mehrere Benutzer gleichzeitig
- ✅ **Rollen-System** - Admin, Manager, Mitarbeiter
- ✅ **Datenbank** - PostgreSQL mit Prisma ORM
- ✅ **Authentication** - Sicheres Login-System

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **UI Components:** Lucide Icons, FullCalendar

## 📦 Installation

1. **Dependencies installieren:**
```bash
npm install
```

2. **Datenbank einrichten:**

Erstelle eine `.env` Datei (kopiere `.env.example`):
```bash
cp .env.example .env
```

Passe die `DATABASE_URL` an deine PostgreSQL-Datenbank an.

3. **Prisma Setup:**
```bash
npm run db:push
```

4. **Development Server starten:**
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## 🗄️ Datenbank

### PostgreSQL lokal installieren:

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Oder mit Chocolatey: `choco install postgresql`

**Alternative: Docker**
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Prisma Commands:

```bash
# Datenbank Schema pushen
npm run db:push

# Prisma Studio öffnen (GUI für Datenbank)
npm run db:studio
```

## 📁 Projekt-Struktur

```
time-tracking-web/
├── app/                    # Next.js App Directory
│   ├── api/               # API Routes
│   ├── (auth)/            # Auth Pages (Login, Register)
│   ├── (dashboard)/       # Dashboard Pages
│   ├── globals.css        # Global Styles
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Homepage
├── components/            # React Components
├── lib/                   # Utilities & Helpers
├── prisma/               # Prisma Schema & Migrations
│   └── schema.prisma     # Database Schema
├── public/               # Static Files
└── types/                # TypeScript Types
```

## 🔐 Authentication

Das Projekt nutzt NextAuth.js für Authentication:

- **Login/Register** System
- **Session Management**
- **Rollen-basierte Zugriffskontrolle**

## 🎨 UI Design

- **Dark Mode** Design
- **Responsive** Layout
- **Modern** UI Components
- **TailwindCSS** Styling

## 📝 Scripts

```bash
npm run dev          # Development Server
npm run build        # Production Build
npm run start        # Production Server
npm run lint         # ESLint
npm run db:push      # Prisma DB Push
npm run db:studio    # Prisma Studio
```

## 🚢 Deployment

### Vercel (Empfohlen):

1. Push zu GitHub
2. Importiere Projekt in Vercel
3. Füge Environment Variables hinzu
4. Deploy!

### Railway (mit PostgreSQL):

1. Erstelle Railway Account
2. Erstelle PostgreSQL Datenbank
3. Deploye Next.js App
4. Verbinde mit Datenbank

## 📄 License

MIT

## 🤝 Contributing

Contributions sind willkommen!

---

**Entwickelt mit ❤️ und Next.js**
