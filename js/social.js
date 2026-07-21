// Social Feed Module - Fix duplicate declaration
window.postsListener = null;
window.selectedFile = null;
window.selectedFileData = null;

// Setup Posts Listener
window.setupPostsListener = function() {
    // Remove old listener if exists
    if (window.postsListener) {
        window.postsListener.off();
        window.postsListener = null;
    }
    
    const postsRef = getRef('posts');
    window.postsListener = postsRef.orderByChild('time').limitToLast(50);
    
    window.postsListener.on('child_added', (snapshot) => {
        const post = snapshot.val();
        post.id = snapshot.key;
        
        if (!window.S.socialPosts.find(p => p.id === post.id)) {
            window.S.socialPosts.unshift(post);
            if (window.S.socialPosts.length > 50) {
                window.S.socialPosts.pop();
            }
            
            // Sort by time
            window.S.socialPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
            
            if (window.renderSocial) window.renderSocial();
            if (window.renderProfile) window.renderProfile();
            if (window.renderStories) window.renderStories();
            saveUserState();
        }
    });
    
    window.postsListener.on('child_changed', (snapshot) => {
        const post = snapshot.val();
        post.id = snapshot.key;
        
        const index = window.S.socialPosts.findIndex(p => p.id === post.id);
        if (index > -1) {
            window.S.socialPosts[index] = post;
            if (window.renderSocial) window.renderSocial();
            saveUserState();
        }
    });
    
    window.postsListener.on('child_removed', (snapshot) => {
        window.S.socialPosts = window.S.socialPosts.filter(p => p.id !== snapshot.key);
        if (window.renderSocial) window.renderSocial();
        if (window.renderProfile) window.renderProfile();
        saveUserState();
    });
};

// Render Social Feed
window.renderSocial = function() {
    const feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!window.S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px 0;">Please log in to see posts</p>';
        return;
    }
    
    if (!window.S.socialPosts || window.S.socialPosts.length === 0) {
        feed.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:#94a3b8;">
                <div style="font-size:48px;margin-bottom:12px;">📸</div>
                <p>No posts yet. Share something!</p>
            </div>`;
        return;
    }
    
    let html = '';
    window.S.socialPosts.forEach(p => {
        const liked = (p.likes || []).includes(window.S.username);
        const timeAgo = window.timeSince ? window.timeSince(new Date(p.time)) : 'recent';
        const avatarDisplay = p.avatar || '😊';
        const commentCount = (p.comments || []).length;
        const canDelete = p.author === window.S.username;
        const likeCount = (p.likes || []).length;
        
        html += `
            <div class="ig-post" onclick="window.viewPostDetail('${p.id}')">
                <div class="ig-post-header">
                    <div class="ig-post-avatar">${avatarDisplay}</div>
                    <span class="ig-post-user">${p.author}</span>
                    <span class="ig-post-time">${timeAgo}</span>
                    ${canDelete ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation(); window.deletePost('${p.id}')" style="font-size:11px;padding:2px 8px;">🗑️</button>` : ''}
                </div>
                ${p.image ? `<img src="${p.image}" class="post-image" alt="Post" />` : ''}
                <div style="padding:0 12px 4px;">
                    <p style="font-size:13px;margin:4px 0;">${escapeHtml(p.text || '')}</p>
                </div>
                <div class="ig-post-actions" onclick="event.stopPropagation();">
                    <button class="ig-post-action ${liked ? 'liked' : ''}" onclick="window.likePost('${p.id}')">
                        ${liked ? '❤️' : '🤍'}
                    </button>
                    <span style="font-size:13px;font-weight:600;color:#94a3b8;">${likeCount}</span>
                    <button class="ig-post-action" onclick="window.commentOnPost('${p.id}')">💬</button>
                    <span style="font-size:13px;font-weight:600;color:#94a3b8;">${commentCount}</span>
                    ${p.image ? `<button class="ig-post-action" onclick="window.downloadMedia('${p.image}', 'winchu-post.jpg')">⬇️</button>` : ''}
                </div>
                ${commentCount > 0 ? `
                    <div class="ig-post-comments" onclick="event.stopPropagation(); window.viewPostDetail('${p.id}')">
                        View ${commentCount} comment${commentCount > 1 ? 's' : ''}
                    </div>` : ''}
            </div>`;
    });
    
    feed.innerHTML = html;
};

// Create Post
window.createPost = function() {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !window.selectedFileData) {
        window.toast('Write something or add media');
        return;
    }
    
    const avatar = window.S.avatar || 
        (window.S.selectedAuras.length > 0 ? 
            window.S.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊');
    
    const post = {
        author: window.S.username,
        avatar: avatar,
        text: text || '',
        image: window.selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    // Push to Firebase
    const newPostRef = getRef('posts').push();
    newPostRef.set(post)
        .then(() => {
            window.toast('📝 Posted!');
        })
        .catch((err) => {
            console.error('Post error:', err);
            window.toast('Failed to post. Check permissions.');
        });
    
    // Clear input
    input.value = '';
    window.selectedFile = null;
    window.selectedFileData = null;
    
    const preview = document.getElementById('filePreview');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    
    saveUserState();
};

// Handle File Select
window.handleFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        window.toast('File too large (max 5MB)');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        window.toast('Please select an image or video');
        return;
    }
    
    window.selectedFile = file;
    const reader = new FileReader();
    
    reader.onload = function(e) {
        window.selectedFileData = e.target.result;
        const preview = document.getElementById('filePreview');
        
        if (file.type.startsWith('image/')) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-height:150px;border-radius:8px;max-width:100%;" alt="Preview" />`;
        } else if (file.type.startsWith('video/')) {
            preview.innerHTML = `<video src="${e.target.result}" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video>`;
        }
        
        preview.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
};

// Like Post
window.likePost = function(postId) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const post = window.S.socialPosts.find(p => p.id === postId);
    if (!post) return;
    
    let likes = post.likes || [];
    const index = likes.indexOf(window.S.username);
    
    if (index > -1) {
        likes.splice(index, 1);
    } else {
        likes.push(window.S.username);
    }
    
    post.likes = likes;
    getRef('posts/' + postId + '/likes').set(likes)
        .then(() => {
            window.renderSocial();
            saveUserState();
        })
        .catch(err => {
            console.error('Like error:', err);
        });
};

// Comment on Post
window.commentOnPost = function(postId) {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    window.showDialog({
        emoji: '💬',
        title: 'Add Comment',
        subtitle: 'Write your comment',
        placeholder: 'Type your comment...',
        confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            const post = window.S.socialPosts.find(p => p.id === postId);
            if (!post) return;
            
            const comments = post.comments || [];
            comments.push({
                username: window.S.username,
                text: result.trim(),
                time: new Date().toISOString()
            });
            
            post.comments = comments;
            getRef('posts/' + postId + '/comments').set(comments)
                .then(() => {
                    window.renderSocial();
                    window.toast('Comment added! 💬');
                    saveUserState();
                })
                .catch(err => {
                    console.error('Comment error:', err);
                });
        }
    });
};

// Delete Post
window.deletePost = function(postId) {
    window.showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            getRef('posts/' + postId).remove()
                .then(() => {
                    window.S.socialPosts = window.S.socialPosts.filter(p => p.id !== postId);
                    window.renderSocial();
                    window.renderProfile();
                    window.toast('Post deleted');
                    saveUserState();
                })
                .catch(err => {
                    console.error('Delete error:', err);
                    window.toast('Failed to delete');
                });
        }
    });
};

// Download Media
window.downloadMedia = function(url, filename) {
    if (!url) {
        window.toast('No media to download');
        return;
    }
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'winchu-media.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Render Stories
window.renderStories = function() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    
    const users = [...new Set(window.S.socialPosts.map(p => p.author))];
    
    if (users.length === 0) {
        row.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px 0;">No stories yet</div>';
        return;
    }
    
    row.innerHTML = users.slice(0, 10).map(u => {
        const post = window.S.socialPosts.find(p => p.author === u);
        const avatar = post ? (post.avatar || '😊') : '😊';
        return `
            <div class="ig-story">
                <div class="ig-story-avatar">
                    <div class="inner">${avatar}</div>
                </div>
                <span class="ig-story-name">${u}</span>
            </div>`;
    }).join('');
};

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('📱 Social module loaded');