// js/users.js - Users List
const Users = {
    render() {
        const container = document.getElementById('usersList');
        if (!container) return;

        const usersRef = getRef('users');
        usersRef.once('value', function(snapshot) {
            const users = snapshot.val()  {};
            const usernames = Object.keys(users).filter(u => u !== App.state.username);

            if (usernames.length === 0) {
                container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No other users yet.</p>';
                return;
            }

            const requestsRef = getRef(`friend_requests/${App.state.username}`);
            requestsRef.once('value', function(reqSnapshot) {
                const requests = reqSnapshot.val()  {};
                const sentRef = getRef(friend_requests_sent/${App.state.username});
                sentRef.once('value', function(sentSnapshot) {
                    const sent = sentSnapshot.val()  {};
                    const friends = App.state.friends  [];

                    container.innerHTML = usernames.map(u => {
                        const userData = users[u]  {};
                        const isOnline = userData.last_seen && (Date.now() - new Date(userData.last_seen).getTime() < 60000);
                        const isFriend = friends.includes(u);
                        const requestPending = requests[u] && requests[u].status === 'pending';
                        const requestSent = sent[u] && sent[u].status === 'pending';
                        const avatarHTML = getAvatarHTML(u, 40);

                        let buttonHtml = '';
                        if (isFriend) {
                            buttonHtml = `<span class="friend-request-btn friend">✅ Friend</span>`;
                        } else if (requestPending) {
                            buttonHtml = `<span class="friend-request-btn pending">⏳ Pending</span>`;
                        } else if (requestSent) {
                            buttonHtml = `<span class="friend-request-btn pending">⏳ Sent</span>`;
                        } else {
                            buttonHtml = `<button class="friend-request-btn add" onclick="Friends.sendFriendRequest('${u}')">➕ Add Friend</button>`;
                        }

                        return `
                            <div class="user-card">
                                <div class="user-avatar">${avatarHTML}</div>
                                <div class="user-info">
                                    <div class="name">
                                        ${u}
                                        <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                                        ${isOnline ? '🟢 Online' : '⚪️ Offline'}
                                    </div>
                                    <div class="bio">${userData.bio  'No bio yet'}</div>
                                </div>
                                <div>${buttonHtml}</div>
                            </div>
                        `;
                    }).join('');
                });
            });
        });
    }
};

function getAvatarHTML(username, size) {
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7B787','#FF8A80','#B388FF','#82B1FF','#B9F6CA','#FFE57F','#FF80AB','#EA80FC','#8C9EFF'];
    const color = colors[username.length % colors.length];
    return <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:${size*0.4}px;">${username.charAt(0).toUpperCase()}</div>;
}

window.Users = Users;