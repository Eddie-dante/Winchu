// ==================== CHAT LOGIC ====================
function setupMessagesListener() {
    if (window.messagesListener) {
        window.messagesListener.off();
    }
    const messagesRef = getRef('messages');
    window.messagesListener = messagesRef.orderByKey().limitToLast(50);
    window.messagesListener.on('child_added', function(snapshot) {
        const msg = snapshot.val();
        msg.id = snapshot.key;
        window.chatMessages.push(msg);
        if (window.chatMessages.length > 50) window.chatMessages.shift();
        renderChatMessages();
    });
}
window.setupMessagesListener = setupMessagesListener;

function sendMessage() {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const message = {
        username: window.S.username,
        text: text,
        time: new Date().toISOString()
    };
    const messagesRef = getRef('messages');
    messagesRef.push(message);
    input.value = '';
    if (window.S.username) {
        setData(`users/${window.S.username}/last_seen`, new Date().toISOString());
    }
}
window.sendMessage = sendMessage;

function renderChat() {
    document.getElementById('myUsername').textContent = window.S.username || '—';
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
window.renderChat = renderChat;

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (window.chatMessages.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">No messages yet.</p>';
        return;
    }
    container.innerHTML = window.chatMessages.map(m => {
        const me = m.username === window.S.username;
        const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<div style="display:flex;justify-content:${me ? 'flex-end' : 'flex-start'};margin:3px 0;"><div style="max-width:82%;"><div class="chat-bubble ${me ? 'chat-sent' : 'chat-received'}"><div style="font-size:10px;font-weight:600;opacity:0.7;">${m.username} · ${time}</div><p style="margin:2px 0 0;">${m.text}</p></div></div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}
window.renderChatMessages = renderChatMessages;

function changeUsername() {
    const newName = prompt('Enter new username:', window.S.username);
    if (newName && newName.trim()) {
        window.S.username = newName.trim();
        saveAuth();
        document.getElementById('myUsername').textContent = window.S.username;
        window.toast('Username updated');
        if (window.S.username) {
            setData(`users/${window.S.username}/username`, window.S.username);
            setData(`users/${window.S.username}/last_seen`, new Date().toISOString());
        }
    }
}
window.changeUsername = changeUsername;