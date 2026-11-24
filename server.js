require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

// Protect private and server-side files.
app.use((req, res, next) => {
const blocked = [
"/server.js",
"/package.json",
"/package-lock.json"
];

if (
    blocked.includes(req.path) ||
    req.path.startsWith("/node_modules/") ||
    req.path.startsWith("/.git/")
) {
    return res.sendStatus(404);
}

next();

});

// DENIS AI rate limiter.
const chatLimiter = rateLimit({
windowMs: 60 * 1000,
limit: 15,
standardHeaders: "draft-7",
legacyHeaders: false,
message: {
error: "Too many messages. Please wait a moment and try again."
}
});

// Check Groq API key.
if (!process.env.GROQ_API_KEY) {
console.error("ERROR: GROQ_API_KEY is missing from your environment.");
process.exit(1);
}

// Server status.
app.get("/api/status", (req, res) => {
res.json({
status: "online",
assistant: "DENIS AI",
provider: "Groq"
});
});

// DENIS AI chat endpoint.
app.post("/api/chat", chatLimiter, async (req, res) => {
try {
const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            error: "Please send a message."
        });
    }

    const conversation = messages
        .filter(message =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
        )
        .slice(-10)
        .map(message => ({
            role: message.role,
            content: message.content.slice(0, 3000)
        }));

    if (
        conversation.length === 0 ||
        conversation[conversation.length - 1].role !== "user"
    ) {
        return res.status(400).json({
            error: "A valid user message is required."
        });
    }

    const systemPrompt = `

You are DENIS AI, the official AI assistant for
DENIS GODSON GLOBAL VENTURES.

The business is owned, managed and led by Denis Godson.

IMPORTANT COMPANY INFORMATION:
- Owner: Denis Godson
- Manager: Denis Godson
- Chief Executive Officer (CEO): Denis Godson

The business provides:
- Graphic designing
- Web development
- Branding
- Digital marketing

Your responsibilities:

1. Welcome visitors politely.
2. Explain the business services clearly.
3. Help visitors understand which service may suit their needs.
4. Answer general questions about the website.
5. Direct interested visitors to the contact page or WhatsApp.
6. When visitors ask who owns, manages or is the CEO
   of DENIS GODSON GLOBAL VENTURES, clearly answer
   that Denis Godson is the owner, manager and CEO.
   
Rules:

- Be friendly, professional, clear and helpful.

- Keep answers reasonably concise.

- Do not invent business addresses, opening hours, completed projects,
  customer reviews, prices or guarantees.

- If you do not know a business detail, direct the visitor to the contact page.

- Do not claim that a booking or payment has been confirmed.

- Never ask visitors for passwords, API keys or bank PINs.

- You are an AI assistant, not a human employee.
  `;
  
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
              model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
              messages: [
                  {
                      role: "system",
                      content: systemPrompt
                  },
                  ...conversation
              ],
              temperature: 0.7,
              max_tokens: 800
          })
      }
  );

  const data = await groqResponse.json();

  if (!groqResponse.ok) {
      console.error("Groq API error:", {
          status: groqResponse.status,
          error: data
      });

      return res.status(502).json({
          error: "DENIS AI could not respond right now. Please try again."
      });
  }

  const answer =
      data.choices?.[0]?.message?.content?.trim();

  if (!answer) {
      console.error("Groq returned an empty response.");

      return res.status(502).json({
          error: "DENIS AI received an empty response. Please try again."
      });
  }

  res.json({ reply: answer });
  
  } catch (error) {
  console.error("Server error:", error);
  
    res.status(500).json({
      error: "Something went wrong. Please try again later."
  });
  
  }
  });

// Serve website files.
app.use(express.static(__dirname, {
index: false,
dotfiles: "deny"
}));

// Display index.html.
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "index.html"));
});

// Handle unknown pages.
app.use((req, res) => {
res.status(404).send("Page not found.");
});

// Start server.
app.listen(PORT, "0.0.0.0", () => {
console.log("DENIS GODSON GLOBAL VENTURES running on port ${PORT}");
});