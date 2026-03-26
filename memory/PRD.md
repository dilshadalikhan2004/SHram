# ShramSetu (श्रमसेतु) - PRD

## Product Overview
AI-powered labor marketplace connecting blue-collar workers with verified employers in India.

## Original Problem Statement
Build a COMPLETE, production-grade full-stack application for ShramSetu - an AI-powered labor marketplace with:
- Worker & Employer modules
- AI-based match scoring (0-100%)
- Real-time WebSocket chat
- Ratings system
- Notifications
- JWT authentication
- Premium dark/light theme

## User Personas

### Workers (Blue-collar)
- Construction workers, electricians, plumbers, carpenters, painters, masons, welders, drivers, security guards, cleaners, gardeners
- Need: Find nearby jobs matching their skills
- Pain points: Unreliable job discovery, long commutes, unpredictable pay

### Employers
- Construction companies, real estate firms, contractors, businesses
- Need: Quickly hire reliable workers
- Pain points: Finding skilled workers, verifying experience, managing applications

## Core Requirements (Static)

### Authentication
- [x] Email/password JWT-based login
- [x] Role-based registration (worker/employer)
- [x] Session management with token refresh

### Worker Features
- [x] Profile creation with skills, experience, rates, location
- [x] Job feed with search and category filters
- [x] Job application with cover message
- [x] AI match score display
- [x] Application status tracking
- [x] View ratings

### Employer Features
- [x] Company profile creation
- [x] Job posting with skills, pay, location
- [x] View applicants with AI match scores
- [x] Shortlist/select/reject workers
- [x] Job status management

### AI Matching System
- [x] Skill match scoring (50% weight)
- [x] Experience match scoring (30% weight)
- [x] Distance/location scoring (20% weight)
- [x] AI-generated explanations via OpenAI GPT-5.2

### Communication
- [x] Real-time WebSocket chat
- [x] Conversation list with unread counts
- [x] Notifications for job actions

### UI/UX
- [x] Dark/Light theme toggle
- [x] Worker theme (Blue #0066FF)
- [x] Employer theme (Green #059669)
- [x] Responsive design
- [x] Glassmorphism cards

## What's Been Implemented (Jan 2026)

### Backend (FastAPI)
- Complete REST API with 20+ endpoints
- MongoDB integration with Motor async driver
- JWT authentication with bcrypt password hashing
- WebSocket real-time chat
- AI matching using OpenAI GPT-5.2 via Emergent integrations
- Role-based access control
- Database seeding with demo data

### Frontend (React)
- Auth page with login/register tabs
- Worker dashboard with jobs, applications, profile tabs
- Employer dashboard with jobs, applicants, profile tabs
- Profile setup flows for both roles
- AI match score visualization with circular progress
- Real-time chat panel
- Theme toggle (dark/light)
- Toast notifications

### Database Collections
- users
- worker_profiles
- employer_profiles
- jobs
- applications
- messages
- ratings
- notifications

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST/GET/PUT /api/worker/profile
- POST/GET/PUT /api/employer/profile
- POST/GET /api/jobs
- GET /api/jobs/employer
- PATCH /api/jobs/{id}/status
- POST /api/applications
- GET /api/applications/worker
- GET /api/applications/job/{id}
- PATCH /api/applications/{id}/status
- GET /api/match-score/{job_id}
- POST/GET /api/messages
- GET /api/conversations
- POST /api/ratings
- GET /api/notifications
- GET /api/categories
- GET /api/stats/worker
- GET /api/stats/employer
- POST /api/seed
- WebSocket: /ws/{token}

## Demo Credentials
- Worker: ramesh@demo.com / demo123
- Employer: abc@contractor.com / demo123

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Authentication system
- [x] Worker/Employer dashboards
- [x] Job posting and applications
- [x] AI match scoring

### P1 (High Priority)
- [ ] Profile photo upload (object storage)
- [ ] Push notifications (mobile)
- [ ] Advanced location with Google Maps
- [ ] Multi-language support (Hindi, Marathi, etc.)

### P2 (Medium Priority)
- [ ] Payment integration for premium listings
- [ ] Background verification badge
- [ ] Video introductions
- [ ] Skills assessment tests
- [ ] Job calendar/scheduling

### P3 (Low Priority)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard for employers
- [ ] AI-powered interview scheduling
- [ ] Referral program

## Next Tasks
1. Add profile photo upload with object storage
2. Implement push notifications
3. Add Google Maps for precise location
4. Multi-language support (Hindi first)
5. Payment integration for premium job postings

## Tech Stack
- Backend: FastAPI, MongoDB, Motor, JWT, bcrypt
- Frontend: React, Tailwind CSS, Shadcn UI, Framer Motion
- AI: OpenAI GPT-5.2 via Emergent integrations
- Real-time: WebSocket
- Fonts: Outfit (headings), Manrope (body)
