// Chat Module - No duplicates, single send

var currentChat = null;
var chatMessages = [];
var chatListener = null;
var currentChatType = 'dm';
var currentChatParticipants = [];
var processedMsgIds = {};

function renderChatList() {
    var container = document.getElementById('chatList');
    if (!container) return;
    if (!S.username) { container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>'; return; }
    var friends = S.friends || [];
    var groups = S.groups || [];
    var allChats = [{ name: 'Winchu Global', type: 'global', id: 'Winchu_Global', icon: '🌐', subtitle: 'Community chat' }];
    friends.forEach(function(friend) { var dmId = [S.username, friend].sort().join('_dm_'); allChats.push({ name: friend, type: 'dm', id: dmId, icon: '👤', subtitle: 'Direct message' }); });
    groups.forEach(function(group) { allChats.push({ name: group.name || 'Group', type: 'group', id: group.id, icon: '👥', subtitle: (group.members || []).length + ' members' }); });
    if (allChats.length === 0) { container.innerHTML = '<div style="text-align:center;padding:30px;"><p>No chats yet.</p><button class="btn-sm" onclick="navigate(\'users\')" style="margin-top:10px;">👥 Find Friends</button></div>'; return; }
    var html = '';
    allChats.forEach(function(chat) { html += '<div class="chat-list-item" onclick="openChat(\'' + chat.id + '\', \'' + chat.type + '\')"><div class="avatar">' + chat.icon + '</div><div class="info"><div class="name">' + escapeHtml(chat.name) + '</div><div class="last-msg">' + chat.subtitle + '</div></div></div>'; });
    container.innerHTML = html;
    document.getElementById('chatWindow').style.display = 'none';
    container.style.display = 'block';
}

function openChat(chatId, type) {
    if (!S.username) { toast('Please log in'); return; }
    currentChat = chatId; currentChatType = type;
    chatMessages = []; processedMsgIds = {};
    var chatWithEl = document.getElementById('chatWith');
    if (chatWithEl) {
        if (type === 'global') chatWithEl.textContent = '🌐 Winchu Global';
        else if (type === 'group') { var g = S.groups.find(function(x) { return x.id === chatId; }); chatWithEl.textContent = '👥 ' + (g ? g.name : 'Group'); }
        else { var fn = chatId.replace(S.username + '_dm_', '').replace('_dm_' + S.username, ''); chatWithEl.textContent = '👤 @' + fn; }
    }
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    loadChatMessages(chatId);
}

function closeChat() {
    currentChat = null; chatMessages = []; processedMsgIds = {};
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    if (chatListener) { chatListener.off(); chatListener = null; }
}

function loadChatMessages(chatId) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Loading...</p>';
    chatMessages = []; processedMsgIds = {};
    if (chatListener) { chatListener.off(); chatListener = null; }
    firebase.database().ref('chats/' + chatId).orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        chatMessages = []; processedMsgIds = {};
        if (data) { Object.keys(data).forEach(function(key) { var msg = data[key]; if (msg && !processedMsgIds[key]) { msg.id = key; processedMsgIds[key] = true; chatMessages.push(msg); } }); chatMessages.sort(function(a, b) { return new Date(a.time) - new Date(b.time); }); }
        renderChatMessages();
    });
    chatListener = firebase.database().ref('chats/' + chatId).orderByChild('time').limitToLast(100);
    chatListener.on('child_added', function(snapshot) { var msg = snapshot.val(); var key = snapshot.key; if (!msg || processedMsgIds[key]) return; msg.id = key; processedMsgIds[key] = true; if (!chatMessages.find(function(m) { return m.id === key; })) { chatMessages.push(msg); chatMessages.sort(function(a, b) { return new Date(a.time) - new Date(b.time); }); renderChatMessages(); } });
}

function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    if (chatMessages.length === 0) { container.innerHTML = '<div style="text-align:center;padding:30px;"><p>No messages yet.</p></div>'; return; }
    var html = '';
    chatMessages.forEach(function(msg) { var isMe = msg.username === S.username; var msgTime = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); html += '<div class="chat-row ' + (isMe ? 'sent' : 'received') + '"><div class="bubble-wrap"><div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '">'; if (!isMe) html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:2px;">' + msg.username + '</div>'; html += '<span style="word-break:break-word;">' + escapeHtml(msg.text || '') + '</span>'; html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:3px;">' + msgTime + '</div>'; html += '</div></div></div>'; });
    container.innerHTML = html; container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    if (!currentChat || !S.username) { toast('Select a chat'); return; }
    var input = document.getElementById('chatInput'); if (!input) return;
    var text = input.value.trim(); if (!text) return;
    input.value = ''; input.disabled = true;
    firebase.database().ref('chats/' + currentChat).push({ username: S.username, text: text, type: 'text', time: new Date().toISOString() }).then(function() { input.disabled = false; input.focus(); }).catch(function() { input.value = text; input.disabled = false; toast('Failed to send'); });
}

function attachFileToChat() { document.getElementById('chatFileInput').click(); }
function handleChatFileSelect(event) {
    var file = event.target.files[0]; if (!file) return;
    if (!currentChat) { toast('Select a chat'); event.target.value = ''; return; }
    var maxSize = file.type.startsWith('video/') ? 50*1024*1024 : 10*1024*1024;
    if (file.size > maxSize) { toast('File too large'); event.target.value = ''; return; }
    toast('Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) { var type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file'); firebase.database().ref('chats/' + currentChat).push({ username: S.username, type: type, fileData: e.target.result, fileName: file.name, time: new Date().toISOString() }); toast('Sent!'); };
    reader.readAsDataURL(file);
}

function shareLocation() {
    if (!currentChat) { toast('Select a chat'); return; }
    if (!navigator.geolocation) { toast('Not supported'); return; }
    toast('Getting location...');
    navigator.geolocation.getCurrentPosition(function(pos) { firebase.database().ref('chats/' + currentChat).push({ username: S.username, type: 'location', latitude: pos.coords.latitude, longitude: pos.coords.longitude, time: new Date().toISOString() }); toast('📍 Shared!'); }, function() { toast('Error'); }, { enableHighAccuracy: true, timeout: 10000 });
}

window.renderChatList = renderChatList;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
window.attachFileToChat = attachFileToChat;
window.handleChatFileSelect = handleChatFileSelect;
window.shareLocation = shareLocation;
console.log('💬 Chat ready');