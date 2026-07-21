const friends = App.state.friends  [];
        if (friends.length > 0) {
            html += `<div style="font-size:10px;color:#94a3b8;padding:4px 0;">👥 Friends</div>`;
            friends.forEach(f => {
                html += `<div onclick="Chat.switchToPrivate('${f}')" style="padding:8px 12px;background:${this.chatId === 'private' && this.chatName.includes(f) ? 'rgba(99,102,241,0.15)' : 'transparent'};border-radius:8px;margin-bottom:4px;cursor:pointer;">
                    👤 ${f}
                </div>`;
            });
        }

        container.innerHTML = html;
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
        App.state.currentChatWith = username;
        this.chatId = [App.state.username, username].sort().join('_');
        this.chatName = `💬 ${username}`;
        document.getElementById('chatHeader').textContent = this.chatName;
        this.messages = [];
        this.loadPrivateChat(username);
        this.renderChatList();
    },

    render() {
        document.getElementById('myUsername').textContent = App.state.username  '—';
        document.getElementById('onlineCount').textContent = (App.state.friends || []).length;
        this.renderChatList();
        this.switchToPublic();
    },

    cleanup() {
        if (this.messagesListener) this.messagesListener.off();
    }
};

window.Chat = Chat;
window.sendMessage = Chat.sendMessage.bind(Chat);
window.changeUsername = function() {
    const newName = prompt('Enter new username:', App.state.username);
    if (newName && newName.trim()) {
        App.state.username = newName.trim();
        App.saveAuth();
        document.getElementById('myUsername').textContent = App.state.username;
        App.toast('Username updated');
        if (App.state.username) setData(users/${App.state.username}/username, App.state.username);
    }
};