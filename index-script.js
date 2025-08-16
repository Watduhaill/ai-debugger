let chatHistory = [];

// Enable Tab indentation in textarea
window.addEventListener("DOMContentLoaded", () => {
  const codeInput = document.getElementById("codeInput");
  if (codeInput) {
    codeInput.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        // Insert 4 spaces for indentation (like Python IDLE)
        this.value =
          this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  }
  const storedUser = localStorage.getItem("username");
  if (storedUser) {
    document.getElementById("userDisplay").innerText = storedUser;
    document.getElementById("loginModal").style.display = "none";
  }
});

async function handleFormSubmit(e) {

}

// Clean up unwanted * at start/end of AI messages
function cleanMessage(text) {
  // Remove leading/trailing asterisks and whitespace
  return text.replace(/^\*+|\*+$/g, "").trim();
}

function addMessage(text, sender, isLoading = false) {
  const chat = document.getElementById("chat");
  const msgId = "msg-" + Date.now() + Math.random();
  const bubble = document.createElement("div");
  bubble.className =
    "chat-bubble " + (sender === "user" ? "chat-user" : "chat-ai");
  bubble.id = msgId;
  // Clean AI messages
  if (sender === "ai") {
    text = cleanMessage(text);
  }
  bubble.innerText = text;
  if (isLoading) bubble.style.opacity = 0.6;
  chat.appendChild(bubble);
  return msgId;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const codeInput = document.getElementById("codeInput");
  const code = codeInput.value.trim();
  if (!code) return;

  // Add user message to chat
  addMessage(code, "user");
  codeInput.value = "";
  scrollToBottom();

  //Analyzing bubble:
  let loadingInterval = null;

  function showLoadingBubble() {
    const chat = document.getElementById("chat");
    const msgId = "msg-loading";
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-ai";
    bubble.id = msgId;
    bubble.innerText = "Analyzing";
    chat.appendChild(bubble);

    let dotCount = 0;
    loadingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4; // 0,1,2,3
      bubble.innerText = "Analyzing" + ".".repeat(dotCount);
    }, 500);

    return msgId;
  }

  function removeLoadingBubble() {
    clearInterval(loadingInterval);
    const bubble = document.getElementById("msg-loading");
    if (bubble) bubble.remove();
  }

// Show animated loading bubble
showLoadingBubble();

  try {
    const response = await fetch("http://localhost:5000/explain-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    console.log("Response data:", data);
    // Remove loading bubble
    removeLoadingBubble();

    if (data.explanation) {
      addMessage(data.explanation, "ai");
    }
    // Always show bug summaries if present
    if (data.bug_summaries && data.bug_summaries.length > 0) {
      addMessage(
        "Detected issues:\n" +
          data.bug_summaries.map((s, i) => `${i + 1}. ${s}`).join("\n"),
        "ai"
      );
    }
    // If there is an error and nothing else, show it
    if (data.error && !data.explanation) {
      addMessage("Error: " + data.error, "ai");
    }
  } catch (err) {
    removeLoadingBubble();
    addMessage("Error: Could not connect to server.", "ai");
  }
  scrollToBottom();
  updateBugLog();
}

function addMessage(text, sender, isLoading = false) {
  const chat = document.getElementById("chat");
  const msgId = "msg-" + Date.now() + Math.random();
  const bubble = document.createElement("div");
  bubble.className =
    "chat-bubble " + (sender === "user" ? "chat-user" : "chat-ai");
  bubble.id = msgId;
  bubble.innerText = text;
  if (isLoading) bubble.style.opacity = 0.6;
  chat.appendChild(bubble);
  return msgId;
}

function removeMessage(msgId) {
  const bubble = document.getElementById(msgId);
  if (bubble) bubble.remove();
}

function scrollToBottom() {
  const chat = document.getElementById("chat");
  chat.scrollTop = chat.scrollHeight;
}

async function updateBugLog() {
  const logList = document.getElementById("logList");
  if (!logList) return;
  const resp = await fetch("http://localhost:5000/bug-log");
  const data = await resp.json();
  logList.innerHTML = "";
  if (data.log && data.log.length > 0) {
    data.log
      .slice()
      .reverse()
      .forEach((summary) => {
        const logEntry = document.createElement("li");
        logEntry.classList.add("mb-2", "bg-gray-700", "p-2", "rounded");
        logEntry.innerText = `Issue: ${summary}`;
        logList.appendChild(logEntry);
      });
  } else {
    const emptyMsg = document.createElement("li");
    emptyMsg.classList.add("text-gray-400", "italic");
    emptyMsg.innerText =
      "No bug history found. Start by submitting code to generate a log.";
    logList.appendChild(emptyMsg);
  }
}

window.onload = function () {
  updateBugLog();
};

function submitUsername() {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();
  if (username) {
    localStorage.setItem("username", username);
    document.getElementById("userDisplay").innerText = username;
    document.getElementById("loginModal").style.display = "none";
  } else {
    input.classList.add("border", "border-red-500");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const storedUser = localStorage.getItem("username");
  if (storedUser) {
    document.getElementById("userDisplay").innerText = storedUser;
    document.getElementById("loginModal").style.display = "none";
  }
});
