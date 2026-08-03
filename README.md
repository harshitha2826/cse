# Community Skill Exchange Platform

A full‑stack **MERN** application where users can exchange skills instead of money.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, ShadCN UI, TanStack Query, React Hook Form, Zod, Framer Motion, Axios
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB Atlas (Mongoose)
- **Auth**: JWT + Refresh Tokens, bcrypt, email verification, password reset
- **Realtime**: Socket.io
- **Storage**: Cloudinary
- **Deployment**: Frontend → Vercel, Backend → Render

## Project Structure
```
CommunitySkillExchange/
├─ frontend/
├─ backend/
├─ docs/
├─ assets/
├─ database/
├─ deployment/
├─ scripts/
├─ .github/
├─ README.md
├─ LICENSE
├─ .gitignore
├─ package.json
└─ tsconfig.json
```

## Getting Started
```bash
# Clone the repository
git clone <repo-url>
cd CommunitySkillExchange

# Install root dependencies
npm install

# Frontend
cd frontend
npm install
npm run dev   # Starts Vite dev server

# Backend
cd ../backend
npm install
npm run dev   # Starts Express server with ts-node-dev
```

## Scripts
- `npm run dev` – Runs both frontend and backend concurrently.
- `npm run lint` – Lints the entire monorepo.
- `npm run format` – Formats code with Prettier.

## License
MIT © 2026 Harshitha
