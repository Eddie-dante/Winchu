// Social Feed Module - Fixed Upload

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

// FIXED: createPost with proper error handling
function createPost() {
    if (!S.username) { 
        toast('Please log in'); 
        return; 
    }
    
    const input = document.getElementById('postInput');
    const text = input.value.trim();
    
    if (!text && !selectedFileData) { 
        toast('Write something or add media'); 
        return; 
    }
    
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
    
    // Show loading
    const postBtn = document.querySelector('#page-social .btn-primary');
    if (postBtn) {
        postBtn.textContent = 'Posting...';
        postBtn.disabled = true;
    }
    
    pushData('posts', post)
        .then(() => {
            toast('📝 Posted!');
            
            // Clear inputs
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
        })
        .finally(() => {
            if (postBtn) {
                postBtn.textContent = 'Post';
                postBtn.disabled = false;
            }
        });
}

// FIXED: handleFileSelect with validation
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
        toast('Unsupported file type. Use JPEG, PNG, GIF, WebP, MP4, WebM, or MOV.');
        event.target.value = '';
        return;
    }
    
    // Check file size
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
        } else if (file.type.startsWith('video/')) {
            preview.innerHTML = `<div style="position:relative;display:inline-block;">
                <video src="${e.target.result}" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video>
                <button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button>
            </div>`;
        }
        
        preview.style.display = 'block';
    };
    
    reader.onerror = function() {
        toast('Error reading file. Please try again.');
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

// Clear file selection
function clearFileSelection() {
    selectedFile = null;
    selectedFileData = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('postFile').value = '';
}

// Setup posts listener with better error handling
function setupPostsListener() {
    if (postsListener) postsListener.off();
    
    postsListener = getRef('posts').orderByChild('time').limitToLast(50);
    
    postsListener.on('child_added', (snapshot) => {
        try {
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
        } catch (e) {
            console.error('Error processing post:', e);
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
    
    console.log('📱 Posts listener active');
}