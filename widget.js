/**
 * AI Agent Website Widget Loader
 * Generates an elegant, fully responsive floating widget on any website.
 * Reads window.AIAgentConfig for personalization parameters.
 */
(function () {
  // Wait for the DOM to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    // 1. Read global configuration
    const config = window.AIAgentConfig || {
      name: "Aura",
      role: "E-Commerce Assistant",
      emoji: "✨",
      themeColor: "emerald",
      greeting: "Hi! How can I assist you today?",
      position: "bottom-right",
      backendUrl: "", // Optional base URL of the backend (e.g., https://my-app.onrender.com)
    };

    // Prevent duplicate load
    if (document.getElementById("ai-widget-root")) return;

    // 2. Identify accent colors
    const colors = {
      emerald: "#059669",
      indigo: "#4f46e5",
      cyan: "#0891b2",
      rose: "#e11d48",
      amber: "#f59e0b",
      violet: "#7c3aed",
      orange: "#ea580c",
      slate: "#475569",
    };
    const activeColor = colors[config.themeColor] || colors.indigo;

    // 3. Create root elements
    const root = document.createElement("div");
    root.id = "ai-widget-root";
    root.style.position = "fixed";
    root.style.zIndex = "999999";
    root.style.bottom = "20px";
    if (config.position === "bottom-left") {
      root.style.left = "20px";
    } else {
      root.style.right = "20px";
    }
    root.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // 4. Inject visual styles
    const style = document.createElement("style");
    style.innerHTML = `
      #ai-widget-root * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .ai-widget-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${activeColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        border: none;
      }
      .ai-widget-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      }
      .ai-widget-box {
        position: absolute;
        bottom: 75px;
        width: 360px;
        height: 520px;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        display: none;
        flex-direction: column;
        overflow: hidden;
        transition: opacity 0.2s, transform 0.2s;
        opacity: 0;
        transform: translateY(10px);
      }
      @media (max-width: 480px) {
        .ai-widget-box {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          border-radius: 0;
        }
      }
      .ai-widget-box.open {
        display: flex;
        opacity: 1;
        transform: translateY(0);
      }
      .ai-widget-header {
        background-color: ${activeColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: justify;
        position: relative;
      }
      .ai-widget-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .ai-widget-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .ai-widget-title {
        font-weight: bold;
        font-size: 15px;
      }
      .ai-widget-subtitle {
        font-size: 11px;
        opacity: 0.85;
      }
      .ai-widget-close {
        position: absolute;
        right: 16px;
        top: 16px;
        background: transparent;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.8;
      }
      .ai-widget-close:hover {
        opacity: 1;
      }
      .ai-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background-color: #0b0f19;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ai-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
      }
      .ai-message.user {
        margin-left: auto;
        flex-direction: row-reverse;
      }
      .ai-msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      .ai-message.user .ai-msg-avatar {
        background: ${activeColor};
        color: white;
      }
      .ai-msg-text {
        padding: 10px 14px;
        font-size: 13px;
        line-height: 1.5;
        border-radius: 12px;
        color: #e2e8f0;
      }
      .ai-message.assistant .ai-msg-text {
        background: #1e293b;
        border: 1px solid #334155;
        border-top-left-radius: 0;
      }
      .ai-message.user .ai-msg-text {
        background: ${activeColor};
        color: white;
        border-top-right-radius: 0;
      }
      .ai-widget-input-form {
        display: flex !important;
        padding: 12px !important;
        background: #0f172a !important;
        border-top: 1px solid #1e293b !important;
        gap: 8px !important;
        box-sizing: border-box !important;
        width: 100% !important;
        align-items: center !important;
      }
      .ai-widget-input {
        flex: 1 !important;
        background-color: #1e293b !important;
        border: 1.5px solid #334155 !important;
        border-radius: 8px !important;
        padding: 10px 14px !important;
        color: #ffffff !important;
        font-size: 14px !important;
        outline: none !important;
        height: 42px !important;
        min-height: 42px !important;
        max-height: 42px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        display: block !important;
        line-height: normal !important;
      }
      .ai-widget-input:focus {
        border-color: ${activeColor} !important;
        background-color: #1a2333 !important;
      }
      .ai-widget-send {
        background-color: ${activeColor} !important;
        border: none !important;
        color: #ffffff !important;
        padding: 0 16px !important;
        height: 42px !important;
        min-height: 42px !important;
        max-height: 42px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        transition: background-color 0.2s !important;
      }
      .ai-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ai-widget-loading {
        align-self: flex-start;
        background: #1e293b;
        color: #94a3b8;
        padding: 8px 14px;
        border-radius: 12px;
        font-size: 12px;
        font-style: italic;
        display: none;
      }
    `;
    document.head.appendChild(style);

    // 5. Build Widget Template Layout HTML
    const aligns = config.position === "bottom-left" ? "left: 0;" : "right: 0;";
    root.innerHTML = `
      <div class="ai-widget-box" id="ai-widget-box" style="${aligns}">
        <div class="ai-widget-header">
          <div class="ai-widget-header-content">
            <div class="ai-widget-avatar">${config.emoji}</div>
            <div>
              <div class="ai-widget-title">${config.name}</div>
              <div class="ai-widget-subtitle">${config.role}</div>
            </div>
          </div>
          <button class="ai-widget-close" id="ai-widget-close">✕</button>
        </div>
        <div class="ai-widget-messages" id="ai-widget-messages">
          <div class="ai-message assistant">
            <div class="ai-msg-avatar">${config.emoji}</div>
            <div class="ai-msg-text">${config.greeting}</div>
          </div>
          <div class="ai-widget-loading" id="ai-widget-loading">Thinking...</div>
        </div>
        <form class="ai-widget-input-form" id="ai-widget-form">
          <input class="ai-widget-input" id="ai-widget-input" type="text" placeholder="Type a message..." required />
          <button class="ai-widget-send" id="ai-widget-send" type="submit">Send</button>
        </form>
      </div>
      <button class="ai-widget-btn" id="ai-widget-btn">
        ${config.emoji}
      </button>
    `;

    document.body.appendChild(root);

    // 6. Bind Event Listeners & State
    const box = document.getElementById("ai-widget-box");
    const btn = document.getElementById("ai-widget-btn");
    const closeBtn = document.getElementById("ai-widget-close");
    const form = document.getElementById("ai-widget-form");
    const input = document.getElementById("ai-widget-input");
    const messagesContainer = document.getElementById("ai-widget-messages");
    const loadingIndicator = document.getElementById("ai-widget-loading");

    let isChatActive = false;
    let chatHistory = [];

    btn.addEventListener("click", () => {
      isChatActive = !isChatActive;
      box.classList.toggle("open", isChatActive);
    });

    closeBtn.addEventListener("click", () => {
      isChatActive = false;
      box.classList.remove("open");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      input.value = "";
      input.disabled = true;

      // Add user message to history
      chatHistory.push({ role: "user", content: text });
      appendMessage("user", text);

      // Show loader
      loadingIndicator.style.display = "block";
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      try {
        const apiPath = (config.backendUrl || "").replace(/\/$/, "") + "/api/agent/chat";
        const response = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: config.name,
            role: config.role,
            tone: "Warm, professional, helpful",
            instructions: "You are the helper widget on the website.",
            searchGrounding: false,
            messages: chatHistory
          })
        });

        const result = await response.json();
        loadingIndicator.style.display = "none";

        if (response.ok && result.text) {
          chatHistory.push({ role: "assistant", content: result.text });
          appendMessage("assistant", result.text);
        } else {
          appendMessage("assistant", "Sorry, I am having trouble connecting right now. Please verify API configuration.");
        }
      } catch (err) {
        loadingIndicator.style.display = "none";
        appendMessage("assistant", "Sorry, a communication error occurred. Check server logs.");
      } finally {
        input.disabled = false;
        input.focus();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });

    function appendMessage(role, text) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `ai-message ${role}`;
      msgDiv.innerHTML = `
        <div class="ai-msg-avatar">${role === 'user' ? '👤' : config.emoji}</div>
        <div class="ai-msg-text">${text}</div>
      `;
      // Insert before the loader indicator
      messagesContainer.insertBefore(msgDiv, loadingIndicator);
    }
  }
})();
