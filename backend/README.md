# AI Fake News Detector - Backend API

A Node.js + Express backend for analyzing news articles and detecting potential misinformation.

## Features

- **Fast AI Analysis**: Analyzes text using NLP-based keyword indicators
- **CORS Enabled**: Works seamlessly with frontend on localhost:3000
- **JSON API**: Simple POST endpoint for text analysis
- **Production Ready**: Error handling, validation, and health checks included

## Installation

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

## Running the Backend

### Development Mode (with auto-restart):
\`\`\`bash
npm run dev
\`\`\`

### Production Mode:
\`\`\`bash
npm start
\`\`\`

The backend will start on `http://localhost:5000`

## API Endpoints

### POST /api/analyze

Analyzes a news article or headline for credibility.

**Request:**
\`\`\`json
{
  "text": "Your news headline or article text here"
}
\`\`\`

**Response:**
\`\`\`json
{
  "classification": "fake|real|biased",
  "confidence": 87,
  "sourceCredibility": 72,
  "authorCredibility": 68,
  "summary": "Analysis summary...",
  "factCheckLinks": [
    {
      "title": "Snopes - Fact Check",
      "url": "https://www.snopes.com"
    }
  ]
}
\`\`\`

### GET /health

Health check endpoint to verify the backend is running.

**Response:**
\`\`\`json
{
  "status": "Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

## How It Works

The backend uses a keyword-based NLP approach:

1. **Analyzes for indicators:**
   - Fake indicators: sensationalist language ("breaking", "shocking", "exposed")
   - Credible indicators: research-based language ("study", "research", "evidence")
   - Bias indicators: opinion language ("believe", "opinion", "claims")

2. **Calculates scores:**
   - Compares indicator frequency against predefined sets
   - Assigns confidence scores based on pattern matches

3. **Returns results:**
   - Classification (fake/real/biased)
   - Confidence percentage (50-99%)
   - Source and author credibility scores
   - Relevant fact-checking links
   - Human-readable summary

## Environment Variables (Optional)

Create a `.env` file in the backend directory:

\`\`\`
PORT=5000
\`\`\`

Default port is 5000 if not specified.

## Technology Stack

- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **Node.js** - Runtime environment

## Extending the Backend

To use a real AI/ML model (like Hugging Face):

1. Install the Hugging Face inference package:
\`\`\`bash
npm install @huggingface/inference
\`\`\`

2. Update `ai-detection.js` to use the Hugging Face API:
\`\`\`javascript
import { HfInference } from "@huggingface/inference";

const client = new HfInference(process.env.HF_API_KEY);

export async function analyzeNewsText(text) {
  const result = await client.textClassification({
    model: "microsoft/deberta-v3-small",
    inputs: text,
  });
  // Process and return results
}
\`\`\`

3. Add your API key to `.env`:
\`\`\`
HF_API_KEY=your_hugging_face_api_key
