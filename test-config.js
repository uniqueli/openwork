const fs = require("fs")
const path = require("path")
const os = require("os")

const envPath = path.join(os.homedir(), ".openwork", ".env")
const content = fs.readFileSync(envPath, "utf-8")

console.log("Raw content:")
console.log(content)
console.log("\n---\n")

const lines = content.split("\n")
const config = {}
for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIndex = trimmed.indexOf("=")
  if (eqIndex > 0) {
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    config[key] = value
  }
}

console.log("Parsed config:")
console.log("BASE_URL:", config.CUSTOM_BASE_URL)
console.log("API_KEY:", config.CUSTOM_API_KEY)
console.log("MODEL:", config.CUSTOM_MODEL)
console.log("")
console.log("API_KEY length:", config.CUSTOM_API_KEY?.length)
console.log("Expected length: 48")
