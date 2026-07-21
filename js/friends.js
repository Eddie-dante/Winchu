// js/friends.js - Friend System
const Friends = {
    loadFriendsList() {
        if (!App.state.username) return;
        const friendsRef = getRef(friends/${App.state.username});
        friendsRef.on('value', function(snapshot) {
            const data = snapshot.val()  {};
            App.state.friends = Object.keys(data);
            if (window.Chat) Chat.renderChatList();
        });
    },

    loadFriendRequests() {
        if (!App.state.username) return;
        const requestsRef = getRef(`friend_requests/${App.state.username}`);
        requestsRef.on('value', function(snapshot) {
            const data = snapshot.val()  {};
            App.state.friendRequests = Object.keys(data).map(key => ({
                from: key,
                status: data[key].status,
                timestamp: data[key].timestamp
            }));
            if (document.getElementById('friendRequests')) {
                renderFriendRequests();
            }
        });
    },

    sendFriendRequest(username) {
        if (!App.state.username || username === App.state.username) return;
        const requestRef = getRef(friend_requests/${username}/${App.state.username});
        requestRef.set({
            from: App.state.username,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        const sentRef = getRef(friend_requests_sent/${App.state.username}/${username});
        sentRef.set({
            to: username,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        App.toast('Friend request sent! 📨');
        if (window.Users) Users.render();
    },

    acceptFriendRequest(fromUser) {
        if (!App.state.username) return;
        const friendRef1 = getRef(friends/${App.state.username}/${fromUser});
        friendRef1.set({ username: fromUser, added: new Date().toISOString() });
        const friendRef2 = getRef(friends/${fromUser}/${App.state.username});
        friendRef2.set({ username: App.state.username, added: new Date().toISOString() });

        const requestRef = getRef(friend_requests/${App.state.username}/${fromUser});
        requestRef.remove();
        const sentRef = getRef(friend_requests_sent/${fromUser}/${App.state.username});
        sentRef.remove();

        App.toast(You and ${fromUser} are now friends! 🎉);
        this.loadFriendRequests();
        if (window.Users) Users.render();
        this.loadFriendsList();
    },

    rejectFriendRequest(fromUser) {
        if (!App.state.username) return;
        const requestRef = getRef(friend_requests/${App.state.username}/${fromUser});
        requestRef.remove();
        const sentRef = getRef(friend_requests_sent/${fromUser}/${App.state.username});
        sentRef.remove();
        App.toast('Friend request rejected');
        this.loadFriendRequests();
        if (window.Users) Users.render();
    },

    startChat(username) {
        App.state.currentChatWith = username;
        App.state.currentChatType = 'private';
        App.navigate('chat');
        if (window.Chat) {
            Chat.switchToPrivate(username);
        }
        App.toast(💬 Chatting with ${username});
    }
};
function renderFriendRequests() {
    const container = document.getElementById('friendRequests');
    if (!container) return;
    if (App.state.friendRequests.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:10px;">No pending requests</p>';
        return;
    }
    container.innerHTML = App.state.friendRequests.map(req => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.5);border-radius:10px;margin-bottom:4px;border:1px solid rgba(0,0,0,0.05);">
            <span><strong>${req.from}</strong> sent you a friend request</span>
            <div style="display:flex;gap:4px;">
                <button class="friend-request-btn accept" onclick="Friends.acceptFriendRequest('${req.from}')">✅ Accept</button>
                <button class="friend-request-btn reject" onclick="Friends.rejectFriendRequest('${req.from}')">❌ Reject</button>
            </div>
        </div>
    `).join('');
}

window.Friends = Friends;
window.sendFriendRequest = Friends.sendFriendRequest.bind(Friends);
window.acceptFriendRequest = Friends.acceptFriendRequest.bind(Friends);
window.rejectFriendRequest = Friends.rejectFriendRequest.bind(Friends);