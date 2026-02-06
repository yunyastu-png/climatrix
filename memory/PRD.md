# ClimateAI Hub - Product Requirements Document

## Original Problem Statement
Build an AI-Powered Climate Risk, Sustainability, and Environmental Intelligence Platform as a full-stack web application that transforms environmental data into predictive intelligence and sustainability decision support.

## User Choices
- **Map Provider**: Leaflet with OpenStreetMap (free, no API key)
- **AI/LLM**: OpenAI GPT-5.2 with Emergent LLM Key
- **Voice AI**: Browser's Web Speech API
- **Weather Data**: Mock/simulated data for demo
- **Database**: MongoDB
- **OTP**: Mock OTP (displayed on screen)

## Architecture

### Tech Stack
- **Frontend**: React + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent Integrations
- **Maps**: Leaflet + React-Leaflet
- **Voice**: Web Speech API

### Key Files
- `/app/backend/server.py` - FastAPI backend with all endpoints
- `/app/frontend/src/pages/LandingPage.jsx` - Animated landing page
- `/app/frontend/src/pages/AuthPage.jsx` - Login/Register/OTP flow
- `/app/frontend/src/pages/Dashboard.jsx` - Main dashboard
- `/app/frontend/src/components/ClimateMap.jsx` - Leaflet map component

## User Personas
1. **Climate Researchers** - Analyze climate patterns and risks
2. **Farmers** - Get crop recommendations and drought alerts
3. **Disaster Management Officials** - Monitor flood/heat stress risks
4. **Sustainability Professionals** - Track environmental trends

## Core Requirements (Static)

### Must-Have Features
- [x] Global interactive climate map
- [x] Timeline controls (past/current/future)
- [x] AI Climate Intelligence Engine (drought, flood, heat stress)
- [x] Scenario Simulator with sliders
- [x] Explainable AI with confidence %
- [x] AI Chat with voice input
- [x] Multilingual (English/Tamil)
- [x] JWT Authentication with mock OTP
- [x] GPS detection

## What's Been Implemented (Feb 5, 2026)

### Backend (100% Complete)
- Authentication endpoints (register, verify-otp, login)
- Climate data API with mock weather generation
- Scenario simulation API
- AI Chat integration with GPT-5.2
- Recommendations endpoint
- Risk assessment calculations
- Language preference updates

### Frontend (100% Complete)
- Landing page with Eco-Cyberpunk theme
- Auth flow (Email/Phone, OTP verification)
- Dashboard with:
  - Interactive Leaflet map with layer controls
  - Risk Assessment panel with progress bars
  - Current Conditions display
  - Sustainability Trends panel
  - Scenario Simulator with sliders
  - AI Chat panel with voice input
  - Language toggle (EN/Tamil)
  - Timeline controls (Past/Current/Future)

## What's MOCKED
- Weather data (not using real OpenWeather API)
- OTP verification (OTP displayed on screen for demo)
- AI predictions use simplified algorithms (not full ML models)

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core authentication flow
- [x] Climate map with location detection
- [x] Risk assessment display
- [x] Basic AI chat

### P1 (Important) - DONE
- [x] Scenario simulation
- [x] Multilingual support
- [x] Voice input
- [x] Timeline controls

### P2 (Nice-to-have)
- [ ] Real weather API integration (OpenWeather)
- [ ] Real ML model training scripts
- [ ] SMS/Email OTP via Twilio/SendGrid
- [ ] More map layers (satellite, radar)
- [ ] Historical data charts with Recharts
- [ ] PDF report generation
- [ ] Mobile-responsive improvements

## Next Tasks
1. Integrate real OpenWeather API for live data
2. Add more sophisticated ML models for predictions
3. Implement real OTP via Twilio/SendGrid
4. Add data visualization charts for historical trends
5. Create mobile-optimized views
