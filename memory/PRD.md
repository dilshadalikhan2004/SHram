# ShramSetu (श्रमसेतु) - PRD v2.0

## Product Overview
AI-powered labor marketplace connecting blue-collar workers with verified employers in India.

## Original Problem Statement
Build a COMPLETE, production-grade full-stack application for ShramSetu - an AI-powered labor marketplace with comprehensive intelligence, decision-making features, trust systems, and a polished modern UI.

## User Personas

### Workers (Blue-collar)
- Construction workers, electricians, plumbers, carpenters, painters, masons, welders, drivers, security guards, cleaners, gardeners
- Need: Find nearby jobs matching their skills
- Pain points: Unreliable job discovery, long commutes, unpredictable pay

### Employers
- Construction companies, real estate firms, contractors, businesses
- Need: Quickly hire reliable workers
- Pain points: Finding skilled workers, verifying experience, managing applications

## What's Been Implemented (Jan 2026)

### Phase 1 (MVP) - COMPLETED
- [x] JWT Authentication (email/password)
- [x] Worker/Employer dashboards
- [x] Job posting and applications
- [x] AI Match Scoring with GPT-5.2
- [x] Real-time WebSocket chat
- [x] Dark/Light theme toggle
- [x] Basic notifications

### Phase 2 (v2.0) - COMPLETED
- [x] **Profile Photo Upload** - Object storage integration
- [x] **Multi-language Support** - English, Hindi (हिंदी), Odia (ଓଡ଼ିଆ)
- [x] **Premium Job Boost** - Stripe integration with 3 packages:
  - Basic Boost (₹99 / 7 days)
  - Premium Boost (₹249 / 14 days) 
  - Featured Listing (₹499 / 30 days)
- [x] **Reliability Score System** - Based on:
  - Jobs completed
  - Acceptance rate
  - Average rating
- [x] **AI-Powered Recommendations**:
  - "Recommended for you" jobs for workers
  - "Top Candidates" AI-ranked applicants for employers
  - AI recommendation badges (Highly Recommended, Recommended, Consider)
- [x] **Quick Apply** - 1-click job application
- [x] **Job Bookmarking** - Save jobs for later
- [x] **Work History** - Track completed jobs with ratings
- [x] **Phone Verification Badge**
- [x] **Enhanced Status Tracking** - Applied → Viewed → Shortlisted → Selected
- [x] **Boosted Jobs Highlighting** - Featured badge, priority listing

## Database Collections
- users (with phone_verified, preferred_language)
- worker_profiles (with reliability_score, acceptance_rate)
- employer_profiles (with total_hires)
- jobs (with is_boosted, boost_expires, boost_type)
- applications (with ai_recommendation, reliability_score)
- messages
- ratings
- notifications
- saved_jobs
- files
- payment_transactions

## API Endpoints (v2.0)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PATCH /api/auth/language

### Workers
- POST/GET/PUT /api/worker/profile
- GET /api/worker/profile/{id}
- GET /api/worker/history

### Employers
- POST/GET/PUT /api/employer/profile

### Jobs
- POST/GET /api/jobs
- GET /api/jobs/recommended
- GET /api/jobs/employer
- GET /api/jobs/{id}
- PUT /api/jobs/{id}
- PATCH /api/jobs/{id}/status
- POST /api/jobs/save
- DELETE /api/jobs/save/{id}
- GET /api/jobs/saved

### Applications
- POST /api/applications
- GET /api/applications/worker
- GET /api/applications/job/{id}
- GET /api/applications/top-candidates/{id}
- PATCH /api/applications/{id}/status

### AI
- GET /api/match-score/{job_id}

### Payments (Stripe)
- GET /api/boost/packages
- POST /api/boost/checkout
- GET /api/boost/status/{session_id}
- POST /api/webhook/stripe

### Files
- POST /api/upload/profile-photo
- GET /api/files/{path}

### Other
- POST/GET /api/messages
- GET /api/conversations
- POST /api/ratings
- GET /api/ratings/{user_id}
- GET /api/notifications
- PATCH /api/notifications/read-all
- GET /api/translations/{language}
- GET /api/categories
- GET /api/stats/worker
- GET /api/stats/employer
- POST /api/seed

## Demo Credentials
- Worker: ramesh@demo.com / demo123
- Employer: abc@contractor.com / demo123

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor, JWT, bcrypt
- **Frontend**: React, Tailwind CSS, Shadcn UI, Framer Motion
- **AI**: OpenAI GPT-5.2 direct integration
- **Real-time**: WebSocket
- **Storage**: Cloud Object Storage / Local Storage
- **Payments**: Stripe Checkout
- **Fonts**: Outfit (headings), Manrope (body)

## Next Tasks (P1)
1. Google Maps integration for precise location
2. Push notifications (web push / mobile)
3. SMS OTP verification
4. Video introductions for workers
5. Skills assessment tests

## Next Tasks (P2)
6. Mobile app (React Native)
7. Analytics dashboard for employers
8. AI-powered interview scheduling
9. Referral program
10. Background verification integration
