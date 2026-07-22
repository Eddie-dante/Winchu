// Chat Module - Private DMs, Group Chats, Attachments, Location

let currentChatType = 'dm'; // 'dm', 'group', 'global'
let currentChatParticipants = [];

function renderChatList() {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>';
        return;
    }
    
    const friends = S.friends || [];
    const groups = S.groups || [];
    
    // DMs are only with friends (2 participants)
    const dmChats = friends.map(f => ({ name: f, type: 'dm', id: getDmChatId(S.username, f), participants: [S.username, f] }));
    
    // Groups
    const groupChats = groups.map(g => ({ name: g.name, type: 'group', id: g.id, participants: g.members || [] }));
    
    const allChats = [
        { name: 'Winchu Global', type: 'global', id: 'Winchu Global', participants: [] },
        ...dmChats,
        ...groupChats
    ];
    
    if (allChats.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No chats. Add friends or create groups!</p>';
        return;
    }
    
    let html = '';
    allChats.forEach(chat => {
        const icon = chat.type === 'global' ? '🌐' : chat.type === 'group' ? '👥' : '👤';
        const subtitle = chat.type === 'global' ? 'Community chat' : 
                        chat.type === 'group' ? `${chat.participants.length} members` : 
                        'Direct message';
        
        html += `<div class="chat-list-item" onclick="openChat('${chat.id}','${chat.type}',${JSON.stringify(chat.participants).replace(/"/g, '&quot;')})">
            <div class="avatar">${icon}</div>
            <div class="info">
                <div class="name">${chat.name}</div>
                <div class="last-msg">${subtitle}</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    document.getElementById('chatWindow').style.display = 'none';
    container.style.display = 'block';
}

// Generate consistent DM chat ID (always same for 2 participants)
function getDmChatId(user1, user2) {
    return [user1, user2].sort().join('_dm_');
}

function openChat(chatId, type, participants) {
    if (!S.username) { toast('Please log in'); return; }
    
    currentChat = chatId;
    currentChatType = type;
    currentChatParticipants = participants || [];
    
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    
    let chatName = chatId;
    if (type === 'dm') {
        const other = (participants || []).find(p => p !== S.username) || chatId;
        chatName = '@' + other;
    } else if (type === 'group') {
        const group = S.groups.find(g => g.id === chatId);
        chatName = group ? group.name : chatId;
    }
    
    document.getElementById('chatWith').textContent = chatName;
    
    loadChatMessages(chatId);
    setupChatListener(chatId);
    
    // Show/hide attachment buttons based on chat type
    const attachRow = document.getElementById('chatAttachRow');
    if (attachRow) {
        attachRow.style.display = (type === 'dm' || type === 'group') ? 'flex' : 'none';
    }
}

function closeChat() {
    currentChat = null;
    currentChatType = 'dm';
    currentChatParticipants = [];
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
    
    getRef('chats/' + chatId).orderByChild('time').limitToLast(100).once('value', (snapshot) => {
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
    
    chatListener = getRef('chats/' + chatId).orderByChild('time').limitToLast(100);
    
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
                    
                    ${m.type === 'image' ? `
                        <img src="${m.fileData}" style="max-width:200px;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open('${m.fileData}')" />
                    ` : m.type === 'video' ? `
                        <video src="${m.fileData}" controls style="max-width:200px;max-height:200px;border-radius:8px;"></video>
                    ` : m.type === 'location' ? `
                        <div style="cursor:pointer;" onclick="window.open('https://www.google.com/maps?q=${m.latitude},${m.longitude}', '_blank')">
                            <div style="background:rgba(99,102,241,0.2);padding:10px;border-radius:8px;">
                                📍 <strong>Shared Location</strong><br>
                                <span style="font-size:10px;">Lat: ${m.latitude}, Lng: ${m.longitude}</span><br>
                                <span style="font-size:10px;color:#6366f1;">Tap to view on map</span>
                            </div>
                        </div>
                    ` : m.type === 'file' ? `
                        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(0,0,0,0.05);border-radius:8px;">
                            📎 <strong style="font-size:11px;">${m.fileName || 'File'}</strong>
                            <button class="btn-sm" onclick="downloadMedia('${m.fileData}','${m.fileName}')" style="font-size:9px;">⬇️</button>
                        </div>
                    ` : `
                        <span style="word-break:break-word;">${escapeHtml(m.text || '')}</span>
                    `}
                    
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
        type: 'text',
        time: new Date().toISOString()
    };
    
    pushData('chats/' + currentChat, message).then(() => {
        input.value = '';
        input.focus();
    }).catch(() => {
        toast('Failed to send message');
    });
}

// Attach file to chat
function attachFileToChat() {
    document.getElementById('chatFileInput').click();
}

function handleChatFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`File too large (max ${maxSize/(1024*1024)}MB)`);
        return;
    }
    
    toast('Uploading...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        
        const message = {
            username: S.username,
            type: type,
            fileData: e.target.result,
            fileName: file.name,
            time: new Date().toISOString()
        };
        
        pushData('chats/' + currentChat, message).then(() => {
            toast('📎 File sent!');
        }).catch(() => {
            toast('Failed to send file');
        });
    };
    reader.readAsDataURL(file);
}

// Share location
function shareLocation() {
    if (!navigator.geolocation) {
        toast('Geolocation not supported');
        return;
    }
    
    toast('📍 Getting location...');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const message = {
                username: S.username,
                type: 'location',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                time: new Date().toISOString()
            };
            
            pushData('chats/' + currentChat, message).then(() => {
                toast('📍 Location shared!');
            }).catch(() => {
                toast('Failed to share location');
            });
        },
        (error) => {
            toast('Location error: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

console.log('💬 Chat module loaded with attachments and location');