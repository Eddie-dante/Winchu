// Social Feed Module - Fixed like, comment, download buttons

function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    if (!S.socialPosts || S.socialPosts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Share something!</p></div>';
        return;
    }
    
    let html = '';
    const sorted = [...S.socialPosts].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    sorted.forEach(p => {
        const liked = (p.likes || []).includes(S.username);
        const bookmarked = (S.bookmarks || []).some(b => b.id === p.id);
        const timeAgo = timeSince(new Date(p.time));
        const commentCount = (p.comments || []).length;
        const likeCount = (p.likes || []).length;
        const canDelete = p.author === S.username;
        
        let avatarDisplay = '';
        if (p.avatar && (p.avatar.startsWith('data:') || p.avatar.includes('http'))) {
            avatarDisplay = `<img src="${p.avatar}" alt="${p.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            avatarDisplay = p.avatar || '😊';
        }
        
        html += `<div class="ig-post">
            <div class="ig-post-header">
                <div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile('${p.author}')">
                    <div class="pb-avatar">${avatarDisplay}</div>
                    <span class="pb-name">${p.author}</span>
                </div>
                <span class="ig-post-time">${timeAgo}</span>
                ${canDelete ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost('${p.id}')" style="font-size:10px;padding:2px 6px;">🗑️</button>` : ''}
            </div>
            ${p.image ? `<img src="${p.image}" class="ig-post-image" onclick="event.stopPropagation();viewPostDetail('${p.id}')" />` : ''}
            <div style="padding:0 12px 4px;">
                <p style="font-size:13px;margin:4px 0;">${escapeHtml(p.text || '')}</p>
            </div>
            <div class="ig-post-actions">
                <button class="ig-post-action${liked ? ' liked' : ''}" onclick="event.stopPropagation();likePost('${p.id}')">${liked ? '❤️' : '🤍'}</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;cursor:default;">${likeCount}</span>
                <button class="ig-post-action" onclick="event.stopPropagation();commentOnPost('${p.id}')">💬</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;cursor:default;">${commentCount}</span>
                <button class="ig-post-action${bookmarked ? ' bookmarked' : ''}" onclick="event.stopPropagation();bookmarkItem('${p.id}','post')">🔖</button>
                ${p.image ? `<button class="ig-post-action" onclick="event.stopPropagation();downloadMedia('${p.image}','winchu-post.jpg')">⬇️</button>` : ''}
            </div>
            ${commentCount > 0 ? `<div class="ig-post-comments" onclick="event.stopPropagation();viewPostDetail('${p.id}')">View ${commentCount} comment${commentCount > 1 ? 's' : ''}</div>` : ''}
        </div>`;
    });
    
    feed.innerHTML = html;
}

// FIXED: createPost
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !selectedFileData) { toast('Write something or add media'); return; }
    
    const avatar = S.avatar || null;
    
    const post = {
        author: S.username,
        avatar: avatar,
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
            toast('Failed to post. Please try again.');
        });
}

// FIXED: handleFileSelect
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        toast('Unsupported file type. Use JPEG, PNG, GIF, WebP, MP4, or WebM.');
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

// FIXED: likePost - works properly
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
            // Update local state
            const localPost = S.socialPosts.find(p => p.id === postId);
            if (localPost) localPost.likes = likes;
            renderSocial();
            saveState();
        }).catch(err => {
            console.error('Like error:', err);
        });
    });
}

// FIXED: commentOnPost
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
                }).catch(err => {
                    console.error('Comment error:', err);
                });
            });
        }
    });
}

// FIXED: downloadMedia
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
            toast('⬇️ Opening in new tab...');
        } else {
            toast('Cannot download this file');
        }
    } catch (e) {
        console.error('Download error:', e);
        toast('Download failed');
    }
}

// FIXED: deletePost
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
            }).catch(err => {
                console.error('Delete error:', err);
                toast('Failed to delete');
            });
        }
    });
}

// FIXED: viewPostDetail
function viewPostDetail(postId) {
    const post = S.socialPosts.find(p => p.id === postId);
    if (!post) { toast('Post not found'); return; }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    const liked = (post.likes || []).includes(S.username);
    const bookmarked = (S.bookmarks || []).some(b => b.id === postId);
    const likeCount = (post.likes || []).length;
    const commentCount = (post.comments || []).length;
    
    let avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = `<img src="${post.avatar}" alt="${post.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
        avatarDisplay = post.avatar || '😊';
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
        <span style="margin-right:12px;font-weight:600;">${likeCount}</span>
        <button class="ig-post-action" onclick="commentOnPost('${post.id}');setTimeout(()=>viewPostDetail('${post.id}'),500);">💬</button>
        <span style="margin-right:12px;font-weight:600;">${commentCount}</span>
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

// Setup posts listener
function setupPostsListener() {
    if (postsListener) postsListener.off();
    
    postsListener = getRef('posts').orderByChild('time').limitToLast(50);
    
    postsListener.on('child_added', (snapshot) => {
        const post = snapshot.val();
        if (!post || !post.author) return;
        post.id = snapshot.key;
        
        if (!S.socialPosts.find(p => p.id === post.id)) {
            S.socialPosts.push(post);
            if (S.socialPosts.length > 50) S.socialPosts.shift();
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
}

function renderStories() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    const users = [...new Set(S.socialPosts.map(p => p.author))];
    if (users.length === 0) {
        row.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No stories yet</div>';
        return;
    }
    row.innerHTML = users.slice(0, 12).map(u => {
        const post = S.socialPosts.find(p => p.author === u);
        return `<div class="ig-story" onclick="viewUserProfile('${u}')">
            <div class="ig-story-avatar"><div class="inner">${post?.avatar || '😊'}</div></div>
            <span class="ig-story-name">${u}</span>
        </div>`;
    }).join('');
}

console.log('📱 Social module loaded - all buttons fixed');