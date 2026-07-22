// Social Feed Module - Shows ALL posts from everyone

function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    // SHOW ALL POSTS - no filtering by friends
    const allPosts = S.socialPosts || [];
    
    if (allPosts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first to share something!</p></div>';
        return;
    }
    
    let html = '';
    // Sort by newest first
    const sorted = [...allPosts].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    sorted.forEach(p => {
        if (!p || !p.author) return; // Skip invalid posts
        
        const liked = (p.likes || []).includes(S.username);
        const bookmarked = (S.bookmarks || []).some(b => b.id === p.id);
        const timeAgo = timeSince(new Date(p.time));
        const commentCount = (p.comments || []).length;
        const likeCount = (p.likes || []).length;
        const canDelete = p.author === S.username;
        
        // Get avatar display
        let avatarDisplay = '';
        if (p.avatar && (p.avatar.startsWith('data:') || p.avatar.includes('http'))) {
            avatarDisplay = `<img src="${p.avatar}" alt="${p.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentNode.innerHTML='${p.author.charAt(0).toUpperCase()}';" />`;
        } else {
            const color = getColor(p.author);
            avatarDisplay = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">${p.author.charAt(0).toUpperCase()}</div>`;
        }
        
        html += `<div class="ig-post" onclick="viewPostDetail('${p.id}')">
            <div class="ig-post-header">
                <div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile('${p.author}')">
                    <div class="pb-avatar" id="avatar-${p.id}">${avatarDisplay}</div>
                    <span class="pb-name">${p.author}</span>
                </div>
                <span class="ig-post-time">${timeAgo}</span>
                ${canDelete ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost('${p.id}')" style="font-size:10px;padding:2px 6px;">🗑️</button>` : ''}
            </div>
            ${p.image ? `<img src="${p.image}" class="ig-post-image" onclick="event.stopPropagation();viewPostDetail('${p.id}')" />` : ''}
            <div style="padding:0 12px 4px;">
                <p style="font-size:13px;margin:4px 0;">${escapeHtml(p.text || '')}</p>
            </div>
            <div class="ig-post-actions" onclick="event.stopPropagation();">
                <button class="ig-post-action${liked ? ' liked' : ''}" onclick="likePost('${p.id}')">${liked ? '❤️' : '🤍'}</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;">${likeCount}</span>
                <button class="ig-post-action" onclick="commentOnPost('${p.id}')">💬</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;">${commentCount}</span>
                <button class="ig-post-action${bookmarked ? ' bookmarked' : ''}" onclick="bookmarkItem('${p.id}','post')">🔖</button>
                ${p.image ? `<button class="ig-post-action" onclick="downloadMedia('${p.image}','winchu-post.jpg')">⬇️</button>` : ''}
            </div>
            ${commentCount > 0 ? `<div class="ig-post-comments" onclick="event.stopPropagation();viewPostDetail('${p.id}')">View ${commentCount} comment${commentCount > 1 ? 's' : ''}</div>` : ''}
        </div>`;
    });
    
    feed.innerHTML = html;
    
    // Load avatars asynchronously for posts that don't have them
    sorted.forEach(p => {
        if (!p.avatar || (!p.avatar.startsWith('data:') && !p.avatar.includes('http'))) {
            loadAvatarForPost(p);
        }
    });
}

// Load avatar from Firebase for a post
function loadAvatarForPost(post) {
    if (!post || !post.author) return;
    
    if (post.author === S.username && S.avatar) {
        updatePostAvatarInDOM(post.id, S.avatar);
        return;
    }
    
    getRef('users/' + post.author + '/avatar').once('value', (snapshot) => {
        const avatar = snapshot.val();
        if (avatar) {
            updatePostAvatarInDOM(post.id, avatar);
            // Update the post object for future use
            post.avatar = avatar;
        }
    });
}

function updatePostAvatarInDOM(postId, avatarUrl) {
    const avatarEl = document.getElementById('avatar-' + postId);
    if (avatarEl && avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentNode.innerHTML='?';" />`;
    }
}

// Create post with avatar
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !selectedFileData) { toast('Write something or add media'); return; }
    
    const post = {
        author: S.username,
        avatar: S.avatar || null,
        text: text || '',
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    pushData('posts', post)
        .then(() => {
            toast('📝 Posted!');
            input.value = '';
            selectedFile = null;
            selectedFileData = null;
            document.getElementById('filePreview').style.display = 'none';
            document.getElementById('filePreview').innerHTML = '';
            document.getElementById('postFile').value = '';
            saveState();
        })
        .catch((err) => {
            console.error('Post error:', err);
            toast('Failed to post. Try again.');
        });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        toast('Unsupported file type');
        event.target.value = '';
        return;
    }
    
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`File too large (max ${maxSize / (1024 * 1024)}MB)`);
        event.target.value = '';
        return;
    }
    
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        const preview = document.getElementById('filePreview');
        
        if (file.type.startsWith('image/')) {
            preview.innerHTML = `<div style="position:relative;display:inline-block;">
                <img src="${e.target.result}" style="max-height:150px;border-radius:8px;max-width:100%;" />
                <button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button>
            </div>`;
        } else {
            preview.innerHTML = `<div style="position:relative;display:inline-block;">
                <video src="${e.target.result}" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video>
                <button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button>
            </div>`;
        }
        preview.style.display = 'block';
    };
    reader.onerror = function() {
        toast('Error reading file');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function clearFileSelection() {
    selectedFile = null;
    selectedFileData = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('postFile').value = '';
}

function likePost(postId) {
    if (!S.username) { toast('Please log in'); return; }
    
    getRef('posts/' + postId).once('value', (snapshot) => {
        const post = snapshot.val();
        if (!post) { toast('Post not found'); return; }
        
        let likes = post.likes || [];
        const idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
        } else {
            likes.push(S.username);
        }
        
        getRef('posts/' + postId + '/likes').set(likes).then(() => {
            const localPost = S.socialPosts.find(p => p.id === postId);
            if (localPost) localPost.likes = likes;
            renderSocial();
            saveState();
        }).catch(err => {
            console.error('Like error:', err);
        });
    });
}

function commentOnPost(postId) {
    if (!S.username) { toast('Please log in'); return; }
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            getRef('posts/' + postId).once('value', (snapshot) => {
                const post = snapshot.val();
                if (!post) { toast('Post not found'); return; }
                
                const comments = post.comments || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                
                getRef('posts/' + postId + '/comments').set(comments).then(() => {
                    const localPost = S.socialPosts.find(p => p.id === postId);
                    if (localPost) localPost.comments = comments;
                    renderSocial();
                    toast('Comment added! 💬');
                    saveState();
                });
            });
        }
    });
}

function bookmarkItem(id, type) {
    if (!S.username) { toast('Please log in'); return; }
    
    S.bookmarks = S.bookmarks || [];
    const idx = S.bookmarks.findIndex(b => b.id === id);
    
    if (idx > -1) {
        S.bookmarks.splice(idx, 1);
        toast('Removed from saved');
    } else {
        S.bookmarks.push({ id, type, time: new Date().toISOString() });
        toast('Saved! 🔖');
    }
    
    setData('users/' + S.username + '/bookmarks', S.bookmarks);
    saveState();
    renderSocial();
    renderProfile();
}

function downloadMedia(url, filename) {
    if (!url) { toast('No media to download'); return; }
    
    try {
        if (url.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'winchu-media.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast('⬇️ Downloading...');
        } else if (url.startsWith('http')) {
            window.open(url, '_blank');
            toast('⬇️ Opening...');
        }
    } catch (e) {
        toast('Download failed');
    }
}

function deletePost(postId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            getRef('posts/' + postId).remove().then(() => {
                S.socialPosts = S.socialPosts.filter(p => p.id !== postId);
                renderSocial();
                renderProfile();
                toast('Post deleted');
                saveState();
            });
        }
    });
}

function viewPostDetail(postId) {
    const post = S.socialPosts.find(p => p.id === postId);
    if (!post) { toast('Post not found'); return; }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    const liked = (post.likes || []).includes(S.username);
    const bookmarked = (S.bookmarks || []).some(b => b.id === postId);
    
    let avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = `<img src="${post.avatar}" alt="${post.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
        const color = getColor(post.author);
        avatarDisplay = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">${post.author.charAt(0).toUpperCase()}</div>`;
    }
    
    let html = `<div class="ig-post-header">
        <div class="profile-bubble" onclick="closePostDetail();viewUserProfile('${post.author}')">
            <div class="pb-avatar">${avatarDisplay}</div>
            <span class="pb-name">${post.author}</span>
        </div>
        <span class="ig-post-time">${timeSince(new Date(post.time))}</span>
        ${post.author === S.username ? `<button class="btn-sm btn-danger" onclick="deletePost('${post.id}');closePostDetail();">🗑️</button>` : ''}
    </div>`;
    
    if (post.image) html += `<img src="${post.image}" class="post-detail-image" />`;
    
    html += `<div style="padding:8px 0;"><p style="font-size:15px;">${escapeHtml(post.text || '')}</p></div>`;
    
    html += `<div class="ig-post-actions" style="padding:8px 0;">
        <button class="ig-post-action${liked ? ' liked' : ''}" onclick="likePost('${post.id}');setTimeout(()=>viewPostDetail('${post.id}'),300);">${liked ? '❤️' : '🤍'}</button>
        <span style="margin-right:12px;font-weight:600;">${(post.likes||[]).length}</span>
        <button class="ig-post-action" onclick="commentOnPost('${post.id}');setTimeout(()=>viewPostDetail('${post.id}'),500);">💬</button>
        <span style="margin-right:12px;font-weight:600;">${(post.comments||[]).length}</span>
        <button class="ig-post-action${bookmarked ? ' bookmarked' : ''}" onclick="bookmarkItem('${post.id}','post');closePostDetail();">🔖</button>
        ${post.image ? `<button class="ig-post-action" onclick="downloadMedia('${post.image}','post.jpg')">⬇️</button>` : ''}
    </div>`;
    
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;"><strong>Comments</strong></div>';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(c => {
            html += `<div class="post-detail-comment">
                <strong onclick="closePostDetail();viewUserProfile('${c.username}')">${c.username}</strong>
                <span class="time">${new Date(c.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span><br>${c.text}
            </div>`;
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:12px;">No comments yet.</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostDetail() {
    document.getElementById('postDetailOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Status/Stories
function addStatus() {
    if (!S.username) { toast('Please log in'); return; }
    
    showDialog({
        emoji: '📸',
        title: 'Add Status',
        subtitle: 'Share a photo or text (expires in 24h)',
        placeholder: 'What\'s on your mind?',
        confirmText: 'Post Status'
    }).then(text => {
        if (text === null) return;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    toast('Image too large (max 5MB)');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(ev) {
                    saveStatus(text.trim(), ev.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
        
        // Save text-only status after 3 seconds if no file selected
        setTimeout(() => {
            if (!fileInput.files.length && text !== null) {
                saveStatus(text.trim(), null);
            }
        }, 3000);
    });
}

function saveStatus(text, imageData) {
    if (!text && !imageData) return;
    
    const status = {
        author: S.username,
        avatar: S.avatar || null,
        text: text || '',
        image: imageData || null,
        time: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        views: []
    };
    
    pushData('statuses', status).then(() => {
        toast('Status added! 📸');
        renderStories();
    });
}

function renderStories() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    
    getRef('statuses').orderByChild('time').limitToLast(30).once('value', (snapshot) => {
        const statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(key => {
                const s = snapshot.val()[key];
                s.id = key;
                const isExpired = new Date(s.expires) < new Date();
                if (!isExpired) statuses.push(s);
            });
        }
        
        const authors = [...new Set(statuses.map(s => s.author))];
        
        if (!authors.includes(S.username)) {
            authors.unshift(S.username);
        }
        
        if (authors.length === 0) {
            row.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No stories yet</div>';
            return;
        }
        
        row.innerHTML = authors.map(author => {
            const authorStatus = statuses.find(s => s.author === author);
            const isMyStatus = author === S.username;
            
            let avatarDisplay = '';
            if (isMyStatus && S.avatar) {
                avatarDisplay = `<img src="${S.avatar}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            } else if (authorStatus && authorStatus.avatar) {
                avatarDisplay = `<img src="${authorStatus.avatar}" alt="${author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            } else {
                const color = getColor(author);
                avatarDisplay = `<div style="width:100%;height:100%;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;">${author.charAt(0).toUpperCase()}</div>`;
            }
            
            return `<div class="ig-story" onclick="${isMyStatus ? 'addStatus()' : `viewStatus('${author}')`}">
                <div class="ig-story-avatar"><div class="inner">${avatarDisplay}</div></div>
                <span class="ig-story-name">${isMyStatus ? 'My Status' : author}</span>
                ${isMyStatus ? '<span style="font-size:8px;color:#6366f1;">+ Add</span>' : ''}
            </div>`;
        }).join('');
    });
}

function viewStatus(username) {
    getRef('statuses').orderByChild('time').limitToLast(20).once('value', (snapshot) => {
        const statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(key => {
                const s = snapshot.val()[key];
                if (s.author === username && new Date(s.expires) > new Date()) {
                    statuses.push(s);
                }
            });
        }
        
        if (statuses.length === 0) {
            toast('No active status from @' + username);
            return;
        }
        
        const status = statuses[statuses.length - 1];
        
        let html = `<div style="text-align:center;">
            <span style="font-weight:600;">${status.author}</span>
            <br><small style="color:#94a3b8;">${timeSince(new Date(status.time))}</small>
        </div>`;
        
        if (status.image) {
            html += `<img src="${status.image}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin:8px 0;" />`;
        }
        
        if (status.text) {
            html += `<p style="font-size:15px;text-align:center;padding:10px;">${escapeHtml(status.text)}</p>`;
        }
        
        const overlay = document.getElementById('postDetailOverlay');
        const body = document.getElementById('postDetailBody');
        
        body.innerHTML = `<button class="post-detail-back" onclick="closePostDetail()">← <span>Close</span></button>${html}`;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (!status.views) status.views = [];
        if (!status.views.includes(S.username)) {
            status.views.push(S.username);
            getRef('statuses/' + status.id + '/views').set(status.views);
        }
    });
}

// Setup posts listener - load all posts
function setupPostsListener() {
    if (postsListener) postsListener.off();
    
    // Load all posts from Firebase
    getRef('posts').orderByChild('time').limitToLast(100).once('value', (snapshot) => {
        const data = snapshot.val();
        S.socialPosts = [];
        if (data) {
            Object.keys(data).forEach(key => {
                const post = data[key];
                post.id = key;
                if (post.author) {
                    S.socialPosts.push(post);
                }
            });
        }
        S.socialPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    });
    
    // Listen for new posts
    postsListener = getRef('posts').orderByChild('time').limitToLast(100);
    
    postsListener.on('child_added', (snapshot) => {
        const post = snapshot.val();
        if (!post || !post.author) return;
        post.id = snapshot.key;
        
        if (!S.socialPosts.find(p => p.id === post.id)) {
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 100) S.socialPosts.pop();
            S.socialPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    postsListener.on('child_changed', (snapshot) => {
        const post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        const idx = S.socialPosts.findIndex(p => p.id === post.id);
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    postsListener.on('child_removed', (snapshot) => {
        S.socialPosts = S.socialPosts.filter(p => p.id !== snapshot.key);
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active - showing ALL posts');
}

// Expose functions globally
window.addStatus = addStatus;
window.viewStatus = viewStatus;
window.clearFileSelection = clearFileSelection;

console.log('📱 Social module loaded - ALL posts visible');