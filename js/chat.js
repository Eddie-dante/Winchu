// Chat System Module
window.currentChat = null;
window.chatMessages = [];
window.chatListener = null;
window.typingTimeout = null;

// Render Chat List
window.renderChatList = function() {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    if (!window.S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>';
        return;
    }

    const friends = window.S.friends || [];
    const allChats = ['Winchu Global', ...friends];
    
    if (allChats.length === 0) {
        container.innerHTML = `
            <p style="color:#94a3b8;text-align:center;padding:20px;">
                No chats yet.<br>
                <button class="btn-sm" onclick="window.navigate('users')" style="margin-top:10px;">👥 Find Friends</button>
            </p>`;
        return;
    }
    
    let html = '';
    allChats.forEach(chat => {
        const isGroup = chat === 'Winchu Global';
        const icon = isGroup ? '🌐' : '👤';
        html += `
            <div class="chat-list-item" onclick="window.openChat('${chat}', ${isGroup})">
                <div class="avatar">${icon}</div>
                <div class="info">
                    <div class="name">${chat}</div>
                    <div class="last-msg">${isGroup ? 'Community chat' : 'Friend'}</div>
                </div>
            </div>`;
    });
    
    container.innerHTML = html;
    
    // Show list, hide window
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) chatWindow.style.display = 'none';
    if (container) container.style.display = 'block';
};

// Open Chat
window.openChat = function(chatName, isGroup) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    window.currentChat = chatName;
    
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    document.getElementById('chatWith').textContent = chatName;
    
    loadChatMessages(chatName);
    setupChatListener(chatName);
    setupTypingIndicator(chatName);
};

// Close Chat
window.closeChat = function() {
    window.currentChat = null;
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    
    if (window.chatListener) {
        window.chatListener.off();
        window.chatListener = null;
    }
};

// Load Chat Messages
function loadChatMessages(chatName) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Loading messages...</p>';
    
    const chatRef = getRef('chats/' + chatName);
    chatRef.orderByKey().limitToLast(50).once('value', (snapshot) => {
        const data = snapshot.val();
        window.chatMessages = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                const msg = data[key];
                msg.id = key;
                window.chatMessages.push(msg);
            });
        }
        
        renderChatMessages();
    });
}

// Setup Chat Listener
function setupChatListener(chatName) {
    if (window.chatListener) {
        window.chatListener.off();
    }
    
    const chatRef = getRef('chats/' + chatName);
    window.chatListener = chatRef.orderByKey().limitToLast(50);
    
    window.chatListener.on('child_added', (snapshot) => {
        const msg = snapshot.val();
        msg.id = snapshot.key;
        
        if (!window.chatMessages.find(m => m.id === msg.id)) {
            window.chatMessages.push(msg);
            renderChatMessages();
        }
    });
}

// Setup Typing Indicator
function setupTypingIndicator(chatName) {
    const typingRef = getRef('typing/' + chatName);
    typingRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const indicator = document.getElementById('typingIndicator');
        
        if (data && data.username && data.username !== window.S.username) {
            indicator.textContent = `${data.username} is typing...`;
            indicator.style.display = 'block';
            
            clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        } else {
            indicator.style.display = 'none';
        }
    });
}

// Render Chat Messages
function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (window.chatMessages.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">No messages yet. Say hello! 👋</p>';
        return;
    }
    
    let html = '';
    window.chatMessages.forEach(m => {
        const isMe = m.username === window.S.username;
        const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div style="display:flex;justify-content:${isMe ? 'flex-end' : 'flex-start'};margin:3px 0;">
                <div style="max-width:82%;">
                    <div class="chat-bubble ${isMe ? 'chat-sent' : 'chat-received'}">
                        ${!isMe ? `<div style="font-size:10px;font-weight:600;opacity:0.7;">${m.username} · ${time}</div>` : ''}
                        <p style="margin:2px 0 0;">${escapeHtml(m.text)}</p>
                        ${isMe ? `<div style="font-size:9px;opacity:0.7;text-align:right;">${time}</div>` : ''}
                    </div>
                </div>
            </div>`;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// Send Chat Message
window.sendChatMessage = function() {
    if (!window.currentChat) {
        window.toast('No chat selected');
        return;
    }
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) {
        window.toast('Type a message');
        return;
    }
    
    const message = {
        username: window.S.username,
        text: text,
        time: new Date().toISOString()
    };
    
    const chatRef = getRef('chats/' + window.currentChat);
    chatRef.push(message)
        .then(() => {
            input.value = '';
            input.focus();
        })
        .catch(err => {
            console.error('Send error:', err);
            window.toast('Failed to send message');
        });
    
    // Update typing indicator
    const typingRef = getRef('typing/' + window.currentChat);
    typingRef.set({ username: window.S.username });
    setTimeout(() => typingRef.remove(), 2000);
};

// Typing event handler
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        let typingTimer;
        chatInput.addEventListener('input', () => {
            if (!window.currentChat || !window.S.username) return;
            
            const typingRef = getRef('typing/' + window.currentChat);
            typingRef.set({ username: window.S.username });
            
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                typingRef.remove();
            }, 2000);
        });
    }
});

// HTML escape utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('💬 Chat module loaded');