// Chat Module - Complete with private DMs, group chats, attachments, location sharing

var currentChat = null;
var chatMessages = [];
var chatListener = null;
var currentChatType = 'dm';
var currentChatParticipants = [];
var processedMsgIds = {};

// ============================================================
// RENDER CHAT LIST
// ============================================================
function renderChatList() {
    var container = document.getElementById('chatList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to see your chats.</p>';
        return;
    }
    
    var friends = S.friends || [];
    var groups = S.groups || [];
    
    var allChats = [];
    
    // Global chat
    allChats.push({
        name: 'Winchu Global',
        type: 'global',
        id: 'Winchu_Global',
        icon: '🌐',
        subtitle: 'Community chat for everyone'
    });
    
    // Private DMs
    friends.forEach(function(friend) {
        var dmId = [S.username, friend].sort().join('_dm_');
        allChats.push({
            name: friend,
            type: 'dm',
            id: dmId,
            icon: '👤',
            subtitle: 'Direct message'
        });
    });
    
    // Group chats
    groups.forEach(function(group) {
        allChats.push({
            name: group.name || 'Group',
            type: 'group',
            id: group.id,
            icon: '👥',
            subtitle: (group.members || []).length + ' members'
        });
    });
    
    if (allChats.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' +
            '<p>No chats yet.</p>' +
            '<p style="font-size:12px;">Add friends or create groups to start chatting!</p>' +
            '<button class="btn-sm" onclick="navigate(\'users\')" style="margin-top:10px;">👥 Find Friends</button>' +
            '</div>';
        return;
    }
    
    var html = '';
    allChats.forEach(function(chat) {
        html += '<div class="chat-list-item" onclick="openChat(\'' + chat.id + '\', \'' + chat.type + '\')">';
        html += '<div class="avatar">' + chat.icon + '</div>';
        html += '<div class="info">';
        html += '<div class="name">' + escapeHtml(chat.name) + '</div>';
        html += '<div class="last-msg">' + chat.subtitle + '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    document.getElementById('chatWindow').style.display = 'none';
    container.style.display = 'block';
}

// ============================================================
// OPEN CHAT
// ============================================================
function openChat(chatId, type) {
    if (!S.username) { toast('Please log in'); return; }
    
    currentChat = chatId;
    currentChatType = type;
    chatMessages = [];
    processedMsgIds = {};
    
    var chatWithEl = document.getElementById('chatWith');
    if (chatWithEl) {
        if (type === 'global') chatWithEl.textContent = '🌐 Winchu Global';
        else if (type === 'group') {
            var g = S.groups.find(function(x) { return x.id === chatId; });
            chatWithEl.textContent = '👥 ' + (g ? g.name : 'Group');
        } else {
            var fn = chatId.replace(S.username + '_dm_', '').replace('_dm_' + S.username, '');
            chatWithEl.textContent = '👤 @' + fn;
        }
    }
    
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    
    var attachRow = document.getElementById('chatAttachRow');
    if (attachRow) attachRow.style.display = (type === 'dm' || type === 'group') ? 'flex' : 'none';
    
    loadChatMessages(chatId);
    setupChatListener(chatId);
    
    setTimeout(function() {
        var ci = document.getElementById('chatInput');
        if (ci) ci.focus();
    }, 300);
}

// ============================================================
// CLOSE CHAT
// ============================================================
function closeChat() {
    currentChat = null;
    chatMessages = [];
    processedMsgIds = {};
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    if (chatListener) { chatListener.off(); chatListener = null; }
}

// ============================================================
// LOAD CHAT MESSAGES - Ordered by time
// ============================================================
function loadChatMessages(chatId) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Loading messages...</p>';
    
    chatMessages = [];
    processedMsgIds = {};
    
    getRef('chats/' + chatId).orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        chatMessages = [];
        processedMsgIds = {};
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var msg = data[key];
                if (msg && !processedMsgIds[key]) {
                    msg.id = key;
                    processedMsgIds[key] = true;
                    chatMessages.push(msg);
                }
            });
            
            // Sort by time ASCENDING (oldest first)
            chatMessages.sort(function(a, b) {
                return new Date(a.time) - new Date(b.time);
            });
        }
        
        console.log('Loaded ' + chatMessages.length + ' messages');
        renderChatMessages();
    });
}

// ============================================================
// SETUP CHAT LISTENER - No duplicates
// ============================================================
function setupChatListener(chatId) {
    if (chatListener) { chatListener.off(); chatListener = null; }
    
    chatListener = getRef('chats/' + chatId).orderByChild('time').limitToLast(100);
    
    chatListener.on('child_added', function(snapshot) {
        var msg = snapshot.val();
        var key = snapshot.key;
        if (!msg) return;
        if (processedMsgIds[key]) return;
        
        msg.id = key;
        processedMsgIds[key] = true;
        
        var existing = chatMessages.find(function(m) { return m.id === key; });
        if (!existing) {
            chatMessages.push(msg);
            chatMessages.sort(function(a, b) { return new Date(a.time) - new Date(b.time); });
            renderChatMessages();
        }
    });
}

// ============================================================
// RENDER CHAT MESSAGES
// ============================================================
function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;"><p>No messages yet.</p><p style="font-size:12px;">Say hello! 👋</p></div>';
        return;
    }
    
    var html = '';
    var lastDate = '';
    
    chatMessages.forEach(function(msg) {
        var isMe = msg.username === S.username;
        var msgDate = new Date(msg.time).toLocaleDateString();
        var msgTime = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Date separator
        if (msgDate !== lastDate) {
            html += '<div style="text-align:center;margin:12px 0;"><span style="background:rgba(0,0,0,0.05);padding:4px 12px;border-radius:10px;font-size:10px;color:#94a3b8;">' + msgDate + '</span></div>';
            lastDate = msgDate;
        }
        
        html += '<div class="chat-row ' + (isMe ? 'sent' : 'received') + '">';
        html += '<div class="bubble-wrap">';
        
        if (msg.type === 'image') {
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" style="padding:4px;">';
            if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;padding:0 6px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            html += '<img src="' + msg.fileData + '" style="max-width:200px;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open(\'' + msg.fileData + '\')" />';
            if (msg.text) html += '<div style="padding:4px 6px;font-size:12px;">' + escapeHtml(msg.text) + '</div>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';padding:2px 6px;">' + msgTime + '</div>';
            html += '</div>';
        } else if (msg.type === 'video') {
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" style="padding:4px;">';
            if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;padding:0 6px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            html += '<video src="' + msg.fileData + '" controls style="max-width:200px;max-height:200px;border-radius:8px;"></video>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';padding:2px 6px;">' + msgTime + '</div>';
            html += '</div>';
        } else if (msg.type === 'location') {
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" onclick="window.open(\'https://www.google.com/maps?q=' + msg.latitude + ',' + msg.longitude + '\',\'_blank\')" style="cursor:pointer;">';
            if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;">' + msg.username + '</div>';
            html += '<div style="background:rgba(99,102,241,0.2);padding:10px;border-radius:8px;">📍 <strong>Shared Location</strong><br><span style="font-size:10px;">Tap to view on map</span></div>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:4px;">' + msgTime + '</div>';
            html += '</div>';
        } else if (msg.type === 'file') {
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '">';
            if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;">' + msg.username + '</div>';
            html += '<div style="display:flex;align-items:center;gap:8px;">📎 <strong style="font-size:11px;">' + escapeHtml(msg.fileName || 'File') + '</strong>';
            html += '<button class="btn-sm" onclick="downloadMedia(\'' + msg.fileData + '\',\'' + (msg.fileName || 'file') + '\')" style="font-size:9px;padding:2px 8px;">⬇️</button></div>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:4px;">' + msgTime + '</div>';
            html += '</div>';
        } else {
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '">';
            if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:2px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            html += '<span style="word-break:break-word;">' + escapeHtml(msg.text || '') + '</span>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:3px;">' + msgTime + '</div>';
            html += '</div>';
        }
        
        html += '</div></div>';
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ============================================================
// SEND TEXT MESSAGE
// ============================================================
function sendChatMessage() {
    if (!currentChat || !S.username) { toast('Select a chat'); return; }
    
    var input = document.getElementById('chatInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    var message = { username: S.username, text: text, type: 'text', time: new Date().toISOString() };
    
    input.value = '';
    
    getRef('chats/' + currentChat).push(message).then(function() {
        // Message picked up by listener
    }).catch(function(err) {
        console.error('Send error:', err);
        input.value = text;
        toast('Failed to send');
    });
}

// ============================================================
// ATTACH FILE TO CHAT
// ============================================================
function attachFileToChat() { document.getElementById('chatFileInput').click(); }

function handleChatFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!currentChat) { toast('Select a chat'); event.target.value = ''; return; }
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) { toast('File too large'); event.target.value = ''; return; }
    
    toast('Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) {
        var type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
        var msg = { username: S.username, type: type, fileData: e.target.result, fileName: file.name, time: new Date().toISOString() };
        getRef('chats/' + currentChat).push(msg).then(function() { toast('Sent! 📎'); });
    };
    reader.readAsDataURL(file);
}

// ============================================================
// SHARE LOCATION
// ============================================================
function shareLocation() {
    if (!currentChat) { toast('Select a chat'); return; }
    if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
    
    toast('Getting location...');
    navigator.geolocation.getCurrentPosition(function(pos) {
        var msg = { username: S.username, type: 'location', latitude: pos.coords.latitude, longitude: pos.coords.longitude, time: new Date().toISOString() };
        getRef('chats/' + currentChat).push(msg).then(function() { toast('📍 Location shared!'); });
    }, function() { toast('Location error'); }, { enableHighAccuracy: true, timeout: 10000 });
}

// ============================================================
// DOWNLOAD MEDIA
// ============================================================
function downloadMedia(url, filename) {
    if (!url) return;
    if (url.startsWith('data:')) {
        var a = document.createElement('a'); a.href = url; a.download = filename || 'file'; a.click();
        toast('⬇️ Downloading...');
    }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderChatList = renderChatList;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
window.attachFileToChat = attachFileToChat;
window.handleChatFileSelect = handleChatFileSelect;
window.shareLocation = shareLocation;
window.downloadMedia = downloadMedia;

console.log('💬 Chat module loaded - fixed order and duplicates');