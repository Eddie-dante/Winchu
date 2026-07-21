// Profile Module
window.renderProfile = function() {
    if (!window.S.username) return;
    
    // Update profile info
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = window.S.username;
    
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = '@' + window.S.username;
    
    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = window.S.bio || 'Building my energy. One aura at a time. ⚡';
    
    // Update stats
    const userPosts = window.S.socialPosts.filter(p => p.author === window.S.username);
    const postsEl = document.getElementById('profilePosts');
    if (postsEl) postsEl.textContent = userPosts.length;
    
    const friendsEl = document.getElementById('profileFriends');
    if (friendsEl) friendsEl.textContent = (window.S.friends || []).length;
    
    // Update avatar
    if (window.S.avatar) {
        updateAvatarUI(window.S.avatar);
    }
    
    // Render posts grid
    const grid = document.getElementById('profilePostsGrid');
    if (!grid) return;
    
    if (userPosts.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px 0;">No posts yet. Share your first post! 📸</p>';
        return;
    }
    
    let html = '';
    userPosts.forEach(p => {
        const img = p.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
        html += `
            <div style="aspect-ratio:1;background-image:url(${img});background-size:cover;background-position:center;border-radius:4px;cursor:pointer;" 
                 onclick="window.viewPostDetail('${p.id}')">
            </div>`;
    });
    
    grid.innerHTML = html;
};

window.editProfile = function() {
    showDialog({
        emoji: '📝',
        title: 'Edit Bio',
        subtitle: 'Tell us about yourself',
        placeholder: 'Your bio...',
        defaultValue: window.S.bio || '',
        confirmText: 'Save'
    }).then(result => {
        if (result !== null) {
            window.S.bio = result.trim() || 'Building my energy. One aura at a time. ⚡';
            if (window.S.username) {
                setData('users/' + window.S.username + '/bio', window.S.bio);
            }
            saveUserState();
            window.renderProfile();
            window.toast('Bio updated');
        }
    });
};

window.handleAvatarSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        window.toast('Please select an image file');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        window.toast('Image too large (max 2MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        window.S.avatar = dataUrl;
        
        if (window.S.username) {
            setData('users/' + window.S.username + '/avatar', dataUrl);
        }
        
        updateAvatarUI(dataUrl);
        saveUserState();
        window.toast('✅ Avatar updated!');
    };
    reader.readAsDataURL(file);
};

function updateAvatarUI(dataUrl) {
    const avatarContainer = document.getElementById('profileAvatarEmoji');
    if (avatarContainer) {
        avatarContainer.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
    
    const postAvatar = document.getElementById('postAvatarEmoji');
    if (postAvatar) {
        postAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
}

// Friend System
window.sendFriendRequest = function(username) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    if (username === window.S.username) {
        window.toast('Cannot add yourself');
        return;
    }
    if ((window.S.friends || []).includes(username)) {
        window.toast('Already friends');
        return;
    }
    
    const requestsRef = getRef('friendRequests/' + username);
    requestsRef.once('value', (snapshot) => {
        let requests = snapshot.val() || [];
        if (requests.includes(window.S.username)) {
            window.toast('Request already sent');
            return;
        }
        
        requests.push(window.S.username);
        requestsRef.set(requests);
        window.toast('Friend request sent to ' + username + ' 📨');
    });
};

window.acceptFriendRequest = function(username) {
    if (!window.S.username) return;
    
    if (!window.S.friends.includes(username)) {
        window.S.friends.push(username);
    }
    
    // Remove from requests
    const requestsRef = getRef('friendRequests/' + window.S.username);
    requestsRef.once('value', (snapshot) => {
        let requests = snapshot.val() || [];
        requests = requests.filter(r => r !== username);
        requestsRef.set(requests);
    });
    
    setData('users/' + window.S.username + '/friends', window.S.friends);
    saveUserState();
    window.renderChatList();
    window.renderProfile();
    window.toast('Friend added! 🎉');
};

window.loadFriends = function() {
    if (!window.S.username) return;
    
    const friendsRef = getRef('users/' + window.S.username + '/friends');
    friendsRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.S.friends = data;
        }
        saveUserState();
        window.renderChatList();
        window.renderProfile();
    });
    
    // Listen for friend requests
    const requestsRef = getRef('friendRequests/' + window.S.username);
    requestsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.length > 0) {
            window.toast(`You have ${data.length} friend request(s)! 📨`);
        }
    });
};

// Users List
window.renderUsers = function() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (!window.S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>';
        return;
    }
    
    const usersRef = getRef('users');
    usersRef.once('value', (snapshot) => {
        const users = snapshot.val() || {};
        const usernames = Object.keys(users);
        
        if (usernames.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No users yet.</p>';
            return;
        }
        
        let html = '';
        usernames.forEach(u => {
            const isMe = u === window.S.username;
            const userData = users[u] || {};
            const isOnline = userData.online || false;
            const isFriend = (window.S.friends || []).includes(u);
            
            const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD',
                          '#98D8C8','#F7B787','#FF8A80','#B388FF','#82B1FF','#B9F6CA',
                          '#FFE57F','#FF80AB','#EA80FC','#8C9EFF'];
            const color = colors[u.length % colors.length];
            
            let avatarHTML = `<div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px;">${u.charAt(0).toUpperCase()}</div>`;
            
            if (userData.avatar) {
                avatarHTML = `<img src="${userData.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" alt="${u}" />`;
            }
            
            html += `
                <div class="user-card">
                    <div class="user-avatar">${avatarHTML}</div>
                    <div class="user-info">
                        <div class="name">
                            ${isMe ? '⭐ ' : ''}${u}
                            <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="bio">${userData.bio || 'No bio yet'}</div>
                    </div>
                    <div class="actions">
                        ${!isMe ? (
                            isFriend ? 
                            '<button class="btn-sm btn-success">✓ Friend</button>' :
                            `<button class="btn-sm" onclick="window.sendFriendRequest('${u}')">➕ Add</button>`
                        ) : ''}
                    </div>
                </div>`;
        });
        
        container.innerHTML = html;
    });
};

// Initialize Wallpapers
window.initWallpapers = function() {
    const PORTRAIT_WALLPAPERS = [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&q=80',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80',
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&q=80',
        'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1080&q=80',
        'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1080&q=80',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80'
    ];
    
    const LANDSCAPE_WALLPAPERS = [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
        'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1920&q=80',
        'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1920&q=80',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80'
    ];
    
    window.ALL_WALLPAPERS = [];
    PORTRAIT_WALLPAPERS.forEach(url => {
        window.ALL_WALLPAPERS.push({ url, type: 'portrait' });
    });
    LANDSCAPE_WALLPAPERS.forEach(url => {
        window.ALL_WALLPAPERS.push({ url, type: 'landscape' });
    });
    
    window.currentWallpaperFilter = 'all';
    window.renderWallpapers();
};

// Video Module
window.loadVideos = function() {
    const videosRef = getRef('videos');
    videosRef.orderByKey().limitToLast(50).on('child_added', (snapshot) => {
        const data = snapshot.val();
        data.id = snapshot.key;
        
        if (!window.videoData.find(v => v.id === data.id)) {
            window.videoData.unshift(data);
            if (window.videoData.length > 50) window.videoData.pop();
            window.renderVideos();
        }
    });
};

window.renderVideos = function() {
    const container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!window.S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px 0;">Please log in</p>';
        return;
    }
    
    if (!window.videoData || window.videoData.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px 0;">No videos yet. Tap 📹 to upload!</p>';
        return;
    }
    
    let html = '';
    window.videoData.forEach(v => {
        const isLiked = (v.likes || []).includes(window.S.username);
        const likeCount = (v.likes || []).length;
        const commentCount = (v.comments || []).length;
        const avatarDisplay = v.avatar || '😊';
        
        html += `
            <div class="tiktok-video">
                ${v.url ? `<video src="${v.url}" loop muted playsinline></video>` : 
                  '<div style="background:#0f172a;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;">Video</div>'}
                <div class="overlay">
                    <div class="user">
                        <div class="avatar">${avatarDisplay}</div>
                        @${v.author}
                    </div>
                    <div class="desc">${v.text || ''}</div>
                    <div class="side-actions">
                        <button class="${isLiked ? 'liked' : ''}" onclick="window.likeVideo('${v.id}')">
                            ❤️<span>${likeCount}</span>
                        </button>
                        <button onclick="window.commentVideo('${v.id}')">
                            💬<span>${commentCount}</span>
                        </button>
                        <button onclick="window.downloadMedia('${v.url}', 'winchu-video.mp4')">
                            ⬇️<span>Save</span>
                        </button>
                        ${v.author === window.S.username ? 
                            `<button onclick="window.deleteVideo('${v.id}')" style="color:#ef4444;">🗑️<span>Delete</span></button>` : ''}
                    </div>
                </div>
            </div>`;
    });
    
    container.innerHTML = html;
    
    // Video autoplay with Intersection Observer
    const videos = container.querySelectorAll('video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.5 });
    
    videos.forEach(video => observer.observe(video));
};

window.likeVideo = function(id) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const video = window.videoData.find(v => v.id === id);
    if (!video) return;
    
    let likes = video.likes || [];
    const index = likes.indexOf(window.S.username);
    
    if (index > -1) {
        likes.splice(index, 1);
    } else {
        likes.push(window.S.username);
    }
    
    video.likes = likes;
    getRef('videos/' + id + '/likes').set(likes);
    window.renderVideos();
    saveUserState();
};

window.commentVideo = function(id) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        subtitle: 'Write your comment',
        placeholder: 'Type your comment...',
        confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            const video = window.videoData.find(v => v.id === id);
            if (!video) return;
            
            const comments = video.comments || [];
            comments.push({
                username: window.S.username,
                text: result.trim(),
                time: new Date().toISOString()
            });
            
            video.comments = comments;
            getRef('videos/' + id + '/comments').set(comments);
            window.renderVideos();
            window.toast('Comment added! 💬');
            saveUserState();
        }
    });
};

window.deleteVideo = function(id) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Video',
        subtitle: 'Are you sure you want to delete this video?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            getRef('videos/' + id).remove();
            window.videoData = window.videoData.filter(v => v.id !== id);
            window.renderVideos();
            window.toast('Video deleted');
            saveUserState();
        }
    });
};

window.handleVideoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
        window.toast('Please select a video file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        window.toast('Video too large (max 10MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const videoPost = {
            author: window.S.username || 'Anonymous',
            avatar: window.S.avatar || '😊',
            text: '',
            url: e.target.result,
            time: new Date().toISOString(),
            likes: [],
            comments: []
        };
        
        pushData('videos', videoPost);
        window.toast('📹 Video uploaded!');
        saveUserState();
    };
    reader.readAsDataURL(file);
};

console.log('👤 Profile module loaded');