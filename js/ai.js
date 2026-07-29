// AI Chat Module – Complete with OpenRouter

var aiChatMessages = [];
var isAIOpen = false;
var aiInitialized = false;

// ============================================================
// TOGGLE AI CHAT
// ============================================================
function toggleAIChat() {
    if (isAIOpen) {
        closeAIChat();
    } else {
        openAIChat();
    }
}

// ============================================================
// OPEN AI CHAT
// ============================================================
function openAIChat() {
    if (isAIOpen) return;
    
    var container = document.getElementById('aiChatContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'aiChatContainer';
        container.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 380px;
            max-width: 90vw;
            height: 500px;
            max-height: 70vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.3);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(container);
        
        if (!document.getElementById('aiStyles')) {
            var style = document.createElement('style');
            style.id = 'aiStyles';
            style.textContent = `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes slideDown {
                    from { opacity: 1; transform: translateY(0) scale(1); }
                    to { opacity: 0; transform: translateY(20px) scale(0.95); }
                }
                .ai-message {
                    padding: 10px 14px;
                    border-radius: 16px;
                    max-width: 85%;
                    margin: 4px 0;
                    word-wrap: break-word;
                    font-size: 13px;
                    line-height: 1.5;
                }
                .ai-message.user {
                    background: #0f172a;
                    color: #fff;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }
                .ai-message.assistant {
                    background: rgba(241, 245, 249, 0.8);
                    color: #0f172a;
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                }
                .ai-message.error {
                    background: rgba(239, 68, 68, 0.15);
                    color: #dc2626;
                    align-self: flex-start;
                    border-left: 3px solid #ef4444;
                }
                .ai-message .typing-dots span {
                    display: inline-block;
                    animation: dotPulse 1.4s infinite both;
                }
                .ai-message .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .ai-message .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dotPulse {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,0.06);flex-shrink:0;background:rgba(255,255,255,0.5);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:24px;">🤖</span>
                <span style="font-weight:700;font-size:16px;">AI Assistant</span>
                <span style="font-size:10px;background:rgba(99,102,241,0.15);color:#6366f1;padding:2px 10px;border-radius:10px;">Beta</span>
            </div>
            <button onclick="closeAIChat()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;padding:4px;">✕</button>
        </div>
        <div id="aiMessages" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:4px;min-height:0;">
            <div class="ai-message assistant" style="max-width:90%;">
                👋 Hi! I'm your AI assistant. Ask me anything about wellness, productivity, or just chat!
            </div>
        </div>
        <div style="padding:12px 16px;border-top:1px solid rgba(0,0,0,0.06);display:flex;gap:8px;flex-shrink:0;background:rgba(255,255,255,0.3);">
            <input type="text" id="aiInput" placeholder="Ask me anything..." style="flex:1;padding:10px 14px;border:1px solid rgba(0,0,0,0.08);border-radius:20px;outline:none;font-size:13px;background:rgba(255,255,255,0.5);" onkeypress="if(event.key==='Enter')sendAIMessage()" />
            <button onclick="sendAIMessage()" style="background:#0f172a;color:#fff;border:none;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">➤</button>
        </div>
    `;
    
    loadAIChatHistory();
    isAIOpen = true;
    setTimeout(function() {
        var input = document.getElementById('aiInput');
        if (input) input.focus();
    }, 300);
}

function closeAIChat() {
    var container = document.getElementById('aiChatContainer');
    if (container) {
        container.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(function() {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 300);
    }
    isAIOpen = false;
}

function sendAIMessage() {
    var input = document.getElementById('aiInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.disabled = true;
    addAIMessage('user', text);
    showAITyping();
    callAIApi(text)
        .then(function(response) {
            hideAITyping();
            if (response) {
                addAIMessage('assistant', response);
                saveAIChatHistory();
            } else {
                addAIMessage('error', '⚠️ I couldn\'t process that. Please try again.');
            }
        })
        .catch(function(error) {
            hideAITyping();
            console.error('AI Error:', error);
            var errorMsg = '⚠️ Error: ';
            if (error.message) {
                errorMsg += error.message;
            } else {
                errorMsg += 'Please try again later.';
            }
            addAIMessage('error', errorMsg);
        })
        .finally(function() {
            input.disabled = false;
            input.focus();
        });
}

// ============================================================
// CALL AI API - Using Vercel proxy
// ============================================================
function callAIApi(userMessage) {
    return new Promise(function(resolve, reject) {
        var messages = [
            {
                role: 'system',
                content: 'You are a helpful, friendly AI assistant for a wellness and social app called Winchu · Nexus. You help users with productivity, wellness, motivation, and general questions. Keep responses concise, warm, and encouraging. You can also help with social advice and personal growth tips. Keep responses under 150 words unless asked for more detail.'
            }
        ];
        
        var history = aiChatMessages.slice(-6);
        history.forEach(function(msg) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });
        
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        var timeoutId = setTimeout(function() {
            reject(new Error('Request timed out. Please try again.'));
        }, 30000);
        
        fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messages })
        })
        .then(function(response) {
            clearTimeout(timeoutId);
            if (!response.ok) {
                return response.json().then(function(errData) {
                    var errorMsg = 'API Error: ' + response.status;
                    if (errData && errData.error) {
                        errorMsg = errData.error;
                    }
                    throw new Error(errorMsg);
                });
            }
            return response.json();
        })
        .then(function(data) {
            if (data && data.choices && data.choices.length > 0) {
                var content = data.choices[0].message.content;
                if (content) {
                    resolve(content.trim());
                    return;
                }
            }
            reject(new Error('Invalid response format from AI'));
        })
        .catch(function(error) {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

function addAIMessage(role, content) {
    var container = document.getElementById('aiMessages');
    if (!container) return;
    var messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message ' + role;
    messageDiv.textContent = content;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    if (role === 'user' || role === 'assistant') {
        aiChatMessages.push({ role: role, content: content });
        if (aiChatMessages.length > 50) {
            aiChatMessages = aiChatMessages.slice(-50);
        }
    }
}

function showAITyping() {
    var container = document.getElementById('aiMessages');
    if (!container) return;
    hideAITyping();
    var typingDiv = document.createElement('div');
    typingDiv.id = 'aiTyping';
    typingDiv.className = 'ai-message assistant';
    typingDiv.innerHTML = '<div class="typing-dots"><span>●</span><span>●</span><span>●</span></div>';
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideAITyping() {
    var typing = document.getElementById('aiTyping');
    if (typing && typing.parentNode) {
        typing.parentNode.removeChild(typing);
    }
}

function saveAIChatHistory() {
    try {
        localStorage.setItem('winchu_ai_chat', JSON.stringify(aiChatMessages));
    } catch(e) {}
}

function loadAIChatHistory() {
    try {
        var data = localStorage.getItem('winchu_ai_chat');
        if (data) {
            var parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                aiChatMessages = parsed;
                var container = document.getElementById('aiMessages');
                if (container) {
                    container.innerHTML = '';
                    aiChatMessages.forEach(function(msg) {
                        var messageDiv = document.createElement('div');
                        messageDiv.className = 'ai-message ' + msg.role;
                        messageDiv.textContent = msg.content;
                        container.appendChild(messageDiv);
                    });
                    container.scrollTop = container.scrollHeight;
                }
                return;
            }
        }
    } catch(e) {}
    aiChatMessages = [];
}

function createAIFloatingButton() {
    var existing = document.getElementById('aiFab');
    if (existing) {
        existing.parentNode.removeChild(existing);
    }
    
    var button = document.createElement('button');
    button.id = 'aiFab';
    button.innerHTML = '🤖';
    button.style.cssText = `
        position: fixed;
        bottom: 150px;
        right: 20px;
        z-index: 9998;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        font-size: 24px;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        transition: all 0.3s ease;
        display: flex !important;
        align-items: center;
        justify-content: center;
    `;
    button.onclick = toggleAIChat;
    button.onmouseover = function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 30px rgba(99, 102, 241, 0.6)';
    };
    button.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
    };
    document.body.appendChild(button);
    
    var wpFab = document.getElementById('wpFab');
    if (wpFab && wpFab.style.display !== 'none') {
        button.style.bottom = '220px';
    }
    
    console.log('🤖 AI Floating button created');
    aiInitialized = true;
}

function initAI() {
    console.log('🤖 initAI called, S.username =', S ? S.username : 'undefined');
    if (!S || !S.username) {
        console.log('🤖 AI waiting for login...');
        setTimeout(initAI, 2000);
        return;
    }
    if (aiInitialized) {
        console.log('🤖 AI already initialized');
        return;
    }
    createAIFloatingButton();
}

function showAIButton() {
    createAIFloatingButton();
}

(function() {
    console.log('🤖 AI script loaded');
    if (typeof S !== 'undefined' && S && S.username) {
        setTimeout(initAI, 500);
    } else {
        console.log('🤖 Waiting for login...');
        var checkInterval = setInterval(function() {
            if (S && S.username && !aiInitialized) {
                clearInterval(checkInterval);
                initAI();
            }
        }, 2000);
        setTimeout(function() {
            clearInterval(checkInterval);
        }, 30000);
    }
})();

window.toggleAIChat = toggleAIChat;
window.openAIChat = openAIChat;
window.closeAIChat = closeAIChat;
window.sendAIMessage = sendAIMessage;
window.initAI = initAI;
window.showAIButton = showAIButton;

console.log('🤖 AI module loaded');