// Social Feed Module

function setupPostsListener() {
    if (postsListener) postsListener.off();
    
    postsListener = getRef('posts').orderByChild('time').limitToLast(50);
    
    postsListener.on('child_added', (snapshot) => {
        const post = snapshot.val();
        post.id = snapshot.key;
        
        if (!S.socialPosts.find(p => p.id === post.id)) {
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 50) S.socialPosts.pop();
            S.socialPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    postsListener.on('child_changed', (snapshot) => {
        const post = snapshot.val();
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

function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    if (!S.socialPosts || S.socialPosts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet.</p></div>';
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
        
        html += `<div class="ig-post" onclick="viewPostDetail('${p.id}')">
            <div class="ig-post-header">
                <div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile('${p.author}')">
                    <div class="pb-avatar">${p.avatar || '😊'}</div>
                    <span class="pb-name">${p.author}</span>
                </div>
                <span class="ig-post-time">${timeAgo}</span>
                ${canDelete ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost('${p.id}')" style="font-size:10px;padding:2px 6px;">🗑️</button>` : ''}
            </div>
            ${p.image ? `<img src="${p.image}" class="ig-post-image" onclick="event.stopPropagation();" />` : ''}
            <div style="padding:0 12px 4px;"><p style="font-size:13px;margin:4px 0;">${escapeHtml(p.text || '')}</p></div>
            <div class="ig-post-actions" onclick="event.stopPropagation();">
                <button class="ig-post-action${liked ? ' liked' : ''}" onclick="likePost('${p.id}')">${liked ? '❤️' : '🤍'}</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;">${likeCount}</span>
                <button class="ig-post-action" onclick="commentOnPost('${p.id}')">💬</button>
                <span style="font-size:12px;font-weight:600;color:#94a3b8;">${commentCount}</span>
                <button class="ig-post-action${bookmarked ? ' bookmarked' : ''}" onclick="bookmarkItem('${p.id}','post')">🔖</button>
                ${p.image ? `<button class="ig-post-action" onclick="downloadMedia('${p.image}','post.jpg')">⬇️</button>` : ''}
            </div>
            ${commentCount > 0 ? `<div class="ig-post-comments" onclick="event.stopPropagation();viewPostDetail('${p.id}')">View ${commentCount} comment${commentCount > 1 ? 's' : ''}</div>` : ''}
        </div>`;
    });
    
    feed.innerHTML = html;
}

function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !selectedFileData) { toast('Write something or add media'); return; }
    
    const avatar = S.avatar || (S.selectedAuras.length > 0 ? S.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊');
    
    const post = {
        author: S.username,
        avatar: avatar,
        text: text || '',
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    pushData('posts', post).then(() => {
        toast('📝 Posted!');
    }).catch(() => {
        toast('Failed to post');
    });
    
    input.value = '';
    selectedFile = null;
    selectedFileData = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('filePreview').innerHTML = '';
    saveState();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`File too large (max ${maxSize / (1024 * 1024)}MB)`);
        return;
    }
    
    selectedFile = file;
    const reader = new FileReader();
    
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        const preview = document.getElementById('filePreview');
        
        if (file.type.startsWith('image/')) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-height:150px;border-radius:8px;max-width:100%;" />`;
        } else if (file.type.startsWith('video/')) {
            preview.innerHTML = `<video src="${e.target.result}" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video>`;
        }
        
        preview.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

function likePost(postId) {
    if (!S.username) return;
    
    getRef('posts/' + postId).once('value', (snapshot) => {
        const post = snapshot.val();
        if (!post) return;
        
        let likes = post.likes || [];
        const idx = likes.indexOf(S.username);
        
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        
        getRef('posts/' + postId + '/likes').set(likes).then(() => {
            const localPost = S.socialPosts.find(p => p.id === postId);
            if (localPost) localPost.likes = likes;
            renderSocial();
            addNotification(post.author, `${S.username} liked your post`, 'like', postId);
        });
    });
}

function commentOnPost(postId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            getRef('posts/' + postId).once('value', (snapshot) => {
                const post = snapshot.val();
                if (!post) return;
                
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
                    addNotification(post.author, `${S.username} commented on your post`, 'comment', postId);
                });
            });
        }
    });
}

function deletePost(postId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure you want to delete this post?',
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

function downloadMedia(url, filename) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'media.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

function viewPostDetail(postId) {
    const post = S.socialPosts.find(p => p.id === postId);
    if (!post) { toast('Post not found'); return; }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    const liked = (post.likes || []).includes(S.username);
    const bookmarked = (S.bookmarks || []).some(b => b.id === postId);
    
    let html = `<div class="ig-post-header">
        <div class="profile-bubble" onclick="closePostDetail();viewUserProfile('${post.author}')">
            <div class="pb-avatar">${post.avatar || '😊'}</div>
            <span class="pb-name">${post.author}</span>
        </div>
        <span class="ig-post-time">${timeSince(new Date(post.time))}</span>
        ${post.author === S.username ? `<button class="btn-sm btn-danger" onclick="deletePost('${post.id}');closePostDetail();">🗑️</button>` : ''}
    </div>`;
    
    if (post.image) html += `<img src="${post.image}" class="post-detail-image" />`;
    
    html += `<div style="padding:8px 0;"><p style="font-size:15px;">${escapeHtml(post.text || '')}</p></div>`;
    
    html += `<div class="ig-post-actions">
        <button class="ig-post-action${liked ? ' liked' : ''}" onclick="likePost('${post.id}');setTimeout(()=>viewPostDetail('${post.id}'),300);">${liked ? '❤️' : '🤍'}</button>
        <span style="margin-right:8px;">${(post.likes || []).length}</span>
        <button class="ig-post-action" onclick="commentOnPost('${post.id}');setTimeout(()=>viewPostDetail('${post.id}'),500);">💬</button>
        <span>${(post.comments || []).length}</span>
        <button class="ig-post-action${bookmarked ? ' bookmarked' : ''}" onclick="bookmarkItem('${post.id}','post');closePostDetail();">🔖</button>
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