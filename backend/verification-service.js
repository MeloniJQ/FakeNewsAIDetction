import Parser from "rss-parser"

const parser = new Parser()

// Known fact-checking domains to prioritize
const FACT_CHECK_DOMAINS = [
    "snopes.com",
    "politifact.com",
    "factcheck.org",
    "reuters.com",
    "apnews.com",
    "usatoday.com",
    "fullfact.org",
    "leadstories.com",
    "checkyourfact.com",
    "bbc.com",
    "cnn.com",
    "nytimes.com",
    "washingtonpost.com"
]

// Keywords indicating fake news in snippets
const DEBUNK_KEYWORDS = [
    "false",
    "fake",
    "hoax",
    "debunked",
    "incorrect",
    "untrue",
    "baseless",
    "conspiracy",
    "scam",
    "myth",
    "rumor",
    "misleading",
    "altered",
    "doctored"
]

// Keywords indicating real news
const CONFIRM_KEYWORDS = [
    "true",
    "correct",
    "accurate",
    "confirmed",
    "verified",
    "fact",
    "evidence",
    "proven"
]

/**
 * Verify news text using Bing RSS Search
 * @param {string} text - The headline or text to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyWithGoogle(text) {
    try {
        // Search for the text + "fact check"
        const searchQuery = encodeURIComponent(`${text} fact check`)
        const rssUrl = `https://www.bing.com/search?q=${searchQuery}&format=rss`

        const feed = await parser.parseURL(rssUrl)

        if (!feed || !feed.items || feed.items.length === 0) {
            return {
                verified: false,
                matches: [],
                score: 0.5, // Neutral
                summary: "No search results found to verify this claim."
            }
        }

        let fakeCount = 0
        let realCount = 0
        let relevantSources = []

        // Analyze top 5 results
        for (const item of feed.items.slice(0, 5)) {
            const title = (item.title || "").toLowerCase()
            const snippet = (item.contentSnippet || item.content || "").toLowerCase()
            const url = (item.link || "").toLowerCase()

            // Check if source is a known fact-checker or reputable news
            const isReputable = FACT_CHECK_DOMAINS.some(domain => url.includes(domain))

            if (isReputable) {
                // Check for debunking keywords
                const isDebunked = DEBUNK_KEYWORDS.some(keyword =>
                    title.includes(keyword) || snippet.includes(keyword)
                )

                // Check for confirmation keywords
                const isConfirmed = CONFIRM_KEYWORDS.some(keyword =>
                    title.includes(keyword) || snippet.includes(keyword)
                )

                if (isDebunked) {
                    fakeCount += 2 // Weight reputable sources higher
                    relevantSources.push({ title: item.title, url: item.link, verdict: "Fake" })
                } else if (isConfirmed) {
                    realCount += 2
                    relevantSources.push({ title: item.title, url: item.link, verdict: "Real" })
                }
            } else {
                // Generic analysis for other sources (lower weight)
                const isDebunked = DEBUNK_KEYWORDS.some(keyword => title.includes(keyword))
                if (isDebunked) {
                    fakeCount += 1
                }
            }
        }

        // Determine verification result
        let verificationResult = "Uncertain"
        let confidence = 0
        let summary = "Web search could not definitively verify this claim."

        if (fakeCount > realCount) {
            verificationResult = "Fake"
            confidence = Math.min(60 + (fakeCount * 10), 95)
            summary = `Fact-checking sources indicate this might be false. Found ${fakeCount} sources suggesting it is debunked or fake.`
        } else if (realCount > fakeCount) {
            verificationResult = "Real"
            confidence = Math.min(60 + (realCount * 10), 95)
            summary = `Multiple sources appear to confirm this story. Found ${realCount} sources supporting it.`
        }

        return {
            verified: true,
            result: verificationResult,
            confidence,
            sources: relevantSources,
            summary
        }

    } catch (error) {
        console.error("[Verification] Search error:", error.message)
        return {
            verified: false,
            error: error.message
        }
    }
}
