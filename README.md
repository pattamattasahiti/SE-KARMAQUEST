# KarmaQuest - AI-Powered Fitness Tracking Application

## Quick Start Guide

### Prerequisites
- **Backend:** Python 3.12+, PostgreSQL
- **Mobile App:** Node.js 18+, npm, Expo Go app (iOS/Android)

---

## 🚀 Backend Setup (5 Steps)

### 1. Navigate to Backend
```bash
cd karmaquest-backend
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Database
Create `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/karmaquest_db
JWT_SECRET_KEY=your-secret-key
SECRET_KEY=your-flask-secret
FLASK_ENV=development
```

### 5. Run Backend
```bash
python run.py
```
Backend runs on `http://localhost:5000`

---

## 📱 Mobile App Setup (4 Steps)

### 1. Navigate to Mobile App
```bash
cd karmaquest-mobileapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API URL
Edit `.env` file and set your computer's IP address:
```env
API_BASE_URL=http://YOUR_IP_ADDRESS:5000/api
```
Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### 4. Start App
```bash
npx expo start
```
Scan QR code with Expo Go app or press `a` for Android emulator

---

## 👥 Test Accounts

**Admin:**
- Email: `admin@karmaquest.com`
- Password: `admin123`

**Regular User:**
- Email: `testuser@example.com`
- Password: `TestPassword123!`

**Trainer:**
- Email: `trainer@example.com`
- Password: `TrainerPass123!`

---

## ✅ Features
- AI-powered workout form analysis
- Real-time rep counting
- Personalized workout & meal plans
- Multi-role system (User/Trainer/Admin)
- Progress tracking & analytics
- Video workout analysis

---

## 🧪 Testing
Backend has 33 unit tests with 100% pass rate:
```bash
cd karmaquest-backend
pytest -v
```

---

## 📞 Support
All AI processing happens in the backend. The mobile app sends videos to the backend for analysis. Ensure both backend and mobile app are running for full functionality.

**Version:** 1.0.0  
**Status:** Production Ready
