// ==================== CHAT LOGIC ====================
function setupMessagesListener() {
    if (messagesListener) {
        messagesListener.off();
    }
    const messagesRef = getRef('messages');
    messagesListener = messagesRef.orderByKey().limitToLast(50);
    messagesListener.on('child_added', function(snapshot) {
        const msg = snapshot.val();
        msg.id = snapshot.key;
        chatMessages.push(msg);
        if (chatMessages.length > 50) chatMessages.shift();
        renderChatMessages();
    });
}

function sendMessage() {
    if (!S.username) { toast('Please log in'); return; }
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const message = {
        username: S.username,
        text: text,
        time: new Date().toISOString()
    };
    const messagesRef = getRef('messages');
    messagesRef.push(message);
    input.value = '';
    if (S.username) {
        setData(`users/${S.username}/last_seen`, new Date().toISOString());
    }
}

function renderChat() {
    document.getElementById('myUsername').textContent = S.username || '—';
    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        const now = Date.now();
        let online = 0;
        Object.keys(users).forEach(u => {
            if (users[u].last_seen && (now - new Date(users[u].last_seen).getTime() < 60000)) {
                online++;
            }
        });
        document.getElementById('onlineCount').textContent = online;
    });
    setupMessagesListener();
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (chatMessages.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">No messages yet.</p>';
        return;
    }
    container.innerHTML = chatMessages.map(m => {
        const me = m.username === S.username;
        const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<div style="display:flex;justify-content:${me ? 'flex-end' : 'flex-start'};margin:3px 0;"><div style="max-width:82%;"><div class="chat-bubble ${me ? 'chat-sent' : 'chat-received'}"><div style="font-size:10px;font-weight:600;opacity:0.7;">${m.username} · ${time}</div><p style="margin:2px 0 0;">${m.text}</p></div></div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

function changeUsername() {
    const newName = prompt('Enter new username:', S.username);
    if (newName && newName.trim()) {
        S.username = newName.trim();
        saveAuth();
        document.getElementById('myUsername').textContent = S.username;
        toast('Username updated');
        if (S.username) {
            setData(`users/${S.username}/username`, S.username);
            setData(`users/${S.username}/last_seen`, new Date().toISOString());
        }
    }
}

// Expose
window.sendMessage = sendMessage;
window.changeUsername = changeUsername;
window.setupMessagesListener = setupMessagesListener;