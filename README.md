# TaskFlow frontend — Release 0

A React + TypeScript dashboard starter for our DevOps learning project.

## Current capabilities

- Dashboard summary cards
- Task list with project, priority, status, and due date
- Search and status filters
- Create task modal
- Update task status
- Responsive layout
- Mock data held in browser memory (no backend connection yet)

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

## Validate a production build

```bash
npm run build
npm run preview
```

The production-ready static files are written to `dist/`. Those files are what we'll later publish to S3 and deliver through CloudFront.

## Important for this first release

This is a frontend-only prototype. Task changes exist only in React state and will reset when the page reloads. There is no authentication, backend API, or database connection yet. We will add those as later releases rather than pretending the demo data is persistent.

The `.env.example` file reserves `VITE_API_BASE_URL` for the API base URL we'll configure later. Never put AWS credentials, database passwords, or other secrets in frontend environment variables: frontend variables are embedded into files delivered to browsers.

## Planned evolution

1. Frontend with demo data.
2. FastAPI backend and API contract.
3. PostgreSQL persistence.
4. Automated tests and CI.
5. S3 + CloudFront frontend deployment.
6. ECR + EKS backend deployment.
7. RDS connectivity, monitoring, recovery, and release automation.
