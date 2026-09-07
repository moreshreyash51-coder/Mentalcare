# MindCare 🧠

AI-based cognitive gaming and memory assistance platform designed for elderly individuals with memory challenges and their caregivers.

---

## 🚀 Quick Start on Localhost

Running MindCare on your local machine with `npm` takes just a couple of minutes:

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: Version 8.0.0 or higher (comes bundled with Node.js)

### 2. Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### 3. Configure Environment Variables (Optional)
MindCare is ready to run immediately without any manual configuration. It includes a built-in datastore and smart local AI fallbacks.

If you have a Gemini API Key or MongoDB instance, create a `.env` file:
```bash
cp .env.example .env
```
Edit `.env` to configure your keys (optional):
```env
GEMINI_API_KEY="your-gemini-api-key"
MONGODB_URI="mongodb://localhost:27017/mindcare"   # Optional: built-in datastore used if omitted
JWT_SECRET="mindcare_super_secret_jwt_key_2026"
PORT=3000
```

### 4. Start the Development Server
```bash
npm run dev
```
Once started, open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Accounts (Pre-configured)

You can immediately sign in using either of these pre-seeded accounts or register a new one:

| Role | Name | Email | Password |
|---|---|---|---|
| **Patient (Female)** | Eleanor Vance | `eleanor@example.com` | `password123` |
| **Patient (Male)** | Arthur Vance | `arthur@example.com` | `password123` |
| **Caregiver (Female)** | Sarah Vance | `sarah@example.com` | `password123` |
| **Caregiver (Male)** | David Vance | `david@example.com` | `password123` |

---

## 🛠️ Available NPM Scripts

In the project terminal, you can run:

| Command | Description |
|---|---|
| `npm run dev` | Starts the unified Express + Vite dev server on `http://localhost:3000` with hot code updates. |
| `npm run build` | Compiles both client-side assets with Vite and bundles the Node server with esbuild into `dist/`. |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`). |
| `npm run lint` | Runs the TypeScript compiler check (`tsc --noEmit`) to verify types. |
| `npm run clean` | Cleans build artifacts in a cross-platform safe manner. |

---

## 🏗️ Architecture & Features

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion, Recharts.
- **Backend API**: Express on Node.js handling authentication, patient profiles, memory gallery, reminders, AI services, and cognitive games.
- **AI Companion**: Google Gemini (via `@google/genai`) with support for real-time memory grounding, orientation assistance, and camera/photo analysis.
- **Resilient Datastore**: Built-in in-memory MongoDB datastore that works out of the box with zero external database setup required, or connects automatically to MongoDB when `MONGODB_URI` is provided.
