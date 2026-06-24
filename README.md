# SpendSense — Personal Finance Dashboard Scaffolding

SpendSense is a production-grade, secure MERN personal finance application designed specifically for student budgeting and financial tracking. It features an automated transactions view, budget forecasting, and an AI advisory chatbot.

## Tech Stack
* **Frontend**: React + Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
* **Backend**: Node.js, Express, MongoDB (Mongoose), Helmet, Express Rate Limit, Cookie Parser
* **Authentication**: HTTP-only JWT secure cookie authentication with refresh token rotation
* **AI Integration**: Google Gemini API client setup
* **Infrastructure**: Docker backend container, GitHub Actions CI checks

## Project Structure
```
spendsense/
├── .github/workflows/deploy.yml   # CI Pipeline
├── backend/                       # Express Backend API
│   ├── src/
│   │   ├── controllers/           # Auth, Transaction, AI Advisor controllers
│   │   ├── middleware/            # Auth check, rate limiting, error handler
│   │   ├── models/                # User, Transaction, Budget Mongoose models
│   │   ├── routes/                # API router entry points
│   │   ├── utils/                 # Gemini Client setup
│   │   ├── app.js                 # App configuration & middleware
│   │   └── server.js              # Database connection & server start
│   ├── Dockerfile
│   └── package.json
└── frontend/                      # React Frontend App
    ├── src/
    │   ├── components/            # Layout, UI components (Cards, Rows, etc.)
    │   ├── context/               # Auth Context Provider
    │   ├── pages/                 # Home, Auth, Dashboard, Transactions, AIAdvisor
    │   ├── services/              # API Axios instance & interceptors
    │   ├── App.jsx                # Router configuration
    │   └── index.css              # Styling imports & custom animations
    ├── tailwind.config.js
    └── package.json
```

## Getting Started

### Prerequisites
* Node.js v20+
* MongoDB running locally or a MongoDB Atlas URI
* Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your Mongo URI, JWT secrets, and Gemini API key.
4. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

## CI/CD Validation
Run the linting and build checks to verify local changes:
```bash
# Frontend Build Check
cd frontend && npm run build

# Backend Lint Check
cd backend && npm run lint

# Backend Docker Build Check
cd backend && docker build -t spendsense-backend .
```
