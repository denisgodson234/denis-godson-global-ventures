require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// Read JSON requests, with a size limit.
app.use(express.json({ limit: "20kb" }));

// Limit repeated requests to help prevent API abuse.
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        error: "Too many messages. Please wait a moment and try again."
    }
});

// Check that the API key exists.
if (!process.env.XAI_API_KEY) {
    console.error("ERROR: XAI_API_KEY is missing from your environment.");
    process.exit(1);
}

// Basic server status.
app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        assistant: "DENIS AI"
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

        // Keep only the latest 10 valid messages.
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
5. Encourage visitors who want a service to use the contact page
   or WhatsApp contact option.

Rules:
- Be friendly, professional, clear and helpful.
- Keep answers reasonably concise.
- Do not invent business addresses, opening hours, completed projects,
  customer reviews, prices or guarantees.
- If you do not know a business detail, say so and direct the visitor
  to the contact page.
- Do not claim that a booking or payment has been confirmed.
- Never ask visitors for passwords, API keys or bank PINs.
- You are an AI assistant, not a human employee.
`;

        // Send the conversation to Grok.
        const grokResponse = await fetch(
            "https://api.x.ai/v1/responses",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.XAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: process.env.XAI_MODEL || "grok-4.7",
                    instructions: systemPrompt,
                    input: conversation,
                    store: false
                })
            }
        );

        const data = await grokResponse.json();

        if (!grokResponse.ok) {
            console.error("Grok API error:", data);

            return res.status(502).json({
                error: "DENIS AI could not respond right now. Please try again."
            });
        }

        // Extract the text answer from the response.
        let answer = data.output_text || "";

        if (!answer && Array.isArray(data.output)) {
            for (const item of data.output) {
                if (item.type === "message" && Array.isArray(item.content)) {
                    answer += item.content
                        .filter(part => part.type === "output_text")
                        .map(part => part.text)
                        .join("");
                }
            }
        }

        if (!answer) {
            return res.status(502).json({
                error: "DENIS AI received an empty response. Please try again."
            });
        }

        res.json({
            reply: answer
        });

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            error: "Something went wrong. Please try again later."
        });
    }
});

// Start the server.
app.listen(PORT, () => {
    console.log(`DENIS AI server running on port ${PORT}`);
});