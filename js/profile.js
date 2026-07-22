// Profile Module - Complete with avatars, friend management, user profiles

function renderProfile() {
    if (!S.username) return;
    
    // Update profile info
    document.getElementById('profileName').textContent = S.name || S.username;
    document.getElementById('profileUsername').textContent = '@' + S.username;
    document.getElementById('profileBio').textContent = S.bio || 'Building my energy. ⚡';
    
    // Update avatar
    updateProfileAvatar();
    updatePostAvatarInComposer();
    
    // Count stats
    const userPosts = S.socialPosts.filter(p => p.author === S.username);
    document.getElementById('profilePosts').textContent = userPosts.length;
    document.getElementById('profileFriends').textContent = (S.friends || []).length;
    document.getElementById('profileBookmarks').textContent = (S.bookmarks || []).length;
    
    // Render friend requests
    renderProfileRequests();
    
    // Update notification badge
    updateNotifBadge();
    
    // Render posts grid
    const grid = document.getElementById('profilePostsGrid');
    if (!grid) return;
    
    if (userPosts.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px;">No posts yet. Share your first post! 📸</p>';
        return;
    }
    
    grid.innerHTML = userPosts.map(p => {
        const img = p.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
        return `<div style="aspect-ratio:1;background-image:url(${img});background-size:cover;background-position:center;border-radius:4px;cursor:pointer;" onclick="viewPostDetail('${p.id}')"></div>`;
    }).join('');
}

function updateProfileAvatar() {
    const avatarContainer = document.getElementById('profileAvatarEmoji');
    if (!avatarContainer) return;
    
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        avatarContainer.innerHTML = `<img src="${S.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.parentNode.textContent='${(S.name||S.username).charAt(0).toUpperCase()}';" />`;
    } else {
        const color = getColor(S.username);
        avatarContainer.innerHTML = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">${(S.name||S.username).charAt(0).toUpperCase()}</div>`;
    }
}

function updatePostAvatarInComposer() {
    const postAvatar = document.getElementById('postAvatarEmoji');
    if (!postAvatar) return;
    
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        postAvatar.innerHTML = `<img src="${S.avatar}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
        const color = getColor(S.username);
        postAvatar.innerHTML = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">${(S.name||S.username).charAt(0).toUpperCase()}</div>`;
    }
}

function renderProfileRequests() {
    const section = document.getElementById('profileRequestsSection');
    if (!section) return;
    
    getRef('friendRequests/' + S.username).once('value', (snapshot) => {
        const requests = snapshot.val() || [];
        
        if (requests.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        let html = '<div style="background:rgba(99,102,241,0.1);border-radius:12px;padding:10px;margin-bottom:8px;"><strong style="font-size:12px;">🔔 Friend Requests (' + requests.length + ')</strong>';
        
        requests.forEach(requester => {
            const color = getColor(requester);
            html += `<div class="request-card">
                <div class="req-avatar" style="background:${color};">${requester.charAt(0).toUpperCase()}</div>
                <div class="req-info"><div class="req-name">@${requester}</div></div>
                <div class="req-actions">
                    <button class="btn-sm btn-success" onclick="acceptFriendRequest('${requester}')" style="padding:4px 10px;font-size:11px;">✅ Accept</button>
                    <button class="btn-sm btn-danger" onclick="declineFriendRequest('${requester}')" style="padding:4px 10px;font-size:11px;">❌ Decline</button>
                </div>
            </div>`;
        });
        
        html += '</div>';
        section.innerHTML = html;
    });
}

function editName() {
    showDialog({
        emoji: '✏️',
        title: 'Edit Name',
        subtitle: 'Change your display name',
        placeholder: 'Your name...',
        defaultValue: S.name || '',
        confirmText: 'Save'
    }).then(result => {
        if (result !== null) {
            S.name = result.trim();
            if (S.username) {
                setData('users/' + S.username + '/name', S.name);
                updateAllPostsAuthorName(S.name);
            }
            saveState();
            renderProfile();
            updateProfileAvatar();
            updatePostAvatarInComposer();
            toast('Name updated! ✏️');
        }
    });
}

function editProfile() {
    showDialog({
        emoji: '📝',
        title: 'Edit Bio',
        subtitle: 'Tell us about yourself',
        placeholder: 'Your bio...',
        defaultValue: S.bio || '',
        confirmText: 'Save'
    }).then(result => {
        if (result !== null) {
            S.bio = result.trim() || 'Building my energy. ⚡';
            if (S.username) setData('users/' + S.username + '/bio', S.bio);
            saveState();
            renderProfile();
            toast('Bio updated! 📝');
        }
    });
}

function handleAvatarSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        toast('Please select an image file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        toast('Image too large (max 10MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        S.avatar = e.target.result;
        if (S.username) setData('users/' + S.username + '/avatar', S.avatar);
        updateProfileAvatar();
        updatePostAvatarInComposer();
        
        // Update avatar on all user's posts
        updateAllPostsAvatar(S.avatar);
        
        saveState();
        toast('✅ Avatar updated!');
    };
    reader.onerror = function() {
        toast('Error reading file');
    };
    reader.readAsDataURL(file);
}

function updateAllPostsAvatar(avatarUrl) {
    // Update local posts
    S.socialPosts.forEach(p => {
        if (p.author === S.username) p.avatar = avatarUrl;
    });
    
    // Update posts in Firebase
    getRef('posts').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].author === S.username) {
                    getRef('posts/' + key + '/avatar').set(avatarUrl);
                }
            });
        }
    });
    
    // Update videos in Firebase
    getRef('videos').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].author === S.username) {
                    getRef('videos/' + key + '/avatar').set(avatarUrl);
                }
            });
        }
    });
}

function updateAllPostsAuthorName(newName) {
    // Update local posts
    S.socialPosts.forEach(p => {
        if (p.author === S.username) p.author = newName;
    });
    
    // Update in Firebase
    getRef('posts').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].author === S.username) {
                    getRef('posts/' + key + '/author').set(newName);
                }
            });
        }
    });
    
    getRef('videos').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].author === S.username) {
                    getRef('videos/' + key + '/author').set(newName);
                }
            });
        }
    });
}

// Render users list
function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>';
        return;
    }
    
    getRef('friendRequests/' + S.username).once('value', (reqSnapshot) => {
        const pendingRequests = reqSnapshot.val() || [];
        
        getRef('users').once('value', (snapshot) => {
            const users = snapshot.val() || {};
            const usernames = Object.keys(users);
            
            if (usernames.length === 0) {
                container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No users yet.</p>';
                return;
            }
            
            let html = '';
            
            // Show pending requests first
            if (pendingRequests.length > 0) {
                html += '<div style="margin-bottom:12px;padding:10px;background:rgba(99,102,241,0.1);border-radius:12px;"><strong style="font-size:13px;">🔔 Pending Requests (' + pendingRequests.length + ')</strong>';
                
                pendingRequests.forEach(requester => {
                    const color = getColor(requester);
                    html += `<div class="request-card">
                        <div class="req-avatar" style="background:${color};">${requester.charAt(0).toUpperCase()}</div>
                        <div class="req-info"><div class="req-name">@${requester}</div></div>
                        <div class="req-actions">
                            <button class="btn-sm btn-success" onclick="acceptFriendRequest('${requester}')">✅</button>
                            <button class="btn-sm btn-danger" onclick="declineFriendRequest('${requester}')">❌</button>
                        </div>
                    </div>`;
                });
                
                html += '<div style="margin:12px 0;border-top:1px solid rgba(0,0,0,0.1);"></div>';
            }
            
            html += '<strong style="font-size:13px;">👥 All Users</strong><br><br>';
            
            usernames.forEach(u => {
                if (pendingRequests.includes(u)) return;
                
                const isMe = u === S.username;
                const userData = users[u] || {};
                const isFriend = (S.friends || []).includes(u);
                const color = getColor(u);
                
                let avatarHTML = '';
                if (userData.avatar && (userData.avatar.startsWith('data:') || userData.avatar.includes('http'))) {
                    avatarHTML = `<img src="${userData.avatar}" alt="${u}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.parentNode.innerHTML='<div style=&quot;width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px;&quot;>${u.charAt(0).toUpperCase()}</div>';" />`;
                } else {
                    avatarHTML = `<div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px;">${u.charAt(0).toUpperCase()}</div>`;
                }
                
                html += `<div class="user-card">
                    <div class="user-avatar" onclick="viewUserProfile('${u}')">${avatarHTML}</div>
                    <div class="user-info">
                        <div class="name" onclick="viewUserProfile('${u}')">
                            ${isMe ? '⭐ ' : ''}${u}
                            <span class="status-dot ${userData.online ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="bio">${userData.bio || 'No bio yet'}</div>
                    </div>
                    <div class="actions">
                        ${!isMe ? (isFriend ? '<button class="btn-sm btn-success">✓ Friends</button>' : `<button class="btn-sm" onclick="sendFriendRequest('${u}')">➕ Add</button>`) : ''}
                    </div>
                </div>`;
            });
            
            container.innerHTML = html;
        });
    });
}

function sendFriendRequest(username) {
    if (!S.username) { toast('Please log in'); return; }
    if (username === S.username) { toast('Cannot add yourself'); return; }
    if ((S.friends || []).includes(username)) { toast('Already friends'); return; }
    
    getRef('friendRequests/' + username).once('value', (snapshot) => {
        let requests = snapshot.val() || [];
        if (requests.includes(S.username)) {
            toast('Request already sent');
            return;
        }
        
        requests.push(S.username);
        setData('friendRequests/' + username, requests);
        toast('Friend request sent to @' + username + '! 📨');
        addNotification(username, `${S.username} sent you a friend request`, 'friend_request', '');
    });
}

function acceptFriendRequest(username) {
    if (!S.username) return;
    
    // Add to current user's friends
    if (!S.friends.includes(username)) {
        S.friends.push(username);
    }
    
    // Add current user to other person's friends
    getRef('users/' + username + '/friends').once('value', (snapshot) => {
        let theirFriends = snapshot.val() || [];
        if (!theirFriends.includes(S.username)) {
            theirFriends.push(S.username);
            setData('users/' + username + '/friends', theirFriends);
        }
    });
    
    // Remove the friend request
    getRef('friendRequests/' + S.username).once('value', (snapshot) => {
        let requests = snapshot.val() || [];
        requests = requests.filter(r => r !== username);
        setData('friendRequests/' + S.username, requests);
    });
    
    // Save current user's friends
    setData('users/' + S.username + '/friends', S.friends);
    saveState();
    
    // Update UI
    renderChatList();
    renderProfile();
    renderUsers();
    
    // Send notification
    addNotification(username, `${S.username} accepted your friend request`, 'friend_accept', '');
    
    toast('✅ You and @' + username + ' are now friends!');
}

function declineFriendRequest(username) {
    if (!S.username) return;
    
    getRef('friendRequests/' + S.username).once('value', (snapshot) => {
        let requests = snapshot.val() || [];
        requests = requests.filter(r => r !== username);
        setData('friendRequests/' + S.username, requests);
        
        toast('Request declined');
        renderProfile();
        renderUsers();
    });
}

function viewUserProfile(username) {
    viewingProfile = username;
    navigate('userprofile', username);
}

function renderUserProfile(username) {
    if (!username) return;
    
    getRef('users/' + username).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            toast('User not found');
            return;
        }
        
        const data = snapshot.val();
        const color = getColor(username);
        
        // Avatar
        const avatarEl = document.getElementById('viewProfileAvatar');
        if (data.avatar && (data.avatar.startsWith('data:') || data.avatar.includes('http'))) {
            avatarEl.innerHTML = `<img src="${data.avatar}" alt="${username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            avatarEl.innerHTML = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">${(data.name||username).charAt(0).toUpperCase()}</div>`;
        }
        
        // Info
        document.getElementById('viewProfileName').textContent = data.name || username;
        document.getElementById('viewProfileUsername').textContent = '@' + username;
        document.getElementById('viewProfileBio').textContent = data.bio || '';
        document.getElementById('viewProfileFriends').textContent = (data.friends || []).length;
        
        // Posts count
        const userPosts = S.socialPosts.filter(p => p.author === username);
        document.getElementById('viewProfilePosts').textContent = userPosts.length;
        
        // Actions
        const actionsDiv = document.getElementById('viewProfileActions');
        if (username === S.username) {
            actionsDiv.innerHTML = '<button class="btn-sm" onclick="navigate(\'profile\')">Edit Profile</button>';
        } else if ((S.friends || []).includes(username)) {
            actionsDiv.innerHTML = '<button class="btn-sm btn-success">✓ Friends</button>';
        } else {
            actionsDiv.innerHTML = `<button class="btn-sm" onclick="sendFriendRequest('${username}')">➕ Add Friend</button>`;
        }
        
        // Posts grid
        const grid = document.getElementById('viewProfilePostsGrid');
        if (userPosts.length === 0) {
            grid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px;">No posts yet.</p>';
            return;
        }
        
        grid.innerHTML = userPosts.map(p => {
            const img = p.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
            return `<div style="aspect-ratio:1;background-image:url(${img});background-size:cover;background-position:center;border-radius:4px;cursor:pointer;" onclick="viewPostDetail('${p.id}')"></div>`;
        }).join('');
    });
}

console.log('👤 Profile module loaded');