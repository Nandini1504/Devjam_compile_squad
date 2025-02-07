let promptInput = document.querySelector("#prompt");
let chatContainer = document.querySelector(".chat-container");
let aiSelection = document.querySelector("#aiSelection");
let selectedAI = aiSelection.value; // Default AI Model

const API_URLS = {
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDliZeiWoNgfeOvMtZGVtsTM-DLOJ0R-Do",
    huggingface: "https://api-inference.huggingface.co/models/bigscience/bloom",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    cohere: "https://api.cohere.ai/v1/generate"
};

const API_KEYS = {
    gemini: "AIzaSyDliZeiWoNgfeOvMtZGVtsTM-DLOJ0R-Do",
    huggingface: "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",
    openrouter: "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",
    cohere: ""
};

let user = { data: null };

function getGreeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good Morning!" : hour < 18 ? "Good Afternoon!" : "Good Evening!";
}

document.getElementById('greeting').textContent = getGreeting();

aiSelection.addEventListener("change", (event) => {
    selectedAI = event.target.value;
    console.log("Selected AI Model:", selectedAI);
});

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    let requestBody;
    let requestHeaders = { 'Content-Type': 'application/json' };

    if (selectedAI === "gemini") {
        requestBody = { "contents": [{ "parts": [{ "text": user.data }] }] };
    } else if (selectedAI === "huggingface") {
        requestHeaders["Authorization"] = `Bearer ${API_KEYS.huggingface}`;
        requestBody = { 
            inputs: user.data, 
            parameters: { 
                max_new_tokens: 300,
                temperature: 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.95
            } 
        };
    } else if (selectedAI === "openrouter") {
        requestHeaders["Authorization"] = `Bearer ${API_KEYS.openrouter}`;
        requestHeaders["HTTP-Referer"] = "https://your-site.com";
        requestHeaders["X-Title"] = "Multi-AI Chat App";
        requestBody = { 
            model: "gpt-3.5-turbo", 
            messages: [{ role: "user", content: user.data }] 
        };
    } else if (selectedAI === "cohere") {
        requestHeaders["Authorization"] = `Bearer ${API_KEYS.cohere}`;
        requestBody = { model: "command-r", prompt: user.data, max_tokens: 300 };
    }

    try {
        let response = await fetch(API_URLS[selectedAI], {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${selectedAI} API Error:`, response.status, errorText);
            text.innerHTML = `API Error: ${response.status} - ${errorText}`;
            return;
        }

        let data = await response.json();
        console.log(`Response from ${selectedAI}:`, data);

        let apiResponse = "No response.";

        if (selectedAI === "gemini") {
            apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response.";
        } else if (selectedAI === "huggingface") {
            apiResponse = data?.[0]?.generated_text?.trim() || 
                          data?.generated_text?.trim() || 
                          "No response from Hugging Face.";
        } else if (selectedAI === "openrouter") {
            apiResponse = data?.choices?.[0]?.message?.content?.trim() || "No response.";
        } else if (selectedAI === "cohere") {
            apiResponse = data?.generations?.[0]?.text?.trim() || "No response.";
        }

        text.innerHTML = apiResponse;
    } catch (error) {
        console.error(`${selectedAI} Fetch Error:`, error);
        text.innerHTML = `Error: ${error.message}`;
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handleChatResponse(message) {
    user.data = message;

    let userHtml = `
        <img id="userImage" src="user.png" alt="userImage" width="60">
        <div class="user-chat-area">${user.data}</div>
    `;
    promptInput.value = "";

    let userChatBox = createChatBox(userHtml, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        let aiHtml = `
            <img id="aiImage" src="ai.png" alt="aiImage" width="60">
            <div class="ai-chat-area">
                <img class="load" src="loading.gif" alt="Loading..." width="50px">
            </div>
        `;
        let aiChatBox = createChatBox(aiHtml, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && promptInput.value.trim() !== "") {
        handleChatResponse(promptInput.value);
    }
});

document.querySelector("#submit").addEventListener("click", () => {
    if (promptInput.value.trim() !== "") {
        handleChatResponse(promptInput.value);
    }
});