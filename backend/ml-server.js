// This file spawns Python predict.py and manages the prediction workflow

import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Call Python predict.py and return ML model prediction
 * @param {string} text - News text to analyze
 * @returns {Promise<Object>} Prediction result with confidence
 */
export async function predictWithML(text) {
  return new Promise((resolve, reject) => {
    try {
      // Spawn Python process
      // Using absolute path for Windows compatibility since it might not be in PATH yet
      const pythonPath = "C:\\Users\\Parousia\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
      const python = spawn(pythonPath, [path.join(__dirname, "ml", "predict.py"), text])

      let output = ""
      let errorOutput = ""

      // Capture stdout
      python.stdout.on("data", (data) => {
        output += data.toString()
      })

      // Capture stderr
      python.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      // Handle process completion
      python.on("close", (code) => {
        try {
          if (code !== 0) {
            console.error("[ML] Python error:", errorOutput)
            return resolve({
              error: "Model prediction failed",
              details: errorOutput,
            })
          }

          // Parse JSON output
          const result = JSON.parse(output.trim())
          resolve(result)
        } catch (parseError) {
          console.error("[ML] JSON parse error:", parseError)
          resolve({
            error: "Failed to parse model output",
            raw: output,
          })
        }
      })

      // Handle spawn errors
      python.on("error", (err) => {
        console.error("[ML] Spawn error:", err)
        resolve({
          error: "Failed to spawn Python process",
          details: err.message,
        })
      })
    } catch (err) {
      console.error("[ML] Unexpected error:", err)
      resolve({
        error: "Unexpected error during prediction",
        details: err.message,
      })
    }
  })
}
