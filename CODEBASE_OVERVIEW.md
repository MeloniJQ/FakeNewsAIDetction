# AI Fake News Detector - Complete Codebase Mastery & Viva Guide

## 1. System Architecture & Code Flow Deep Dive

### A. The "Check News" Lifecycle (Backend)
When a user clicks "Check" or submits text, the following chain of events occurs in `backend/server.js`:

1.  **Request Entry**: The endpoint `POST /api/check-news` receives a JSON body `{ text: "..." }`.
2.  **Validation**: It checks if `text` is a non-empty string.
3.  **AI Analysis (`ai-detection.js`)**:
    *   **Gemini Call**: It initializes `GoogleGenerativeAI`. It constructs a prompt: *"Act as an expert Fact Checker... Determine if Real/Fake..."*. It awaits the JSON response.
    *   **ML Fallback**: *Simultaneously*, it calls `predictWithML(text)`. This function uses `child_process.spawn` to run `python predict.py "text"`. The Python script loads `model.pkl`, vectorizes the text, and prints a JSON result to stdout.
    *   **Decision Logic**:
        *   If Gemini returns a valid result, it is used (primary).
        *   If Gemini fails or returns "Uncertain", AND the text > 50 chars, the ML result is used.
        *   If the text is too short for ML, it defaults to "Uncertain".
4.  **Verification Layer**: The system calls `verifyWithGoogle(text)`. This uses `googlethis` to search the web. If a high-confidence match from a trusted domain (e.g., Reuters, BBC) is found, it **overrides** the AI's classification.
5.  **Persistence**: The result is saved to the database via `saveDetection()`. If MongoDB is down, it pushes to the `inMemoryDetections` array.
6.  **Response**: The server sends back a JSON object: `{ classification, confidence, explanation, id }`.

### B. The Extension "Injection" Mechanism (Frontend/Extension)
The extension does not just "read" the page; it actively modifies it. This happens in `extension/content.js`:

1.  **The Loop**: A `setInterval` runs every 700ms to check for new content (essential for infinite-scroll sites like Twitter/Facebook).
2.  **Heuristics**: It scans for elements (`h1`, `a`, `div`) that look like headlines. It filters out things that are too short, timestamps, or "By [Author]" lines.
3.  **DOM Manipulation**:
    *   For every valid headline, it creates a `<button>Check</button>` element.
    *   **Shadow/Hidden**: The button is initially `opacity: 0` and `display: none`.
    *   **Event Listeners**: It attaches `mouseenter` events to the headline container. When you hover over the headline, the button fades in (`opacity: 1`).
4.  **Communication**: When clicked, the button sends a message `chrome.runtime.sendMessage({ action: "analyze-text" })`.
5.  **Background Relay**: `background.js` listens for this, makes the `fetch` call to the Backend API, and sends the result back to `content.js`.
6.  **Toast Display**: `content.js` receives the result and creates a `div` (the "toast") with fixed positioning and high z-index to overlay it on the page.

### C. The News Feed Aggregator
In `backend/news-service.js`:
1.  **RSS Parsing**: It uses `rss-parser` to grab the raw XML feed from Google News.
2.  **Batch Intelligence**: Instead of asking AI about 10 articles one-by-one (slow), it bundles them into a **single prompt**: *"Analyze these 10 headlines and return a JSON array"*. This reduces latency significantly.
3.  **Image Scraper**: Since RSS feeds often lack good images, it performs a separate Google Image search for each headline to find a relevant thumbnail.

---

## 2. Comprehensive Viva Question Bank (50+ Questions)

### 🟢 Section 1: General Architecture & System Design

1.  **What is the core problem this project solves?**
    *   *Ans:* It combats misinformation by providing real-time, AI-backed credibility analysis of news headlines and articles.
2.  **Explain the high-level architecture of your application.**
    *   *Ans:* It's a 3-tier architecture: A React Frontend (Client), a Node.js/Express Backend (Server), and a MongoDB Database (Data), plus a Chrome Extension as an alternative client.
3.  **Why did you choose a hybrid AI approach (Gemini + Local ML)?**
    *   *Ans:* Reliability. Gemini (LLM) provides reasoning, while the local ML model provides speed and works as a fallback if the API is down.
4.  **What is the "Source of Truth" in your system?**
    *   *Ans:* The primary source is the Gemini LLM's knowledge base, augmented by real-time Google Search verification for breaking news.
5.  **How does the frontend communicate with the backend?**
    *   *Ans:* Via RESTful API calls using the `fetch` API.
6.  **Is your application stateful or stateless?**
    *   *Ans:* The backend is primarily stateless (REST), but we maintain some state in memory (for the fallback DB) and use JWTs for user session state.
7.  **What happens if the internet connection is lost?**
    *   *Ans:* The Extension and Gemini features will fail. However, the Local ML model *could* theoretically run offline if we moved the Python execution to the client side (but currently it runs on the server).
8.  **How do you handle concurrent requests?**
    *   *Ans:* Node.js is single-threaded but event-driven. It handles concurrency using the Event Loop, delegating I/O operations (like DB or API calls) to the system kernel.
9.  **What is the purpose of the `manifest.json` file?**
    *   *Ans:* It is the configuration file for the Chrome Extension, defining permissions, background scripts, and content scripts.
10. **Why use Vite instead of Create React App?**
    *   *Ans:* Vite is significantly faster in development due to native ES modules and uses Rollup for optimized production builds.

### 🟡 Section 2: Backend (Node.js & Express)

11. **What is Middleware in Express, and how do you use it?**
    *   *Ans:* Functions that execute during the request-response cycle. We use `cors` for cross-origin requests and `express.json()` to parse request bodies.
12. **Explain the `child_process.spawn` function.**
    *   *Ans:* It allows Node.js to launch a new system process. We use it to execute the Python script (`predict.py`) and capture its output via streams.
13. **How do you handle errors in async functions?**
    *   *Ans:* We use `try/catch` blocks. If an error occurs, we log it and send a standardized 500 error response to the client.
14. **What is CORS and why did you need to configure it?**
    *   *Ans:* Cross-Origin Resource Sharing. Browsers block requests from different origins (e.g., localhost:5173 to localhost:5000) by default. We enabled it to allow the Frontend and Extension to talk to the Backend.
15. **How does the `rss-parser` library work?**
    *   *Ans:* It fetches the XML data from a URL (Google News RSS), parses the XML tags (item, title, link), and converts them into a JavaScript object.
16. **What is the purpose of `dotenv`?**
    *   *Ans:* It loads environment variables from a `.env` file into `process.env`, keeping sensitive keys (like API keys) out of the code.
17. **How does the server distinguish between the Extension and the React App?**
    *   *Ans:* It doesn't strictly need to, but we can check the `Origin` header in the request if we wanted to apply different logic.
18. **Explain the "In-Memory Fallback" for the database.**
    *   *Ans:* In `db/operations.js`, we check `isMongoConnected()`. If false, we push data to a global array (`const inMemoryDetections = []`) instead of calling Mongoose methods.
19. **Why do you use `await` when calling `analyzeNewsText`?**
    *   *Ans:* Because it involves asynchronous operations (API calls, Python script execution) that take time to complete.
20. **What is the `optionalAuthenticateToken` middleware?**
    *   *Ans:* It checks for a JWT. If present, it attaches the user ID to the request. If not, it allows the request to proceed as "anonymous".

### 🔵 Section 3: Frontend (React) & Extension

21. **What is the Virtual DOM?**
    *   *Ans:* A lightweight copy of the actual DOM. React updates this first, compares it to the previous version (diffing), and only updates the changed elements in the real DOM.
22. **Why do you use `useEffect` in `Home.jsx`?**
    *   *Ans:* To perform side effects—specifically, fetching the news data from the API as soon as the component mounts.
23. **How does the Extension inject the "Check" button?**
    *   *Ans:* It uses `document.createElement('button')` and `element.insertAdjacentElement('afterend', btn)` to insert the button into the DOM next to headlines.
24. **What is the "Shadow DOM" (or why might you use it)?**
    *   *Ans:* We aren't strictly using Shadow DOM here, but if we did, it would encapsulate our extension's styles so they don't clash with the website's CSS. Currently, we use specific IDs and high z-indices.
25. **How does the extension handle dynamic content (infinite scrolling)?**
    *   *Ans:* We use `setInterval` (polling) to repeatedly scan the DOM for new elements that haven't been processed yet.
26. **What is the difference between `background.js` and `content.js`?**
    *   *Ans:* `content.js` runs *in* the web page (can read DOM). `background.js` runs in the browser background (can make cross-origin requests, handle events).
27. **How do you pass messages between the content script and background script?**
    *   *Ans:* Using `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`.
28. **Why is the "Check" button hidden by default?**
    *   *Ans:* To avoid cluttering the user's interface. We use CSS `opacity: 0` and show it only on `mouseenter` (hover).
29. **How do you ensure the extension doesn't slow down the browser?**
    *   *Ans:* We use a `WeakSet` (`processed`) to track elements we've already handled, ensuring we don't re-process the same headlines multiple times.
30. **What is `z-index` and why is it set to `999999999`?**
    *   *Ans:* It controls the stack order of elements. We set it extremely high to ensure our popup appears *on top* of everything else on the website.

### 🟣 Section 4: AI & Machine Learning

31. **What model is used in `predict.py`?**
    *   *Ans:* It's likely a **Logistic Regression** or **PassiveAggressiveClassifier** (common for text), trained using **TF-IDF** vectorization.
32. **What is TF-IDF?**
    *   *Ans:* Term Frequency-Inverse Document Frequency. It converts text into numbers by weighing how important a word is (frequent in this doc, but rare in others).
33. **What is the difference between "Classification" and "Confidence"?**
    *   *Ans:* Classification is the label (Real/Fake). Confidence is the probability (0-100%) that the model assigns to that label being correct.
34. **Why do you filter out short text (<50 chars) for the ML model?**
    *   *Ans:* ML models based on word patterns need sufficient context. Short strings often lack the "features" (specific words) needed for an accurate prediction, leading to noise.
35. **What is a "Hallucination" in the context of Gemini?**
    *   *Ans:* When the AI confidently generates false information. We mitigate this by using the Google Search verification layer.
36. **How does the "Prompt Engineering" work in `ai-detection.js`?**
    *   *Ans:* We give the AI a persona ("Expert Fact Checker") and specific constraints ("Format as JSON", "Check source credibility") to guide its output.
37. **What is the training data for the local model?**
    *   *Ans:* The `True.csv` and `Fake.csv` files, which likely contain thousands of labeled news articles.
38. **Why do you use `pickle` in Python?**
    *   *Ans:* To serialize (save) the trained model object to a file (`model.pkl`) so we can load it instantly without retraining every time.
39. **How does the Google Search verification work?**
    *   *Ans:* It searches the headline. If the top results are from a whitelist of trusted domains (e.g., Reuters), it assumes the story is real.
40. **Can this system detect satire?**
    *   *Ans:* Yes, Gemini is instructed to identify satire. The local ML model might struggle and classify it as "Fake" (which is technically true, but lacks nuance).

### 🟠 Section 5: Database & Security

41. **Why MongoDB?**
    *   *Ans:* It's a NoSQL database, which is flexible for storing JSON-like documents (detections, feedback) where the schema might evolve.
42. **What is a JWT?**
    *   *Ans:* JSON Web Token. A compact, URL-safe means of representing claims to be transferred between two parties. We use it for stateless authentication.
43. **How do you store passwords?**
    *   *Ans:* They should be hashed (e.g., using `bcrypt`) before storage. We never store plain text passwords.
44. **What is "SQL Injection" and is MongoDB vulnerable to it?**
    *   *Ans:* SQL Injection attacks SQL databases. MongoDB is vulnerable to *NoSQL Injection*, but using an ODM like Mongoose helps sanitize inputs.
45. **How does the Community Score calculation work?**
    *   *Ans:* It's a simple ratio: `(Positive Votes / Total Votes) * 100`.
46. **What prevents a user from voting 100 times?**
    *   *Ans:* We track votes by `userId` (if logged in) or `userIp` (if anonymous) in the Feedback collection.
47. **How do you protect the API Key?**
    *   *Ans:* It is stored in a `.env` file on the server. The client never sees it; the client talks to our backend, and our backend talks to Gemini.
48. **What is the `lean()` method in Mongoose?**
    *   *Ans:* It returns plain JavaScript objects instead of full Mongoose Documents. It's faster for read-only operations.
49. **How would you scale the database?**
    *   *Ans:* MongoDB supports **Sharding** (distributing data across machines) and **Replication** (copies for redundancy).
50. **What is the "Author Credibility" feature?**
    *   *Ans:* We track how many "Real" vs "Fake" articles are associated with a specific author/source and calculate a dynamic score over time.

---

## 3. Quick Reference: Key Commands

*   **Start Backend**: `cd backend && npm run dev` (Runs on port 5000)
*   **Start Frontend**: `cd frontend && npm run dev` (Runs on port 5173)
*   **Train Model**: `cd backend/ml && python train_model.py`
*   **Load Extension**: Chrome -> Extensions -> Load Unpacked -> Select `extension` folder.
