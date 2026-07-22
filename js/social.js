// Social Feed Module - Complete fix for posting and viewing

// Setup posts listener - loads ALL posts
function setupPostsListener() {
    console.log('Setting up posts listener...');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    // First, load ALL existing posts from Firebase
    getRef('posts').once('value').then(function(snapshot) {
        const data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            const keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in Firebase');
            
            keys.forEach(function(key) {
                const post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
            // Sort newest first
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.socialPosts.length + ' posts into local state');
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Listen for new posts added
    postsListener = getRef('posts');
    postsListener.on('child_added', function(snapshot) {
        const post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        
        // Check if already in array
        const exists = S.socialPosts.find(function(p) { 
            return p.id === post.id; 
        });
        
        if (!exists) {
            console.log('New post detected:', post.id);
            S.socialPosts.unshift(post);
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    postsListener.on('child_changed', function(snapshot) {
        const post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        
        const idx = S.socialPosts.findIndex(function(p) { 
            return p.id === post.id; 
        });
        
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    postsListener.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { 
            return p.id !== snapshot.key; 
        });
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active');
}

// Render social feed - shows ALL posts
function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) {
        console.log('Feed element not found');
        return;
    }
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    const posts = S.socialPosts || [];
    console.log('Rendering ' + posts.length + ' posts');
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first to share!</p></div>';
        return;
    }
    
    let html = '';
    
    posts.forEach(function(p) {
        if (!p || !p.author) return;
        
        const liked = (p.likes || []).includes(S.username);
        const bookmarked = (S.bookmarks || []).some(function(b) { return b.id === p.id; });
        const timeAgo = timeSince(new Date(p.time));
        const commentCount = (p.comments || []).length;
        const likeCount = (p.likes || []).length;
        const canDelete = p.author === S.username;
        
        // Avatar
        let avatarDisplay = '';
        if (p.avatar && (p.avatar.startsWith('data:') || p.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + p.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            const color = getColor(p.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + p.author.charAt(0).toUpperCase() + '</div>';
        }
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + p.id + '\')">';
        html += '<div class="ig-post-header">';
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + p.author + '\')">';
        html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
        html += '<span class="pb-name">' + p.author + '</span>';
        html += '</div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (canDelete) {
            html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + p.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        }
        html += '</div>';
        
        if (p.image) {
            html += '<img src="' + p.image + '" class="ig-post-image" />';
        }
        
        if (p.text) {
            html += '<div style="padding:0 12px 4px;"><p style="font-size:13px;margin:4px 0;">' + escapeHtml(p.text) + '</p></div>';
        }
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + p.id + '\')">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;margin-right:12px;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + p.id + '\')">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;margin-right:12px;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + p.id + '\',\'post\')">🔖</button>';
        if (p.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + p.image + '\',\'post.jpg\')">⬇️</button>';
        }
        html += '</div>';
        
        if (commentCount > 0) {
            html += '<div class="ig-post-comments" onclick="event.stopPropagation();viewPostDetail(\'' + p.id + '\')">View ' + commentCount + ' comment' + (commentCount > 1 ? 's' : '') + '</div>';
        }
        
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// Create post - save to Firebase
function createPost() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    const input = document.getElementById('postInput');
    if (!input) return;
    
    const text = input.value.trim();
    
    if (!text && !selectedFileData) {
        toast('Write something or add media');
        return;
    }
    
    console.log('Creating post for user:', S.username);
    
    const post = {
        author: S.username,
        avatar: S.avatar || null,
        text: text || '',
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    // Save to Firebase
    pushData('posts', post).then(function() {
        console.log('Post saved to Firebase successfully');
        
        // Clear inputs
        input.value = '';
        selectedFile = null;
        selectedFileData = null;
        
        const preview = document.getElementById('filePreview');
        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
        
        const fileInput = document.getElementById('postFile');
        if (fileInput) fileInput.value = '';
        
        saveState();
        toast('📝 Posted!');
        
        // The listener will pick up the new post and render it
    }).catch(function(error) {
        console.error('Post save error:', error);
        toast('Failed to post. Error: ' + error.message);
    });
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('File too large (max ' + (maxSize / (1024 * 1024)) + 'MB)');
        event.target.value = '';
        return;
    }
    
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        console.log('File loaded, data length:', selectedFileData.length);
        
        const preview = document.getElementById('filePreview');
        if (!preview) return;
        
        if (file.type.startsWith('image/')) {
            preview.innerHTML = '<div style="position:relative;display:inline-block;"><img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;" /><button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button></div>';
        } else {
            preview.innerHTML = '<div style="position:relative;display:inline-block;"><video src="' + e.target.result + '" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video><button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button></div>';
        }
        preview.style.display = 'block';
    };
    reader.onerror = function() {
        console.error('File read error');
        toast('Error reading file');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function clearFileSelection() {
    selectedFile = null;
    selectedFileData = null;
    const preview = document.getElementById('filePreview');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    const fileInput = document.getElementById('postFile');
    if (fileInput) fileInput.value = '';
}

function likePost(postId) {
    if (!S.username) return;
    
    getRef('posts/' + postId + '/likes').once('value').then(function(snapshot) {
        let likes = snapshot.val() || [];
        const idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
        } else {
            likes.push(S.username);
        }
        
        return getRef('posts/' + postId + '/likes').set(likes);
    }).then(function() {
        renderSocial();
        saveState();
    }).catch(function(error) {
        console.error('Like error:', error);
    });
}

function commentOnPost(postId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            getRef('posts/' + postId + '/comments').once('value').then(function(snapshot) {
                let comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                return getRef('posts/' + postId + '/comments').set(comments);
            }).then(function() {
                renderSocial();
                toast('Comment added! 💬');
                saveState();
            });
        }
    });
}

function deletePost(postId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            removeData('posts/' + postId).then(function() {
                S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== postId; });
                renderSocial();
                renderProfile();
                toast('Post deleted');
                saveState();
            }).catch(function(error) {
                console.error('Delete error:', error);
                toast('Failed to delete');
            });
        }
    });
}

function viewPostDetail(postId) {
    const post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) { toast('Post not found'); return; }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    const liked = (post.likes || []).includes(S.username);
    const bookmarked = (S.bookmarks || []).some(function(b) { return b.id === postId; });
    
    let avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    } else {
        const color = getColor(post.author);
        avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
    }
    
    let html = '<div class="ig-post-header">';
    html += '<div class="profile-bubble" onclick="closePostDetail();viewUserProfile(\'' + post.author + '\')">';
    html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
    html += '<span class="pb-name">' + post.author + '</span>';
    html += '</div>';
    html += '<span class="ig-post-time">' + timeSince(new Date(post.time)) + '</span>';
    if (post.author === S.username) {
        html += '<button class="btn-sm btn-danger" onclick="deletePost(\'' + post.id + '\');closePostDetail();">🗑️</button>';
    }
    html += '</div>';
    
    if (post.image) html += '<img src="' + post.image + '" class="post-detail-image" />';
    
    if (post.text) html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    
    html += '<div class="ig-post-actions" style="padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="margin-right:12px;font-weight:600;">' + (post.likes || []).length + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);">💬</button>';
    html += '<span style="margin-right:12px;font-weight:600;">' + (post.comments || []).length + '</span>';
    html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\');closePostDetail();">🔖</button>';
    if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\',\'post.jpg\')">⬇️</button>';
    html += '</div>';
    
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;"><strong>Comments</strong></div>';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(function(c) {
            html += '<div class="post-detail-comment"><strong>' + c.username + '</strong><span class="time">' + new Date(c.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) + '</span><br>' + c.text + '</div>';
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

function downloadMedia(url, filename) {
    if (!url) return;
    if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'media.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        window.open(url, '_blank');
    }
}

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    const idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) {
        S.bookmarks.splice(idx, 1);
        toast('Removed');
    } else {
        S.bookmarks.push({ id: id, type: type, time: new Date().toISOString() });
        toast('Saved! 🔖');
    }
    setData('users/' + S.username + '/bookmarks', S.bookmarks);
    saveState();
    renderSocial();
}

// Status functions
function addStatus() {
    if (!S.username) return;
    showDialog({
        emoji: '📸', title: 'Add Status', placeholder: 'What\'s on your mind?', confirmText: 'Post'
    }).then(function(text) {
        if (text !== null) {
            saveStatus(text.trim(), null);
        }
    });
}

function saveStatus(text, imageData) {
    const status = {
        author: S.username, avatar: S.avatar || null, text: text || '',
        image: imageData || null, time: new Date().toISOString(),
        expires: new Date(Date.now() + 86400000).toISOString(), views: []
    };
    pushData('statuses', status);
    toast('Status added! 📸');
    renderStories();
}

function renderStories() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    getRef('statuses').orderByChild('time').limitToLast(30).once('value').then(function(snapshot) {
        const statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(function(key) {
                const s = snapshot.val()[key];
                if (new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        const authors = [...new Set(statuses.map(function(s) { return s.author; }))];
        if (!authors.includes(S.username)) authors.unshift(S.username);
        row.innerHTML = authors.map(function(a) {
            const isMe = a === S.username;
            return '<div class="ig-story" onclick="' + (isMe ? 'addStatus()' : 'viewStatus(\'' + a + '\')') + '"><div class="ig-story-avatar"><div class="inner" style="background:' + getColor(a) + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + a.charAt(0).toUpperCase() + '</div></div><span class="ig-story-name">' + (isMe ? 'My Status' : a) + '</span></div>';
        }).join('');
    });
}

function viewStatus(username) {
    getRef('statuses').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
        const statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(function(key) {
                const s = snapshot.val()[key];
                if (s.author === username && new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        if (statuses.length === 0) { toast('No active status'); return; }
        const s = statuses[statuses.length - 1];
        let html = '<div style="text-align:center;"><strong>' + s.author + '</strong><br><small>' + timeSince(new Date(s.time)) + '</small></div>';
        if (s.image) html += '<img src="' + s.image + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin:8px 0;" />';
        if (s.text) html += '<p style="font-size:15px;text-align:center;">' + escapeHtml(s.text) + '</p>';
        document.getElementById('postDetailBody').innerHTML = '<button class="post-detail-back" onclick="closePostDetail()">← Close</button>' + html;
        document.getElementById('postDetailOverlay').classList.add('active');
    });
}

window.addStatus = addStatus;
window.clearFileSelection = clearFileSelection;

console.log('📱 Social module loaded - all posts visible');