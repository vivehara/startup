import os
import ast
import json

# Replace the hardcoded token string with this:
hf_token = os.getenv("HF_TOKEN")

import gradio as gr
from huggingface_hub import InferenceClient

# 1. Initialize our free backend model engine
client = InferenceClient(model="Qwen/Qwen2.5-Coder-32B-Instruct")


def normalize_response_text(response):
    def extract_from_dict(d):
        if d.get("type") == "text" and "text" in d:
            return d["text"]
        for key in ("text", "content", "message", "output", "generated_text", "response", "result"):
            if key in d and d[key] is not None:
                return d[key]
        if "payload" in d and d["payload"] is not None:
            return d["payload"]
        if "data" in d and d["data"] is not None:
            return d["data"]
        if "choices" in d and d["choices"]:
            return d["choices"][0]
        return None

    while True:
        if response is None:
            return ""

        if isinstance(response, str):
            response = response.strip()
            # Parse structured data FIRST before any encoding changes
            if response.startswith("[") or response.startswith("{"):
                try:
                    response = ast.literal_eval(response)
                    continue
                except Exception:
                    try:
                        response = json.loads(response)
                        continue
                    except Exception:
                        pass
            # Only fix encoding on plain text
            try:
                response = response.encode("latin-1").decode("utf-8", errors="replace")
            except Exception:
                pass
            return response

        if isinstance(response, (int, float, bool)):
            return str(response)

        if isinstance(response, list):
            if not response:
                return ""
            for item in response:
                if isinstance(item, dict):
                    extracted = extract_from_dict(item)
                    if extracted is not None:
                        response = extracted
                        break
                    if "choices" in item and item["choices"]:
                        response = item["choices"][0]
                        break
            else:
                response = response[0]
            continue

        if isinstance(response, dict):
            extracted = extract_from_dict(response)
            if extracted is not None:
                response = extracted
                continue
            return "[Unable to parse response]"

        if hasattr(response, "message"):
            response = getattr(response, "message")
            continue
        if hasattr(response, "choices"):
            choices = getattr(response, "choices")
            if choices:
                response = choices[0]
                continue
        if hasattr(response, "generations"):
            generations = getattr(response, "generations")
            if generations:
                response = generations[0]
                continue
        if hasattr(response, "text"):
            response = getattr(response, "text")
            continue
        if hasattr(response, "content"):
            response = getattr(response, "content")
            continue
        if hasattr(response, "__dict__"):
            response = vars(response)
            continue

        return str(response).strip()

# Add this small helper at the top of chat_with_agent
def safe_content(text):
    if isinstance(text, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in text
        ).strip()
    return str(text).strip() if text else ""


# 2. Main execution logic for processing conversations
def chat_with_agent(message, system_prompt, temperature, max_tokens, top_p, history):
    if not message or not message.strip():
        return "", history if history else []
    
    # Initialize history as empty list if None
    if history is None:
        history = []
    
    # Create a new history list to avoid modifying the original
    chat_history = list(history) if history else []
    
    # Build messages for the API - convert Gradio format to API format
    messages = [{"role": "system", "content": str(system_prompt).strip()}]
    
    # Append the back-and-forth chat history to maintain conversation state
    for entry in chat_history:
        # Handle both dict format (new Gradio) and tuple format (legacy)
        if isinstance(entry, dict):
            if entry.get("role") and entry.get("content"):
                messages.append({
                    "role": entry["role"],
                    "content": safe_content(entry["content"])
                })
        elif isinstance(entry, (tuple, list)) and len(entry) >= 2:
            user_msg, bot_msg = entry[0], entry[1]
            if user_msg and isinstance(user_msg, str) and user_msg.strip():
                messages.append({"role": "user", "content": safe_content(user_msg)})
            if bot_msg and isinstance(bot_msg, str) and bot_msg.strip():
                messages.append({"role": "assistant", "content": safe_content(bot_msg)})
    
    # Append the newest prompt from the user
    messages.append({"role": "user", "content": message.strip()})
    
    try:
        # Validate messages before sending
        for msg in messages:
            if not isinstance(msg.get("role"), str) or not isinstance(msg.get("content"), str):
                raise ValueError(f"Invalid message format: {msg}")

        # Request a response from the model
        response = client.chat_completion(
            messages=messages,
            temperature=float(temperature),
            max_tokens=int(max_tokens),
            top_p=float(top_p)
        )

        # Extract the raw assistant payload and normalize it to clean text
        raw_response = response
        if hasattr(raw_response, "choices") and raw_response.choices:
            choice = raw_response.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                raw_response = choice.message.content
            else:
                raw_response = choice
        elif hasattr(raw_response, "content"):
            raw_response = raw_response.content

        # Guard against content block list format from API
        if isinstance(raw_response, list):
            raw_response = " ".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in raw_response
            ).strip() or raw_response

        bot_response = normalize_response_text(raw_response)
        if not bot_response.strip():
            bot_response = "⚠️ No response received from the model."

        # Add to history in Gradio's expected format
        chat_history.append({"role": "user", "content": message.strip()})
        chat_history.append({"role": "assistant", "content": bot_response})

    except Exception as e:
        error_msg = f"⚠️ **Error:** `{str(e)}`"
        chat_history.append({"role": "user", "content": message.strip()})
        chat_history.append({"role": "assistant", "content": error_msg})

    return "", chat_history

# 3. Formulate the dynamic Split-Screen layout (Theme removed from here)
with gr.Blocks() as demo:
    
    # Left Hand Column: Sidebar Settings Engine (Title keyword removed)
    with gr.Sidebar(position="left"):
        gr.Markdown("## 👾 Agent Upgrade Station ")
        gr.Markdown("### 🕹️ Precision Knob Twist")
        
        system_prompt = gr.Textbox(
            label="Expert/Mentor",
            value="You are an expert AI Mentor and Trainer. Guide the user step-by-step through their goals.",
            lines=4,
            placeholder="Define the behavior boundaries or operational logic..."
        )
        
        temperature_slider = gr.Slider(
            minimum=0.1, maximum=1.0, value=0.7, step=0.1, 
            label="Crank up for Creativity", info="Temperature controls how creative or predictable the AI's responses."
        )
        
        max_tokens_slider = gr.Slider(
            minimum=50, maximum=1000, value=250, step=25, 
            label="Max Tokens", info="Controls maximum length of generated response."
        )
        
        top_p_slider = gr.Slider(
            minimum=0.1, maximum=1.0, value=0.9, step=0.1, 
            label="Top P (Nucleus Sampling)", info="Low hits the bullseye. High brings surprises."
        )
        
        clear_btn = gr.Button("Clear Session History", variant="stop")

    # Right Hand Column: Primary Main Workspace Canvas
    gr.HTML("""
        <div style='display: flex; align-items: center; gap: 10px; white-space: nowrap;'>
        <img src='https://huggingface.co/spaces/vivehara/Mentor_Trainer/resolve/main/ViVeHaRa_Logo.jpg' style='height: 45px; width: auto; display: block;'>
        <h2 style='margin: 0; padding: 0; font-size: 1.5em;'>VIVEHARA TECH</h2><br>
        <h3 style='margin: 0; padding: 0; font-size: 1.5em;'> 🚀 Your goals. Our mission. We exist for your success.</h3>
        </div>
    """)
    
    # gr.HTML("<h2 style='margin: 0; display: inline-block;'><img src='https://huggingface.co/spaces/vivehara/Mentor_Trainer/resolve/main/ViVeHaRa_Logo.jpg' style='height: 35px; vertical-align: middle; margin-right: 10px;'> <VIVEHARA - WE EXIST FOR YOUR SUCCESS</h2>")
    # gr.HTML("<p style='margin-top: 0px; margin-bottom: 1px; color: gray;'>...</p>")
    
    chatbot = gr.Chatbot(label="Your AI Response", height=500, elem_id="chatbot_area")
    gr.HTML("""
        <style>
            #chatbot_area .overflow-y-auto,
            #chatbot_area [class*="scroll"] {
                overflow-y: scroll !important;  /* always show, no flicker */
                scrollbar-width: thin;          /* Firefox */
            }
            #chatbot_area ::-webkit-scrollbar {
                width: 6px;
                display: block !important;
            }
            #chatbot_area ::-webkit-scrollbar-thumb {
                background-color: rgba(0,0,0,0.2);
                border-radius: 3px;
            }
        </style>
    """)
    
    gr.HTML("""
        <script>
        (function() {
            function scrollChat() {
                const root = document.getElementById("chatbot_area");
                if (!root) return;
                const nodes = [root, ...root.querySelectorAll("*")];
                for (const el of nodes) {
                    const style = window.getComputedStyle(el);
                    const overflowY = style.overflowY || style.overflow;
                    if (["auto", "scroll", "overlay"].includes(overflowY) && el.scrollHeight > el.clientHeight) {
                        el.scrollTop = el.scrollHeight;
                    }
                }
            }
            function observeChat() {
                const root = document.getElementById("chatbot_area");
                if (!root) return;
                const observer = new MutationObserver(() => scrollChat());
                observer.observe(root, { childList: true, subtree: true, characterData: true });
                scrollChat();
            }
            const tryInit = () => {
                const root = document.getElementById("chatbot_area");
                if (root) {
                    observeChat();
                } else {
                    setTimeout(tryInit, 300);
                }
            };
            tryInit();
            
        })();
        </script>
    """)

    with gr.Row():
        message_box = gr.Textbox(
            show_label=False,
            placeholder="Type your instruction or prompt message here...",
            scale=5
        )
        send_button = gr.Button("Send Prompt", variant="primary", scale=1)

    # 4. Bind UI parameters to listener networks
    inputs_list = [message_box, system_prompt, temperature_slider, max_tokens_slider, top_p_slider, chatbot]
    outputs_list = [message_box, chatbot]
    
    send_button.click(chat_with_agent, inputs=inputs_list, outputs=outputs_list)
    message_box.submit(chat_with_agent, inputs=inputs_list, outputs=outputs_list)
    
    # Set up session clearing functionality
    clear_btn.click(fn=lambda: (None, []), inputs=None, outputs=[message_box, chatbot])

# Pass theme configuration directly inside the launch method for Gradio 6.0
demo.launch(theme=gr.themes.Default(primary_hue="fuchsia", secondary_hue="blue"))
