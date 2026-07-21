// js/chat.js - Chat Logic
const Chat = {
    messages: [],
    messagesListener: null,
    chatType: 'public', // 'public', 'private', 'group'
    chatId: 'public',
    chatName: 'Public Chat',

    setupListeners() {
        this.loadPublicChat();
        this.loadPrivateChats();
        this.loadGroups();
    },

    loadPublicChat() {
        const chatRef = getRef('chats/public');
        if (this.messagesListener) this.messagesListener.off();
        this.messagesListener = chatRef.orderByKey().limitToLast(50);
        this.messagesListener.on('child_added', function(snapshot) {
            const msg = snapshot.val();
            msg.id = snapshot.key;
            if (!Chat.messages.find(m => m.id === msg.id)) {
                Chat.messages.push(msg);
                if (Chat.messages.length > 50) Chat.messages.shift();
                Chat.renderMessages();
            }
        });
    },

    loadPrivateChats() {
        // Private chats are loaded dynamically when a friend is selected
    },

    loadGroups() {
        // Groups loaded dynamically
    },

    sendMessage() {
        if (!App.state.username) { App.toast('Please log in'); return; }
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        const msg = {
            from: App.state.username,
            text: text,
            time: new Date().toISOString(),
            type: this.chatType,
            chatId: this.chatId
        };

        let chatRef;
        if (this.chatType === 'public') {
            chatRef = getRef('chats/public');
        } else if (this.chatType === 'private') {
            const chatId = [App.state.username, App.state.currentChatWith].sort().join('_');
            chatRef = getRef(chats/private/${chatId});
        } else if (this.chatType === 'group') {
            chatRef = getRef(chats/groups/${this.chatId});
        }

        chatRef.push(msg);
        input.value = '';
        if (App.state.username) setData(users/${App.state.username}/last_seen, new Date().toISOString());
    },

    renderMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        if (this.messages.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:16px;">No messages yet. Start the conversation!</p>';
            return;
        }
        container.innerHTML = this.messages.map(m => {
            const me = m.from === App.state.username;
            const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `<div style="display:flex;justify-content:${me ? 'flex-end' : 'flex-start'};margin:3px 0;">
                <div style="max-width:82%;">
                    <div class="chat-bubble ${me ? 'chat-sent' : 'chat-received'}">
                        <div style="font-size:9px;font-weight:600;opacity:0.7;">${me ? 'You' : m.from} · ${time}</div>
                        <p style="margin:2px 0 0;">${m.text}</p>
                    </div>
                </div>
            </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    },

    switchToPublic() {
        this.chatType = 'public';
        this.chatId = 'public';
        this.chatName = '💬 Public Chat';
        document.getElementById('chatHeader').textContent = this.chatName;
        this.messages = [];
        this.loadPublicChat();
        this.renderChatList();
    },

    switchToPrivate(username) {
        this.chatType = 'private';
        this.chatId = [App.state.username, username].sort().join('_');
        this.chatName = 💬 ${username};
        document.getElementById('chatHeader').textContent = this.chatName;
        this.messages = [];
        this.loadPrivateChat(username);
        this.renderChatList();
    },
    loadPrivateChat(username) {
        const chatId = [App.state.username, username].sort().join('_');
        const chatRef = getRef(chats/private/${chatId});
        if (this.messagesListener) this.messagesListener.off();
        this.messagesListener = chatRef.orderByKey().limitToLast(50);
        this.messagesListener.on('child_added', function(snapshot) {
            const msg = snapshot.val();
            msg.id = snapshot.key;
            if (!Chat.messages.find(m => m.id === msg.id)) {
                Chat.messages.push(msg);
                if (Chat.messages.length > 50) Chat.messages.shift();
                Chat.renderMessages();
            }
        });
    },

    renderChatList() {
        const container = document.getElementById('chatList');
        if (!container) return;

        // Public chat
        let html = `<div onclick="Chat.switchToPublic()" style="padding:8px 12px;background:${this.chatId === 'public' ? 'rgba(99,102,241,0.15)' : 'transparent'};border-radius:8px;margin-bottom:4px;cursor:pointer;">
            💬 Public Chat
        </div>`;

        // Friends
        const friends = App.state.friends  [];
        if (friends.length > 0) {
            html += `<div style="font-size:10px;color:#94a3b8;padding:4px 0;">👥 Friends</div>`;
            friends.forEach(f => {
                html += `<div onclick="Chat.switchToPrivate('${f}')" style="padding:8px 12px;background:${this.chatId === 'private' && this.chatName.includes(f) ? 'rgba(99,102,241,0.15)' : 'transparent'};border-radius:8px;margin-bottom:4px;cursor:pointer;">
                    👤 ${f}
                </div>`;
            });
        }

        // Groups
        const groups = App.state.groups  [];
        if (groups.length > 0) {
            html += <div style="font-size:10px;color:#94a3b8;padding:4px 0;">👥 Groups</div>;
            groups.forEach(g => {
                html += `<div onclick="Chat.switchToGroup('${g.id}')" style="padding:8px 12px;background:${this.chatId === g.id ? 'rgba(99,102,241,0.15)' : 'transparent'};border-radius:8px;margin-bottom:4px;cursor:pointer;">
                    👥 ${g.name}
                </div>`;
            });
        }

        container.innerHTML = html;
    },

    render() {
        document.getElementById('myUsername').textContent = App.state.username  '—';
        document.getElementById('onlineCount').textContent = (App.state.friends  []).length;
        this.renderChatList();
        this.switchToPublic();
    },

    cleanup() {
        if (this.messagesListener) this.messagesListener.off();
    }
};

window.Chat = Chat;
window.sendMessage = Chat.sendMessage.bind(Chat);