// In renderSocial function, fix the avatar display:
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
        
        // FIXED: Avatar display - show image if available, otherwise emoji
        let avatarDisplay = '';
        if (p.avatar && p.avatar.startsWith('data:')) {
            avatarDisplay = `<img src="${p.avatar}" alt="${p.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else if (p.avatar && p.avatar.includes('unsplash')) {
            avatarDisplay = `<img src="${p.avatar}" alt="${p.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            avatarDisplay = p.avatar || '😊';
        }
        
        html += `<div class="ig-post" onclick="viewPostDetail('${p.id}')">
            <div class="ig-post-header">
                <div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile('${p.author}')">
                    <div class="pb-avatar">${avatarDisplay}</div>
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

// FIXED: createPost - store avatar properly
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !selectedFileData) { toast('Write something or add media'); return; }
    
    // FIXED: Use the actual avatar image, not emoji
    const avatar = S.avatar || null;
    
    const post = {
        author: S.username,
        avatar: avatar,  // Store the actual avatar data URL
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

// Also fix viewPostDetail avatar
function viewPostDetail(postId) {
    const post = S.socialPosts.find(p => p.id === postId);
    if (!post) { toast('Post not found'); return; }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    const liked = (post.likes || []).includes(S.username);
    const bookmarked = (S.bookmarks || []).some(b => b.id === postId);
    
    // FIXED: Avatar display
    let avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('unsplash') || post.avatar.includes('http'))) {
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