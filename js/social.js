// Social Feed Module - ALL FIXES APPLIED

var postsListener = null;
var selectedFile = null;
var selectedFileData = null;

// ============================================================
// SETUP POSTS LISTENER
// ============================================================
function setupPostsListener() {
    console.log('Setting up posts listener...');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    // Clear existing posts
    S.socialPosts = [];
    
    // Load ALL posts from Firebase
    var postsRef = db.ref('posts');
    
    postsRef.orderByChild('time').limitToLast(200).once('value', function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                var post = data[key];
                if (post && post.author) {
                    post.id = key;
                    // Ensure likes and comments are arrays
                    if (!post.likes) post.likes = [];
                    if (!post.comments) post.comments = [];
                    S.socialPosts.push(post);
                }
            });
            
            // Sort newest first
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.socialPosts.length + ' posts');
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Listen for new posts
    postsRef.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        post.id = snapshot.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        // Check if already exists
        var exists = S.socialPosts.find(function(p) { return p.id === post.id; });
        if (!exists) {
            console.log('New post added:', post.id);
            S.socialPosts.unshift(post);
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    // Listen for post updates (likes/comments)
    postsRef.on('child_changed', function(snapshot) {
        var post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    // Listen for deleted posts
    postsRef.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active');
}

// ============================================================
// RENDER SOCIAL FEED - With working like/comment counts
// ============================================================
function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    var posts = S.socialPosts || [];
    console.log('Rendering ' + posts.length + ' posts');
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first to share!</p></div>';
        return;
    }
    
    var html = '';
    
    posts.forEach(function(post) {
        if (!post || !post.author) return;
        
        // ENSURE likes and comments are arrays
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        var liked = post.likes.indexOf(S.username) > -1;
        var likeCount = post.likes.length;
        var commentCount = post.comments.length;
        var timeAgo = timeSince(new Date(post.time));
        var canDelete = post.author === S.username;
        
        var avatarDisplay = '';
        if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(post.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        }
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + post.id + '\')">';
        html += '<div class="ig-post-header">';
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + post.author + '\')">';
        html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
        html += '<span class="pb-name">' + escapeHtml(post.author) + '</span>';
        html += '</div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (canDelete) {
            html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        }
        html += '</div>';
        
        if (post.image) {
            html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" />';
        }
        
        if (post.text) {
            html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        }
        
        // ACTIONS WITH CORRECT COUNTS
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:14px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;">🔖</button>';
        if (post.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:20px;">⬇️</button>';
        }
        html += '</div>';
        
        if (commentCount > 0) {
            html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View all ' + commentCount + ' comments</div>';
        }
        
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// ============================================================
// LIKE POST - Fixed to persist
// ============================================================
function likePost(postId) {
    if (!S.username) { toast('Please log in'); return; }
    
    console.log('Like toggle for post:', postId);
    
    var likeRef = db.ref('posts/' + postId + '/likes');
    
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        console.log('Current likes:', likes);
        
        var idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
            console.log('Unliked');
        } else {
            likes.push(S.username);
            console.log('Liked');
        }
        
        return likeRef.set(likes);
    }).then(function() {
        // Update local state
        var post = S.socialPosts.find(function(p) { return p.id === postId; });
        if (post) {
            if (!post.likes) post.likes = [];
            var idx = post.likes.indexOf(S.username);
            if (idx > -1) {
                post.likes.splice(idx, 1);
            } else {
                post.likes.push(S.username);
            }
        }
        renderSocial();
        saveState();
    }).catch(function(error) {
        console.error('Like error:', error);
        toast('Error updating like');
    });
}

// ============================================================
// COMMENT ON POST - Fixed to persist
// ============================================================
function commentOnPost(postId) {
    if (!S.username) { toast('Please log in'); return; }
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            var commentRef = db.ref('posts/' + postId + '/comments');
            
            commentRef.once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                return commentRef.set(comments);
            }).then(function() {
                var post = S.socialPosts.find(function(p) { return p.id === postId; });
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push({
                        username: S.username,
                        text: result.trim(),
                        time: new Date().toISOString()
                    });
                }
                renderSocial();
                toast('Comment added! 💬');
                saveState();
            }).catch(function(error) {
                console.error('Comment error:', error);
                toast('Error adding comment');
            });
        }
    });
}

// ============================================================
// CREATE POST
// ============================================================
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) {
        toast('Write something or attach media');
        return;
    }
    
    toast('Posting...');
    
    var postData = {
        author: S.username,
        avatar: S.avatar || null,
        text: text || '',
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    var newRef = db.ref('posts').push();
    newRef.set(postData).then(function() {
        console.log('Post created:', newRef.key);
        postData.id = newRef.key;
        S.socialPosts.unshift(postData);
        
        if (input) input.value = '';
        selectedFile = null;
        selectedFileData = null;
        
        var preview = document.getElementById('filePreview');
        if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
        var fileInput = document.getElementById('postFile');
        if (fileInput) fileInput.value = '';
        
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
        toast('📝 Posted!');
    }).catch(function(error) {
        console.error('Post error:', error);
        toast('Failed to post');
    });
}

// ============================================================
// DELETE POST
// ============================================================
function deletePost(postId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            db.ref('posts/' + postId).remove().then(function() {
                S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== postId; });
                renderSocial();
                renderProfile();
                toast('Post deleted');
                saveState();
            });
        }
    });
}

// ============================================================
// VIEW POST DETAIL - Maximized with back button
// ============================================================
function viewPostDetail(postId) {
    var post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) { toast('Post not found'); return; }
    
    var overlay = document.getElementById('postDetailOverlay');
    var body = document.getElementById('postDetailBody');
    if (!overlay || !body) return;
    
    if (!post.likes) post.likes = [];
    if (!post.comments) post.comments = [];
    
    var liked = post.likes.indexOf(S.username) > -1;
    var likeCount = post.likes.length;
    var commentCount = post.comments.length;
    
    var html = '';
    
    // BACK BUTTON
    html += '<button class="post-detail-back" onclick="closePostDetail()" style="font-size:20px;font-weight:600;cursor:pointer;background:none;border:none;padding:10px 0;display:flex;align-items:center;gap:8px;">← <span>Back</span></button>';
    
    // Author
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;">';
    html += '<strong>' + escapeHtml(post.author) + '</strong>';
    html += '<span style="font-size:11px;color:#94a3b8;margin-left:auto;">' + timeSince(new Date(post.time)) + '</span>';
    if (post.author === S.username) {
        html += '<button class="btn-sm btn-danger" onclick="deletePost(\'' + post.id + '\');closePostDetail();">🗑️</button>';
    }
    html += '</div>';
    
    // Image - full width
    if (post.image) {
        html += '<img src="' + post.image + '" style="width:100%;max-height:60vh;object-fit:contain;border-radius:12px;margin:8px 0;background:#000;" />';
    }
    
    // Text
    if (post.text) {
        html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    }
    
    // Actions
    html += '<div style="display:flex;align-items:center;gap:14px;padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);" style="font-size:22px;">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="font-weight:600;">' + likeCount + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);" style="font-size:22px;">💬</button>';
    html += '<span style="font-weight:600;">' + commentCount + '</span>';
    html += '</div>';
    
    // Comments
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments (' + commentCount + ')</strong></div>';
    if (post.comments.length > 0) {
        post.comments.forEach(function(c) {
            html += '<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><strong>' + escapeHtml(c.username) + '</strong> <span style="font-size:10px;color:#94a3b8;">' + timeSince(new Date(c.time)) + '</span><br>' + escapeHtml(c.text) + '</div>';
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:16px;">No comments yet</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostDetail() {
    var overlay = document.getElementById('postDetailOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
// FILE HANDLING
// ============================================================
function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) { toast('File too large (max ' + (maxSize/(1024*1024)) + 'MB)'); event.target.value = ''; return; }
    
    selectedFile = file;
    var reader = new FileReader();
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        var preview = document.getElementById('filePreview');
        if (preview) {
            preview.innerHTML = '<div style="position:relative;display:inline-block;"><img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;" /><button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;">✕</button></div>';
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function clearFileSelection() {
    selectedFile = null;
    selectedFileData = null;
    var preview = document.getElementById('filePreview');
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    var fileInput = document.getElementById('postFile');
    if (fileInput) fileInput.value = '';
}

function downloadMedia(url) {
    if (!url) return;
    if (url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = url;
        a.download = 'media.jpg';
        a.click();
    }
}

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) { S.bookmarks.splice(idx, 1); toast('Removed'); }
    else { S.bookmarks.push({id:id, type:type, time:new Date().toISOString()}); toast('Saved!'); }
    db.ref('users/' + S.username + '/bookmarks').set(S.bookmarks);
    saveState();
    renderSocial();
}

// ============================================================
// STATUS/STORIES
// ============================================================
function renderStories() {
    var row = document.getElementById('storyRow');
    if (!row) return;
    row.innerHTML = '<div class="ig-story" onclick="addStatus()"><div class="ig-story-avatar"><div class="inner" style="display:flex;align-items:center;justify-content:center;font-size:24px;">📸</div></div><span class="ig-story-name">My Status</span><span style="font-size:8px;color:#6366f1;">+ Add</span></div>';
}

function addStatus() {
    if (!S.username) return;
    showDialog({ emoji: '📸', title: 'Add Status', placeholder: 'What\'s on your mind?', confirmText: 'Post' }).then(function(text) {
        if (text !== null && text.trim()) {
            var statusRef = db.ref('statuses').push();
            statusRef.set({
                author: S.username,
                avatar: S.avatar || null,
                text: text.trim(),
                time: new Date().toISOString(),
                expires: new Date(Date.now() + 86400000).toISOString(),
                views: []
            }).then(function() {
                toast('Status added! 📸');
                renderStories();
            });
        }
    });
}

function viewStatus(username) {
    db.ref('statuses').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
        var statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(function(key) {
                var s = snapshot.val()[key];
                s.id = key;
                if (s.author === username && new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        if (statuses.length === 0) { toast('No active status'); return; }
        var s = statuses[statuses.length - 1];
        var isMine = s.author === S.username;
        
        var html = '<button class="post-detail-back" onclick="closePostDetail()">← Close</button>';
        html += '<div style="text-align:center;padding:10px;"><strong>' + escapeHtml(s.author) + '</strong><br><small>' + timeSince(new Date(s.time)) + '</small></div>';
        if (s.text) html += '<p style="font-size:15px;text-align:center;padding:10px;">' + escapeHtml(s.text) + '</p>';
        if (isMine) html += '<div style="text-align:center;margin-top:10px;"><button class="btn-sm btn-danger" onclick="deleteStatus(\'' + s.id + '\')">🗑️ Delete Status</button></div>';
        
        document.getElementById('postDetailBody').innerHTML = html;
        document.getElementById('postDetailOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

function deleteStatus(statusId) {
    showDialog({ emoji: '🗑️', title: 'Delete Status', subtitle: 'Remove this status?', confirmText: 'Delete', danger: true }).then(function(r) {
        if (r !== null) {
            db.ref('statuses/' + statusId).remove().then(function() {
                closePostDetail();
                renderStories();
                toast('Status deleted');
            });
        }
    });
}

// Expose
window.addStatus = addStatus;
window.viewStatus = viewStatus;
window.deleteStatus = deleteStatus;
window.clearFileSelection = clearFileSelection;
window.createPost = createPost;
window.handleFileSelect = handleFileSelect;
window.likePost = likePost;
window.commentOnPost = commentOnPost;
window.deletePost = deletePost;
window.viewPostDetail = viewPostDetail;
window.closePostDetail = closePostDetail;
window.downloadMedia = downloadMedia;
window.bookmarkItem = bookmarkItem;

console.log('📱 Social module loaded - ALL FIXED');