// =====================================
// DENIS GODSON GLOBAL VENTURES
// MAIN WEBSITE JAVASCRIPT
// =====================================


// AUTOMATIC COPYRIGHT YEAR
const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// MOBILE NAVIGATION MENU
const menuToggle = document.getElementById("menuToggle");
const navbar = document.querySelector(".navbar");

if (menuToggle && navbar) {
    menuToggle.addEventListener("click", function () {
        navbar.classList.toggle("active");
    });

    navbar.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navbar.classList.remove("active");
        });
    });
}


// DENIS AI CHAT ELEMENTS
const aiButton = document.getElementById("aiButton");
const chatWindow = document.getElementById("chatWindow");
const closeChat = document.getElementById("closeChat");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");


// STORE CHAT HISTORY
const conversation = [];


// OPEN DENIS AI
if (aiButton && chatWindow) {
    aiButton.addEventListener("click", function () {
        chatWindow.classList.add("active");
        aiButton.style.display = "none";

        if (chatInput) {
            chatInput.focus();
        }
    });
}


// CLOSE DENIS AI
if (closeChat && chatWindow && aiButton) {
    closeChat.addEventListener("click", function () {
        chatWindow.classList.remove("active");
        aiButton.style.display = "block";
    });
}


// DISPLAY CHAT MESSAGES
function displayMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.className =
        sender === "user" ? "user-message" : "bot-message";

    // Use textContent for safe text display.
    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// SEND MESSAGE TO GROK THROUGH YOUR BACKEND
if (chatForm && chatInput && chatMessages) {

    chatForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const message = chatInput.value.trim();

        if (!message) {
            return;
        }

        // Display visitor message.
        displayMessage(message, "user");

        conversation.push({
            role: "user",
            content: message
        });

        chatInput.value = "";

        const sendButton = chatForm.querySelector("button");

        if (sendButton) {
            sendButton.disabled = true;
        }

        // Typing indicator.
        const typingElement = document.createElement("div");

        typingElement.className = "bot-message";
        typingElement.textContent = "DENIS AI is thinking...";

        chatMessages.appendChild(typingElement);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {

            const response = await fetch("/api/chat", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    messages: conversation
                })
            });

            const data = await response.json();

            typingElement.remove();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to connect to DENIS AI."
                );
            }

            if (!data.reply) {
                throw new Error("No response received.");
            }

            // Display Grok's response.
            displayMessage(data.reply, "bot");

            conversation.push({
                role: "assistant",
                content: data.reply
            });

            // Keep only the latest 10 messages.
            if (conversation.length > 10) {
                conversation.splice(
                    0,
                    conversation.length - 10
                );
            }

        } catch (error) {

            typingElement.remove();

            displayMessage(
                "Sorry, DENIS AI is temporarily unavailable. Please try again later.",
                "bot"
            );

            console.error("DENIS AI Error:", error);

        } finally {

            if (sendButton) {
                sendButton.disabled = false;
            }

            chatInput.focus();
        }

    });

}