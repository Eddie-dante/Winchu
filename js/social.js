// Social Feed Module - Complete with fixed likes, duplicates, and empty posts

var postsListener = null;
var selectedFile = null;
var selectedFileData = null;
var processedPostIds = {};

// ============================================================
// SETUP POSTS LISTENER
// ============================================================
function setupPostsListener() {
    console.log('=== SETTING UP POSTS LISTENER ===');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    S.socialPosts = [];
    processedPostIds = {};
    
    var postsRef = db.ref('posts');
    
    // Load ALL posts once
    postsRef.orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        processedPostIds = {};
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                var post = data[key];
                if (post && post.author && !processedPostIds[key]) {
                    post.id = key;
                    processedPostIds[key] = true;
                    S.socialPosts.push(post);
                }
            });
            
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.socialPosts.length + ' unique posts');
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
        var key = snapshot.key;
        
        if (!post || !post.author) return;
        if (processedPostIds[key]) return;
        
        post.id = key;
        processedPostIds[key] = true;
        
        var existing = S.socialPosts.find(function(p) { return p.id === key; });
        if (!existing) {
            console.log('New post:', key);
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 200) S.socialPosts.pop();
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    postsRef.on('child_changed', function(snapshot) {
        var post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    postsRef.on('child_removed', function(snapshot) {
        delete processedPostIds[snapshot.key];
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active');
}

// ============================================================
// RENDER SOCIAL FEED
// ============================================================
function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in to see posts.</p>';
        return;
    }
    
    var posts = S.socialPosts || [];
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first!</p></div>';
        return;
    }
    
    var html = '';
    
    posts.forEach(function(post) {
        if (!post || !post.author) return;
        
        var liked = (post.likes || []).indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === post.id; });
        var likeCount = (post.likes || []).length;
        var commentCount = (post.comments || []).length;
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
        if (canDelete) html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        html += '</div>';
        
        if (post.image) html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" />';
        if (post.text) html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="margin:0 12px 0 4px;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')">💬</button>';
        html += '<span style="margin:0 12px 0 4px;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\')">🔖</button>';
        if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')">⬇️</button>';
        html += '</div>';
        
        if (commentCount > 0) html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View ' + commentCount + ' comments</div>';
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// ============================================================
// CREATE POST - Allows empty text if media attached
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
        postData.id = newRef.key;
        processedPostIds[newRef.key] = true;
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
    }).catch(function(err) {
        console.error(err);
        toast('Failed to post');
    });
}

// ============================================================
// LIKE POST - Fixed toggle
// ============================================================
function likePost(postId) {
    if (!S.username) return;
    
    var postRef = db.ref('posts/' + postId + '/likes');
    
    postRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
        } else {
            likes.push(S.username);
        }
        
        return postRef.set(likes);
    }).then(function() {
        var post = S.socialPosts.find(function(p) { return p.id === postId; });
        if (post) {
            var likes = post.likes || [];
            var idx = likes.indexOf(S.username);
            if (idx > -1) { likes.splice(idx, 1); }
            else { likes.push(S.username); }
            post.likes = likes;
        }
        renderSocial();
        saveState();
    }).catch(function(err) {
        console.error('Like error:', err);
    });
}

// ============================================================
// COMMENT ON POST
// ============================================================
function commentOnPost(postId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬', title: 'Add Comment', placeholder: 'Write...', confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            db.ref('posts/' + postId + '/comments').once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                return db.ref('posts/' + postId + '/comments').set(comments);
            }).then(function() {
                var post = S.socialPosts.find(function(p) { return p.id === postId; });
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                }
                renderSocial();
                toast('Comment added!');
                saveState();
            });
        }
    });
}

// ============================================================
// DELETE POST
// ============================================================
function deletePost(postId) {
    showDialog({
        emoji: '🗑️', title: 'Delete', subtitle: 'Delete this post?', confirmText: 'Delete', danger: true
    }).then(function(result) {
        if (result !== null) {
            db.ref('posts/' + postId).remove().then(function() {
                delete processedPostIds[postId];
                S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== postId; });
                renderSocial();
                renderProfile();
                toast('Deleted');
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
    
    var liked = (post.likes || []).indexOf(S.username) > -1;
    var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === postId; });
    var likeCount = (post.likes || []).length;
    var commentCount = (post.comments || []).length;
    
    var avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = '<img src="' + post.avatar + '" style="width:36px;height:36px;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = getColor(post.author);
        avatarDisplay = '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + post.author.charAt(0).toUpperCase() + '</div>';
    }
    
    var html = '<button class="post-detail-back" onclick="closePostDetail()">← <span>Back</span></button>';
    
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;">';
    html += '<div class="profile-bubble" onclick="closePostDetail();viewUserProfile(\'' + post.author + '\')"><div class="pb-avatar">' + avatarDisplay + '</div><span class="pb-name">' + escapeHtml(post.author) + '</span></div>';
    html += '<span style="font-size:11px;color:#94a3b8;margin-left:auto;">' + timeSince(new Date(post.time)) + '</span>';
    if (post.author === S.username) html += '<button class="btn-sm btn-danger" onclick="deletePost(\'' + post.id + '\');closePostDetail();">🗑️</button>';
    html += '</div>';
    
    if (post.image) html += '<img src="' + post.image + '" style="width:100%;max-height:500px;object-fit:contain;border-radius:12px;margin:8px 0;background:#000;" />';
    if (post.text) html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    
    html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="font-weight:600;">' + likeCount + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);">💬</button>';
    html += '<span style="font-weight:600;">' + commentCount + '</span>';
    html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\');closePostDetail();">🔖</button>';
    if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')">⬇️</button>';
    html += '</div>';
    
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments</strong></div>';
    if (post.comments && post.comments.length > 0) {
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
// HANDLE FILE SELECT
// ============================================================
function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) { toast('File too large'); event.target.value = ''; return; }
    
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
    if (url.startsWith('data:')) { var a = document.createElement('a'); a.href = url; a.download = 'media.jpg'; a.click(); }
    else { window.open(url, '_blank'); }
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

function renderStories() {
    var row = document.getElementById('storyRow');
    if (!row) return;
    row.innerHTML = '<div class="ig-story" onclick="addStatus()"><div class="ig-story-avatar"><div class="inner" style="display:flex;align-items:center;justify-content:center;font-size:24px;">📸</div></div><span class="ig-story-name">My Status</span></div>';
}

function addStatus() {
    if (!S.username) return;
    showDialog({ emoji: '📸', title: 'Status', placeholder: 'What\'s on your mind?', confirmText: 'Post' }).then(function(text) {
        if (text !== null && text.trim()) {
            db.ref('statuses').push({ author: S.username, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString() });
            toast('Status added!');
        }
    });
}

window.addStatus = addStatus;
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

console.log('📱 Social module loaded - all fixed');