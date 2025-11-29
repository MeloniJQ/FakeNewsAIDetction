# AI Fake News Detector - Full Stack Application

A comprehensive, production-ready web application for detecting fake news using AI-powered credibility analysis. Built with React + Vite frontend, Node.js + Express backend, MongoDB database, and Google Gemini API integration, plus a Chrome browser extension.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Browser Extension](#browser-extension)
- [Usage Guide](#usage-guide)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

## Features

### Core Functionality

- **Real-time News Detection**: Submit headlines or articles for instant credibility analysis
- **AI-Powered Analysis**: Uses Google Gemini API for advanced fact-checking
- **Confidence Scoring**: Returns classification (True/Fake/Uncertain) with confidence percentages
- **Community Voting**: Users can vote on accuracy to build community trust scores
- **Detection History**: Persistent storage of all analyzed news items
- **Browser Extension**: Check headlines while browsing the web with hover detection

### User Features

- Submit news for analysis
- View detailed explanations for each classification
- Vote on accuracy to improve community scores
- Browse detection history with filters
- Responsive design for mobile and desktop
- Toast notifications for success/error feedback

### Admin/Analytics Features

- Track trending fake news patterns
- Monitor community accuracy rates
- View detailed analysis reports
- Export detection history

## Tech Stack

### Frontend

- **React 18.3** - UI library
- **Vite 5.0** - Fast build tool and dev server
- **TailwindCSS 3.4** - Utility-first CSS framework
- **ShadCN UI** - Component library
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend

- **Node.js** - JavaScript runtime
- **Express.js 4.18** - Web framework
- **MongoDB 8.0** - Document database
- **Mongoose 8.0** - MongoDB ODM
- **Google Generative AI** - Gemini API integration
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management

### Browser Extension

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No dependencies
- **Chrome Storage API** - Local configuration
- **Content Scripts** - Page interaction

## Project Structure

\`\`\`
fake-news-detector/
├── frontend/                    # React + Vite frontend app
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                     # Node.js + Express backend
│   ├── db/
│   │   ├── connection.js       # MongoDB connection
│   │   ├── models.js          # Mongoose schemas
│   │   └── operations.js      # Database operations
│   ├── ml/
│   │   ├── predict.py         # Python ML model
│   │   └── train_model.py     # Training script
│   ├── gemini-service.js       # Gemini API integration
│   ├── ai-detection.js        # Keyword-based NLP
│   ├── ml-server.js           # Python process manager
│   ├── news-service.js        # News fetching service
│   ├── feedback-system.js     # Feedback management
│   ├── server.js              # Express server
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── extension/                   # Chrome browser extension
│   ├── manifest.json          # Extension configuration
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Popup logic
│   ├── popup.css              # Popup styles
│   ├── background.js          # Service worker
│   ├── content.js             # Content script
│   ├── styles.css             # Main styles
│   ├── README.md
│   └── images/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
│
└── README.md                   # This file
\`\`\`

## Prerequisites

Before you begin, ensure you have:

- **Node.js 16+** ([Download](https://nodejs.org))
- **npm or yarn** (comes with Node.js)
- **MongoDB** (local or cloud)
- **Python 3.8+** ([Download](https://www.python.org)) - For ML model
- **Google Gemini API Key** ([Get one](https://makersuite.google.com/app/apikey))
- **Chrome Browser** - For extension testing

## Installation

### 1. Clone or Download the Project

\`\`\`bash
# If cloning from git
git clone <repository-url>
cd fake-news-detector

# Or if you have a zip file
unzip fake-news-detector.zip
cd fake-news-detector
\`\`\`

### 2. Set Up Backend

\`\`\`bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
\`\`\`

**Backend .env configuration:**

\`\`\`env
# Google Gemini API (required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Configuration (choose one)
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/fake-news-detector

# Or MongoDB Atlas (cloud):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fake-news-detector?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development
\`\`\`

### 3. Set Up Frontend

\`\`\`bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (default should work for local development)
nano .env
\`\`\`

**Frontend .env configuration:**

\`\`\`env
VITE_API_URL=http://localhost:5000
\`\`\`

### 4. Set Up Browser Extension

The extension is ready to use - no installation steps needed. It will be loaded in Chrome later.

## Configuration

### MongoDB Setup

#### Option A: Local MongoDB

\`\`\`bash
# Install MongoDB Community Edition
# macOS (using Homebrew):
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify connection
mongo --eval "db.adminCommand('ping')"
\`\`\`

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Get connection string
5. Add to `.env`: `MONGODB_URI=mongodb+srv://...`

### Google Gemini API

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to backend `.env`

### Python ML Model (Optional)

\`\`\`bash
cd backend/ml

# Install Python dependencies
pip install pandas scikit-learn numpy

# Download Kaggle dataset (if using ML model)
# Follow instructions in ml/README.md
python train_model.py fake_and_real_news.csv
\`\`\`

## Running the Application

### Start MongoDB (if local)

\`\`\`bash
# Terminal 1
brew services start mongodb-community
\`\`\`

### Start Backend Server

\`\`\`bash
# Terminal 2
cd backend
npm run dev
# Output: 🚀 Backend running on http://localhost:5000
\`\`\`

### Start Frontend Dev Server

\`\`\`bash
# Terminal 3
cd frontend
npm run dev
# Output: ➜ Local: http://localhost:5173
\`\`\`

### Access the Application

- **Web App**: Open http://localhost:5173 in your browser
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to the `extension` folder in this project
5. The extension is now installed and active

## API Documentation

### Endpoints

#### 1. Check News

**POST** `/api/check-news`

Analyze a news headline or article for credibility.

Request:
\`\`\`json
{
  "text": "Breaking: Major scientific breakthrough discovered"
}
\`\`\`

Response:
\`\`\`json
{
  "id": "507f1f77bcf86cd799439011",
  "text": "Breaking: Major scientific breakthrough discovered",
  "classification": "True",
  "confidence": 85,
  "explanation": "This article demonstrates high confidence of credible reporting...",
  "communityScore": 92,
  "feedbackCount": 14
}
\`\`\`

#### 2. Submit Feedback

**POST** `/api/feedback`

Vote on the accuracy of a detection.

Request:
\`\`\`json
{
  "newsId": "507f1f77bcf86cd799439011",
  "isCorrect": true
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "communityScore": 93,
  "feedbackCount": 15
}
\`\`\`

#### 3. Get Detection History

**GET** `/api/news-history?limit=50&skip=0`

Fetch previously analyzed news items.

Response:
\`\`\`json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "text": "Article text...",
      "classification": "Fake",
      "confidence": 92,
      "communityScore": 88,
      "feedbackCount": 12,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

#### 4. Health Check

**GET** `/health`

Check if backend is running.

Response:
\`\`\`json
{
  "status": "Backend is running",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Browser Extension

The Chrome extension provides:

- **Popup Interface**: Manual text input for checking
- **Hover Detection**: Detects selected text on webpages
- **Floating Badge**: Quick access buttons for checking
- **Result Toast**: Inline results display
- **Settings Panel**: Configure backend API URL

### Extension Features

- Real-time credibility checking
- Community accuracy scores
- User feedback integration
- Persistent storage
- CORS-enabled requests

See `extension/README.md` for detailed extension documentation.

## Usage Guide

### Scenario 1: Check News on Website

1. Visit any news website
2. Select a headline or article text
3. Click the "FakeCheck AI" badge
4. See instant credibility analysis
5. Optionally vote on accuracy

### Scenario 2: Direct Web App Check

1. Go to http://localhost:5173
2. Click "Detect" in navigation
3. Paste a news headline
4. Click "Check News"
5. View results and community score
6. Vote on accuracy

### Scenario 3: View Detection History

1. Go to http://localhost:5173
2. Click "History" in navigation
3. See all previously analyzed news
4. Sort by date or classification
5. Check community accuracy rates

## Database Schema

### Detection Collection

\`\`\`javascript
{
  _id: ObjectId,
  text: String,               // Original news text
  classification: String,     // "True", "Fake", "Uncertain"
  confidence: Number,         // 0-100
  explanation: String,        // Analysis explanation
  geminiResult: String,       // Gemini API response (optional)
  communityScore: Number,     // 0-100 (community accuracy)
  feedbackCount: Number,      // Total votes received
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Feedback Collection

\`\`\`javascript
{
  _id: ObjectId,
  detectionId: ObjectId,      // Reference to Detection
  isCorrect: Boolean,         // User's vote
  userIp: String,            // IP for tracking (optional)
  createdAt: Date
}
\`\`\`

## Troubleshooting

### Backend Connection Issues

**Error**: `Cannot connect to MongoDB`

Solution:
\`\`\`bash
# Check MongoDB is running
mongo --eval "db.adminCommand('ping')"

# If not running, start it
brew services start mongodb-community

# Verify MONGODB_URI in .env
\`\`\`

**Error**: `GEMINI_API_KEY not set`

Solution:
- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add to backend/.env
- Restart backend server

### Frontend Issues

**Error**: `Cannot reach http://localhost:5000`

Solution:
\`\`\`bash
# Ensure backend is running
cd backend && npm run dev

# Check VITE_API_URL in frontend/.env
# Should be: http://localhost:5000

# Clear cache and rebuild
rm -rf frontend/node_modules
npm install
npm run dev
\`\`\`

**Port Already in Use**

\`\`\`bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change PORT in backend/.env
PORT=5001
\`\`\`

### Extension Issues

**Extension not loading:**
1. Go to chrome://extensions/
2. Check "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

**Cannot connect to backend:**
1. Click extension icon
2. Go to Settings
3. Update API URL to correct backend URL
4. Ensure backend is running

**Content script not detecting text:**
- Content scripts don't work on Chrome pages, extensions, or secure sites
- Only works on regular websites (http/https)

## Development & Customization

### Adding New Detection Methods

Edit `backend/ai-detection.js` to add custom detection logic.

### Modifying UI Components

Frontend components are in `frontend/src/components/`.

### Extending Database Schema

Update `backend/db/models.js` to add new fields.

### Training Custom ML Model

See `backend/ml/README.md` for training instructions.

## Deployment

### Deploy Frontend (Vercel)

\`\`\`bash
cd frontend
npm run build
# Push to Vercel for automatic deployment
\`\`\`

### Deploy Backend (Heroku/Railway)

\`\`\`bash
cd backend
# Follow platform-specific deployment steps
# Ensure MONGODB_URI and GEMINI_API_KEY are set
\`\`\`

### Deploy Extension (Chrome Web Store)

See Chrome Developer documentation for publishing extension.

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions:
1. Check the Troubleshooting section
2. Review API documentation
3. Check extension README
4. Open an issue on GitHub

## Future Enhancements

- Multi-language support
- Advanced ML models
- Real-time news feeds
- Social media integration
- Detailed analytics dashboard
- API rate limiting
- User authentication system
- Export reports to PDF
