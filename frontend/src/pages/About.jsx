import { Download, Code, Shield } from "lucide-react"

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-6">About FakeCheck AI</h1>
        <div className="card p-8 space-y-4">
          <h2 className="text-2xl font-semibold">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            To combat misinformation by providing users with AI-powered tools to verify the authenticity of news. Our
            system uses Google Gemini API for real-time fact checking and machine learning for pattern recognition.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <Shield className="w-10 h-10 text-primary mb-3" />
          <h3 className="font-semibold mb-2">AI Verification</h3>
          <p className="text-sm text-muted-foreground">Powered by Google Gemini API for real-time fact checking</p>
        </div>

        <div className="card p-6">
          <Code className="w-10 h-10 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Open Architecture</h3>
          <p className="text-sm text-muted-foreground">Built with React, Node.js, and MongoDB for transparency</p>
        </div>

        <div className="card p-6">
          <Download className="w-10 h-10 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Browser Extension</h3>
          <p className="text-sm text-muted-foreground">Check headlines while browsing with our Chrome extension</p>
        </div>
      </section>

      <section className="card p-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="font-bold text-primary">1.</span>
            <div>
              <p className="font-semibold">Submit News</p>
              <p className="text-sm text-muted-foreground">Paste any news headline or article</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-primary">2.</span>
            <div>
              <p className="font-semibold">AI Analysis</p>
              <p className="text-sm text-muted-foreground">Our system analyzes credibility using Gemini API</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-primary">3.</span>
            <div>
              <p className="font-semibold">Get Results</p>
              <p className="text-sm text-muted-foreground">
                Receive classification (True/Fake/Uncertain) with confidence score
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-primary">4.</span>
            <div>
              <p className="font-semibold">Community Feedback</p>
              <p className="text-sm text-muted-foreground">Vote on accuracy to improve community scores</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="card p-8">
        <h2 className="text-2xl font-semibold mb-4">Browser Extension</h2>
        <p className="text-muted-foreground mb-6">
          Download our Chrome extension to check headlines while browsing any website.
        </p>
        <a href="#download" className="btn-primary inline-block">
          <Download className="w-4 h-4 inline mr-2" />
          Download Extension
        </a>
      </section>
    </div>
  )
}
