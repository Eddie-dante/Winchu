// ==================== SOCIAL LOGIC ====================
function setupPostsListener() {
    if (window.postsListener) {
        window.postsListener.off();
    }
    const postsRef = getRef('posts');
    window.postsListener = postsRef.orderByKey().limitToLast(50);
    window.postsListener.on('child_added', function(snapshot) {
        const post = snapshot.val();
        post.id = snapshot.key;
        if (!window.S.socialPosts.find(p => p.id === post.id)) {
            window.S.socialPosts.unshift(post);
            if (window.S.socialPosts.length > 50) window.S.socialPosts.pop();
            renderSocial();
            renderStories();
        }
    });
}
window.setupPostsListener = setupPostsListener;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        window.selectedFileData = e.target.result;
        const preview = document.getElementById('filePreview');
        preview.style.display = 'block';
        preview.innerHTML = '<img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;">';
    };
    reader.readAsDataURL(file);
}
window.handleFileSelect = handleFileSelect;

function createPost() {
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    if (!text && !window.selectedFileData) {
        window.toast('Write something or add media');
        return;
    }

    const avatar = window.S.selectedAuras.length > 0 ? window.S.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';
    const post = {
        author: window.S.username || 'You',
        avatar: avatar,
        text: text || '',
        image: window.selectedFileData || null,
        time: new Date().toISOString(),
        likes: []
    };
    const postsRef = getRef('posts');
    postsRef.push(post);
    input.value = '';
    window.selectedFile = null;
    window.selectedFileData = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('filePreview').innerHTML = '';
    window.toast('📝 Posted!');
}
window.createPost = createPost;

function likePost(id) {
    if (!id) return;
    const post = window.S.socialPosts.find(p => p.id === id);
    if (!post) return;
    const likes = post.likes || [];
    const idx = likes.indexOf(window.S.username);
    if (idx > -1) {
        likes.splice(idx, 1);
    } else {
        likes.push(window.S.username);
    }
    post.likes = likes;
    const postRef = getRef(`posts/${id}/likes`);
    postRef.set(likes);
    renderSocial();
}
window.likePost = likePost;

function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    const postRef = getRef(`posts/${id}`);
    postRef.remove();
    window.S.socialPosts = window.S.socialPosts.filter(p => p.id !== id);
    renderSocial();
    renderStories();
}
window.deletePost = deletePost;

function renderStories() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    const users = [...new Set(window.S.socialPosts.map(p => p.author))];
    if (users.length === 0) {
        row.innerHTML = '<div style="display:flex;gap:10px;padding:4px 0;color:#94a3b8;font-size:12px;">No stories yet</div>';
        return;
    }
    row.innerHTML = users.slice(0, 10).map(u => {
        const post = window.S.socialPosts.find(p => p.author === u);
        const emoji = post ? post.avatar : '😊';
        return `<div class="ig-story"><div class="ig-story-avatar"><div class="inner">${emoji}</div></div><span class="ig-story-name">${u}</span></div>`;
    }).join('');
}
window.renderStories = renderStories;

function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) return;
    if (window.S.socialPosts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px 0;color:#94a3b8;"><div style="font-size:48px;margin-bottom:12px;">📸</div><p>No posts yet. Share your journey!</p></div>';
        return;
    }
    feed.innerHTML = window.S.socialPosts.map(p => {
        const liked = (p.likes || []).includes(window.S.username);
        const timeAgo = timeSince(new Date(p.time));
        const avatarDisplay = p.avatar || '😊';
        return `<div class="ig-post"><div class="ig-post-header"><div class="ig-post-avatar">${avatarDisplay}</div><span class="ig-post-user">${p.author}</span><span class="ig-post-time">${timeAgo}</span>${p.author === window.S.username ? `<button class="btn-sm btn-danger" onclick="deletePost('${p.id}')" style="font-size:11px;padding:2px 8px;">🗑️</button>` : ''}</div>${p.image ? `<img src="${p.image}" class="post-image" />` : ''}<div style="padding:0 12px 4px;"><p style="font-size:13px;margin:4px 0;">${p.text}</p></div><div class="ig-post-actions"><button class="ig-post-action ${liked ? 'liked' : ''}" onclick="likePost('${p.id}')">${liked ? '❤️' : '🤍'}</button><span style="font-size:13px;font-weight:600;color:#94a3b8;">${(p.likes || []).length} likes</span></div></div>`;
    }).join('');
}
window.renderSocial = renderSocial;

function timeSince(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString();
}

function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;

    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        const usernames = Object.keys(users);

        if (usernames.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No users yet.</p>';
            return;
        }

        container.innerHTML = usernames.map(u => {
            const isMe = u === window.S.username;
            const userData = users[u] || {};
            const isOnline = userData.last_seen && (Date.now() - new Date(userData.last_seen).getTime() < 60000);
            const postCount = window.S.socialPosts ? window.S.socialPosts.filter(p => p.author === u).length : 0;
            const color = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7B787','#FF8A80','#B388FF','#82B1FF','#B9F6CA','#FFE57F','#FF80AB','#EA80FC','#8C9EFF'][u.length % 16];
            const avatarHTML = `<div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px;">${u.charAt(0).toUpperCase()}</div>`;

            return `
                <div class="user-card">
                    <div class="user-avatar">${avatarHTML}</div>
                    <div class="user-info">
                        <div class="name">
                            ${isMe ? '⭐ ' : ''}${u}
                            <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                            ${isOnline ? '🟢 Online' : '⚪ Offline'}
                        </div>
                        <div class="bio">${userData.bio || 'No bio yet'} • ${postCount} posts</div>
                    </div>
                </div>
            `;
        }).join('');
    });
}
window.renderUsers = renderUsers;