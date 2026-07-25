// Social Feed Module - Complete with posts, likes, comments, bookmarks, stories

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
    
    var postsRef = getRef('posts');
    
    // Load ALL existing posts once
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
                    if (!post.likes) post.likes = [];
                    if (!post.comments) post.comments = [];
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
    
    // Listen for new posts in real-time
    postsRef.on('child_added', function(snapshot) {
        var post = snapshot.val();
        var key = snapshot.key;
        
        if (!post || !post.author) return;
        if (processedPostIds[key]) return;
        
        post.id = key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        processedPostIds[key] = true;
        
        var existing = S.socialPosts.find(function(p) { return p.id === key; });
        if (!existing) {
            console.log('New post detected:', key, 'by', post.author);
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
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) { S.socialPosts[idx] = post; renderSocial(); }
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
    console.log('Rendering ' + posts.length + ' posts');
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first to share!</p></div>';
        return;
    }
    
    var html = '';
    
    posts.forEach(function(post) {
        if (!post || !post.author) return;
        
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        var liked = post.likes.indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === post.id; });
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
        if (canDelete) html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        html += '</div>';
        
        if (post.image) html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" />';
        if (post.text) html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:14px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\')">🔖</button>';
        if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')">⬇️</button>';
        html += '</div>';
        
        if (commentCount > 0) html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View all ' + commentCount + ' comments</div>';
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// ============================================================
// CREATE POST
// ============================================================
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) { toast('Write something or attach media'); return; }
    
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
    
    var newRef = getRef('posts').push();
    newRef.set(postData).then(function() {
        console.log('Post created:', newRef.key);
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
    }).catch(function(error) {
        console.error('Post error:', error);
        toast('Failed to post');
    });
}

// ============================================================
// LIKE POST - Fixed to persist
// ============================================================
function likePost(postId) {
    if (!S.username) return;
    
    var likeRef = getRef('posts/' + postId + '/likes');
    
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) { likes.splice(idx, 1); } else { likes.push(S.username); }
        return likeRef.set(likes);
    }).then(function() {
        var post = S.socialPosts.find(function(p) { return p.id === postId; });
        if (post) {
            if (!post.likes) post.likes = [];
            var idx = post.likes.indexOf(S.username);
            if (idx > -1) { post.likes.splice(idx, 1); } else { post.likes.push(S.username); }
        }
        renderSocial();
        saveState();
    }).catch(function(error) {
        console.error('Like error:', error);
    });
}

// ============================================================
// COMMENT ON POST
// ============================================================
function commentOnPost(postId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬', title: 'Add Comment', placeholder: 'Write your comment...', confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            var commentRef = getRef('posts/' + postId + '/comments');
            commentRef.once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                return commentRef.set(comments);
            }).then(function() {
                var post = S.socialPosts.find(function(p) { return p.id === postId; });
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                }
                renderSocial();
                toast('Comment added! 💬');
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
        emoji: '🗑️', title: 'Delete Post', subtitle: 'Are you sure?', confirmText: 'Delete', danger: true
    }).then(function(result) {
        if (result !== null) {
            getRef('posts/' + postId).remove().then(function() {
                delete processedPostIds[postId];
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
// HANDLE FILE SELECT
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
    if (url.startsWith('data:')) { var a = document.createElement('a'); a.href = url; a.download = 'media.jpg'; a.click(); }
}

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) { S.bookmarks.splice(idx, 1); toast('Removed'); }
    else { S.bookmarks.push({ id: id, type: type, time: new Date().toISOString() }); toast('Saved! 🔖'); }
    setData('users/' + S.username + '/bookmarks', S.bookmarks);
    saveState();
    renderSocial();
    renderProfile();
}

// ============================================================
// STORIES / STATUS
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
            pushData('statuses', { author: S.username, avatar: S.avatar || null, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now() + 86400000).toISOString(), views: [] });
            toast('Status added! 📸');
            renderStories();
        }
    });
}

function viewStatus(username) {
    getRef('statuses').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
        var statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(function(key) {
                var s = snapshot.val()[key]; s.id = key;
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
        if (r !== null) { getRef('statuses/' + statusId).remove(); closePostDetail(); renderStories(); toast('Status deleted'); }
    });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.addStatus = addStatus;
window.viewStatus = viewStatus;
window.deleteStatus = deleteStatus;
window.clearFileSelection = clearFileSelection;
window.createPost = createPost;
window.handleFileSelect = handleFileSelect;
window.likePost = likePost;
window.commentOnPost = commentOnPost;
window.deletePost = deletePost;
window.downloadMedia = downloadMedia;
window.bookmarkItem = bookmarkItem;

console.log('📱 Social module loaded - all fixed');