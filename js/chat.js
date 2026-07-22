// Chat Module

function renderChatList() {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>';
        return;
    }
    
    const friends = S.friends || [];
    const groups = S.groups || [];
    
    const allChats = [
        { name: 'Winchu Global', type: 'global', id: 'Winchu Global' },
        ...friends.map(f => ({ name: f, type: 'dm', id: f })),
        ...groups.map(g => ({ name: g.name, type: 'group', id: g.id }))
    ];
    
    if (allChats.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No chats. Add friends or create groups!</p>';
        return;
    }
    
    let html = '';
    allChats.forEach(chat => {
        const icon = chat.type === 'global' ? '🌐' : chat.type === 'group' ? '👥' : '👤';
        html += `<div class="chat-list-item" onclick="openChat('${chat.id}','${chat.type}')">
            <div class="avatar">${icon}</div>
            <div class="info">
                <div class="name">${chat.name}</div>
                <div class="last-msg">${chat.type === 'global' ? 'Community chat' : chat.type === 'group' ? 'Group chat' : 'Direct message'}</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    document.getElementById('chatWindow').style.display = 'none';
    container.style.display = 'block';
}

function openChat(chatId, type) {
    if (!S.username) { toast('Please log in'); return; }
    
    currentChat = chatId;
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    document.getElementById('chatWith').textContent = chatId;
    
    loadChatMessages(chatId);
    setupChatListener(chatId);
}

function closeChat() {
    currentChat = null;
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    
    if (chatListener) {
        chatListener.off();
        chatListener = null;
    }
}

function loadChatMessages(chatId) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Loading messages...</p>';
    
    getRef('chats/' + chatId).orderByKey().limitToLast(50).once('value', (snapshot) => {
        const data = snapshot.val();
        chatMessages = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                const msg = data[key];
                msg.id = key;
                chatMessages.push(msg);
            });
        }
        
        renderChatMessages();
    });
}

function setupChatListener(chatId) {
    if (chatListener) chatListener.off();
    
    chatListener = getRef('chats/' + chatId).orderByKey().limitToLast(50);
    
    chatListener.on('child_added', (snapshot) => {
        const msg = snapshot.val();
        msg.id = snapshot.key;
        
        if (!chatMessages.find(m => m.id === msg.id)) {
            chatMessages.push(msg);
            renderChatMessages();
        }
    });
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">No messages yet. Say hello! 👋</p>';
        return;
    }
    
    let html = '';
    chatMessages.forEach(m => {
        const isMe = m.username === S.username;
        const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        html += `<div class="chat-row ${isMe ? 'sent' : 'received'}">
            <div class="bubble-wrap">
                <div class="chat-bubble ${isMe ? 'chat-sent' : 'chat-received'}">
                    ${!isMe ? `<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:2px;cursor:pointer;" onclick="viewUserProfile('${m.username}')">${m.username}</div>` : ''}
                    <span style="word-break:break-word;">${escapeHtml(m.text)}</span>
                    <div style="font-size:9px;opacity:0.6;text-align:${isMe ? 'right' : 'left'};margin-top:3px;">${time}</div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    if (!currentChat || !S.username) {
        toast('Select a chat first');
        return;
    }
    
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) {
        toast('Type a message');
        return;
    }
    
    const message = {
        username: S.username,
        text: text,
        time: new Date().toISOString()
    };
    
    pushData('chats/' + currentChat, message).then(() => {
        input.value = '';
        input.focus();
    }).catch(() => {
        toast('Failed to send message');
    });
}