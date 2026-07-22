// Chat Module - Complete with private DMs, group chats, attachments, and location sharing

var currentChat = null;
var chatMessages = [];
var chatListener = null;
var currentChatType = 'dm';
var currentChatParticipants = [];

// Render chat list
function renderChatList() {
    var container = document.getElementById('chatList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to see your chats.</p>';
        return;
    }
    
    var friends = S.friends || [];
    var groups = S.groups || [];
    
    // Build chat list
    var allChats = [];
    
    // Global chat
    allChats.push({
        name: 'Winchu Global',
        type: 'global',
        id: 'Winchu_Global',
        icon: '🌐',
        subtitle: 'Community chat for everyone'
    });
    
    // Private DMs (one-on-one with friends)
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
    
    // Show chat list, hide chat window
    var chatWindow = document.getElementById('chatWindow');
    if (chatWindow) chatWindow.style.display = 'none';
    container.style.display = 'block';
}

// Open a chat
function openChat(chatId, type) {
    if (!S.username) {
        toast('Please log in to chat');
        return;
    }
    
    console.log('Opening chat:', chatId, 'Type:', type);
    
    currentChat = chatId;
    currentChatType = type;
    
    // Set chat name in header
    var chatWithEl = document.getElementById('chatWith');
    if (chatWithEl) {
        if (type === 'global') {
            chatWithEl.textContent = '🌐 Winchu Global';
        } else if (type === 'group') {
            var group = S.groups.find(function(g) { return g.id === chatId; });
            chatWithEl.textContent = '👥 ' + (group ? group.name : 'Group');
        } else {
            var friendName = chatId.replace(S.username + '_dm_', '').replace('_dm_' + S.username, '');
            chatWithEl.textContent = '👤 @' + friendName;
        }
    }
    
    // Show chat window, hide chat list
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('chatList').style.display = 'none';
    
    // Show attachment buttons for DMs and groups
    var attachRow = document.getElementById('chatAttachRow');
    if (attachRow) {
        attachRow.style.display = (type === 'dm' || type === 'group') ? 'flex' : 'none';
    }
    
    // Load messages
    loadChatMessages(chatId);
    
    // Setup real-time listener
    setupChatListener(chatId);
    
    // Focus input
    setTimeout(function() {
        var chatInput = document.getElementById('chatInput');
        if (chatInput) chatInput.focus();
    }, 300);
}

// Close chat
function closeChat() {
    currentChat = null;
    currentChatType = 'dm';
    chatMessages = [];
    
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    
    if (chatListener) {
        chatListener.off();
        chatListener = null;
    }
}

// Load chat messages from Firebase
function loadChatMessages(chatId) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Loading messages...</p>';
    
    db.ref('chats/' + chatId).orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        chatMessages = [];
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var msg = data[key];
                msg.id = key;
                chatMessages.push(msg);
            });
            
            // Sort by time
            chatMessages.sort(function(a, b) {
                return new Date(a.time) - new Date(b.time);
            });
        }
        
        console.log('Loaded ' + chatMessages.length + ' messages');
        renderChatMessages();
    }).catch(function(error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">Error loading messages. Please try again.</p>';
    });
}

// Setup real-time chat listener
function setupChatListener(chatId) {
    if (chatListener) {
        chatListener.off();
        chatListener = null;
    }
    
    chatListener = db.ref('chats/' + chatId).orderByChild('time').limitToLast(100);
    
    chatListener.on('child_added', function(snapshot) {
        var msg = snapshot.val();
        if (!msg) return;
        msg.id = snapshot.key;
        
        // Check if message already exists in array
        var existing = chatMessages.find(function(m) {
            return m.id === msg.id;
        });
        
        if (!existing) {
            chatMessages.push(msg);
            // Keep sorted by time
            chatMessages.sort(function(a, b) {
                return new Date(a.time) - new Date(b.time);
            });
            renderChatMessages();
        }
    });
}

// Render chat messages
function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' +
            '<p>No messages yet.</p>' +
            '<p style="font-size:12px;">Say hello! 👋</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    var lastDate = '';
    
    chatMessages.forEach(function(msg) {
        var isMe = msg.username === S.username;
        var msgDate = new Date(msg.time).toLocaleDateString();
        var msgTime = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Show date separator if date changes
        if (msgDate !== lastDate) {
            html += '<div style="text-align:center;margin:12px 0;">' +
                '<span style="background:rgba(0,0,0,0.05);padding:4px 12px;border-radius:10px;font-size:10px;color:#94a3b8;">' + msgDate + '</span>' +
                '</div>';
            lastDate = msgDate;
        }
        
        html += '<div class="chat-row ' + (isMe ? 'sent' : 'received') + '">';
        html += '<div class="bubble-wrap">';
        
        // Message bubble
        if (msg.type === 'image') {
            // Image message
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" style="padding:4px;">';
            if (!isMe) {
                html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;padding:0 6px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            }
            html += '<img src="' + msg.fileData + '" style="max-width:200px;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open(\'' + msg.fileData + '\')" />';
            if (msg.text) {
                html += '<div style="padding:4px 6px;font-size:12px;">' + escapeHtml(msg.text) + '</div>';
            }
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';padding:2px 6px;">' + msgTime + '</div>';
            html += '</div>';
            
        } else if (msg.type === 'video') {
            // Video message
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" style="padding:4px;">';
            if (!isMe) {
                html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;padding:0 6px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            }
            html += '<video src="' + msg.fileData + '" controls style="max-width:200px;max-height:200px;border-radius:8px;"></video>';
            if (msg.text) {
                html += '<div style="padding:4px 6px;font-size:12px;">' + escapeHtml(msg.text) + '</div>';
            }
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';padding:2px 6px;">' + msgTime + '</div>';
            html += '</div>';
            
        } else if (msg.type === 'location') {
            // Location message
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '" style="cursor:pointer;" onclick="window.open(\'https://www.google.com/maps?q=' + msg.latitude + ',' + msg.longitude + '\', \'_blank\')">';
            if (!isMe) {
                html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            }
            html += '<div style="background:rgba(99,102,241,0.2);padding:10px;border-radius:8px;">';
            html += '<div style="font-size:20px;">📍</div>';
            html += '<strong style="font-size:12px;">Shared Location</strong><br>';
            html += '<span style="font-size:10px;">Lat: ' + msg.latitude.toFixed(4) + ', Lng: ' + msg.longitude.toFixed(4) + '</span><br>';
            html += '<span style="font-size:10px;color:#6366f1;">Tap to view on map</span>';
            html += '</div>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:4px;">' + msgTime + '</div>';
            html += '</div>';
            
        } else if (msg.type === 'file') {
            // File attachment
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '">';
            if (!isMe) {
                html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:4px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            }
            html += '<div style="display:flex;align-items:center;gap:8px;">';
            html += '<span style="font-size:20px;">📎</span>';
            html += '<div>';
            html += '<strong style="font-size:11px;">' + escapeHtml(msg.fileName || 'File') + '</strong><br>';
            html += '<button class="btn-sm" onclick="downloadMedia(\'' + msg.fileData + '\', \'' + (msg.fileName || 'file') + '\')" style="font-size:9px;padding:2px 8px;">⬇️ Download</button>';
            html += '</div>';
            html += '</div>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:4px;">' + msgTime + '</div>';
            html += '</div>';
            
        } else {
            // Regular text message
            html += '<div class="chat-bubble ' + (isMe ? 'chat-sent' : 'chat-received') + '">';
            if (!isMe) {
                html += '<div style="font-size:10px;font-weight:600;opacity:0.8;margin-bottom:2px;cursor:pointer;" onclick="viewUserProfile(\'' + msg.username + '\')">' + msg.username + '</div>';
            }
            html += '<span style="word-break:break-word;">' + escapeHtml(msg.text || '') + '</span>';
            html += '<div style="font-size:9px;opacity:0.6;text-align:' + (isMe ? 'right' : 'left') + ';margin-top:3px;">' + msgTime + '</div>';
            html += '</div>';
        }
        
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Scroll to bottom
    setTimeout(function() {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Send text message
function sendChatMessage() {
    if (!currentChat || !S.username) {
        toast('Select a chat first');
        return;
    }
    
    var input = document.getElementById('chatInput');
    if (!input) return;
    
    var text = input.value.trim();
    if (!text) return;
    
    var message = {
        username: S.username,
        text: text,
        type: 'text',
        time: new Date().toISOString()
    };
    
    db.ref('chats/' + currentChat).push(message).then(function() {
        input.value = '';
        input.focus();
    }).catch(function(error) {
        console.error('Send error:', error);
        toast('Failed to send message');
    });
}

// Attach file to chat
function attachFileToChat() {
    document.getElementById('chatFileInput').click();
}

// Handle chat file selection
function handleChatFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    if (!currentChat) {
        toast('Select a chat first');
        event.target.value = '';
        return;
    }
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('File too large (max ' + Math.round(maxSize / (1024 * 1024)) + 'MB)');
        event.target.value = '';
        return;
    }
    
    toast('Uploading file...');
    
    var reader = new FileReader();
    reader.onload = function(e) {
        var type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        
        var message = {
            username: S.username,
            type: type,
            fileData: e.target.result,
            fileName: file.name,
            text: '',
            time: new Date().toISOString()
        };
        
        db.ref('chats/' + currentChat).push(message).then(function() {
            toast('File sent! 📎');
        }).catch(function(error) {
            console.error('File send error:', error);
            toast('Failed to send file');
        });
    };
    reader.onerror = function() {
        toast('Error reading file');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

// Share location
function shareLocation() {
    if (!currentChat) {
        toast('Select a chat first');
        return;
    }
    
    if (!navigator.geolocation) {
        toast('Geolocation not supported on this device');
        return;
    }
    
    toast('Getting location...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var message = {
                username: S.username,
                type: 'location',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                time: new Date().toISOString()
            };
            
            db.ref('chats/' + currentChat).push(message).then(function() {
                toast('📍 Location shared!');
            }).catch(function(error) {
                console.error('Location send error:', error);
                toast('Failed to share location');
            });
        },
        function(error) {
            console.error('Geolocation error:', error);
            var errorMsg = 'Could not get location. ';
            if (error.code === 1) errorMsg += 'Permission denied.';
            else if (error.code === 2) errorMsg += 'Position unavailable.';
            else if (error.code === 3) errorMsg += 'Request timed out.';
            toast(errorMsg);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Download media from chat
function downloadMedia(url, filename) {
    if (!url) return;
    
    try {
        if (url.startsWith('data:')) {
            var a = document.createElement('a');
            a.href = url;
            a.download = filename || 'file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast('⬇️ Downloading...');
        } else if (url.startsWith('http')) {
            window.open(url, '_blank');
        }
    } catch (e) {
        console.error('Download error:', e);
        toast('Download failed');
    }
}

// Initialize chat page
function initChatPage() {
    // Add enter key listener for chat input
    var chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
}

// Call initialization
document.addEventListener('DOMContentLoaded', function() {
    initChatPage();
});

// Expose functions globally
window.renderChatList = renderChatList;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
window.attachFileToChat = attachFileToChat;
window.handleChatFileSelect = handleChatFileSelect;
window.shareLocation = shareLocation;
window.downloadMedia = downloadMedia;

console.log('💬 Chat module loaded');