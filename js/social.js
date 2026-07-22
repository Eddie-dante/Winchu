// Social Feed Module - Fixed likes/comments, maximize post, status delete

var postsListener = null;
var selectedFile = null;
var selectedFileData = null;
var processedPostIds = {};

function setupPostsListener() {
    if (postsListener) { postsListener.off(); postsListener = null; }
    S.socialPosts = [];
    processedPostIds = {};
    
    var ref = db.ref('posts');
    ref.orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        processedPostIds = {};
        if (data) {
            Object.keys(data).forEach(function(key) {
                var post = data[key];
                if (post && post.author && !processedPostIds[key]) {
                    post.id = key;
                    processedPostIds[key] = true;
                    S.socialPosts.push(post);
                }
            });
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    });
    
    ref.on('child_added', function(snapshot) {
        var post = snapshot.val(); var key = snapshot.key;
        if (!post || !post.author || processedPostIds[key]) return;
        post.id = key; processedPostIds[key] = true;
        if (!S.socialPosts.find(function(p) { return p.id === key; })) {
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 200) S.socialPosts.pop();
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            renderSocial(); renderProfile(); renderStories(); saveState();
        }
    });
    
    ref.on('child_changed', function(snapshot) {
        var post = snapshot.val(); if (!post) return; post.id = snapshot.key;
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) { S.socialPosts[idx] = post; renderSocial(); }
    });
    
    ref.on('child_removed', function(snapshot) {
        delete processedPostIds[snapshot.key];
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial(); renderProfile();
    });
}

function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    if (!S.username) { feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>'; return; }
    
    var posts = S.socialPosts || [];
    if (posts.length === 0) { feed.innerHTML = '<div style="text-align:center;padding:50px;"><div style="font-size:48px;">📸</div><p>No posts yet.</p></div>'; return; }
    
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
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + post.author + '\')"><div class="pb-avatar">' + avatarDisplay + '</div><span class="pb-name">' + escapeHtml(post.author) + '</span></div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (canDelete) html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        html += '</div>';
        
        if (post.image) html += '<img src="' + post.image + '" style="width:100%;max-height:400px;object-fit:cover;" />';
        if (post.text) html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:14px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;">🔖</button>';
        if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:20px;">⬇️</button>';
        html += '</div>';
        
        if (commentCount > 0) html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View ' + commentCount + ' comments</div>';
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    if (!text && !selectedFileData) { toast('Write something or attach media'); return; }
    
    toast('Posting...');
    var postData = { author: S.username, avatar: S.avatar || null, text: text || '', image: selectedFileData || null, time: new Date().toISOString(), likes: [], comments: [] };
    var newRef = db.ref('posts').push();
    newRef.set(postData).then(function() {
        postData.id = newRef.key; processedPostIds[newRef.key] = true;
        S.socialPosts.unshift(postData);
        if (input) input.value = '';
        selectedFile = null; selectedFileData = null;
        var preview = document.getElementById('filePreview'); if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
        var fileInput = document.getElementById('postFile'); if (fileInput) fileInput.value = '';
        renderSocial(); renderProfile(); renderStories(); saveState();
        toast('📝 Posted!');
    }).catch(function(err) { console.error(err); toast('Failed to post'); });
}

// FIXED: Like post - proper toggle with persistent count
function likePost(postId) {
    if (!S.username) return;
    var likeRef = db.ref('posts/' + postId + '/likes');
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) { likes.splice(idx, 1); } else { likes.push(S.username); }
        return likeRef.set(likes);
    }).then(function() {
        var post = S.socialPosts.find(function(p) { return p.id === postId; });
        if (post) {
            var likes = post.likes || [];
            var idx = likes.indexOf(S.username);
            if (idx > -1) { likes.splice(idx, 1); } else { likes.push(S.username); }
            post.likes = likes;
        }
        renderSocial();
    }).catch(function(err) { console.error('Like error:', err); });
}

function commentOnPost(postId) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(result) {
        if (result && result.trim()) {
            var commentRef = db.ref('posts/' + postId + '/comments');
            commentRef.once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                return commentRef.set(comments);
            }).then(function() {
                var post = S.socialPosts.find(function(p) { return p.id === postId; });
                if (post) { if (!post.comments) post.comments = []; post.comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() }); }
                renderSocial();
                toast('Comment added!');
            });
        }
    });
}

function deletePost(postId) {
    showDialog({ emoji: '🗑️', title: 'Delete', subtitle: 'Delete post?', confirmText: 'Delete', danger: true }).then(function(r) {
        if (r !== null) {
            db.ref('posts/' + postId).remove().then(function() {
                delete processedPostIds[postId];
                S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== postId; });
                renderSocial(); renderProfile(); toast('Deleted');
            });
        }
    });
}

// FIXED: Maximize post detail view
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
    
    if (post.image) html += '<img src="' + post.image + '" style="width:100%;max-height:60vh;object-fit:contain;border-radius:12px;margin:8px 0;background:#000;" />';
    if (post.text) html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    
    html += '<div style="display:flex;align-items:center;gap:14px;padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);" style="font-size:22px;">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="font-weight:600;">' + likeCount + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);" style="font-size:22px;">💬</button>';
    html += '<span style="font-weight:600;">' + commentCount + '</span>';
    html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\');closePostDetail();" style="font-size:22px;">🔖</button>';
    if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:22px;">⬇️</button>';
    html += '</div>';
    
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments (' + commentCount + ')</strong></div>';
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

function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    var maxSize = file.type.startsWith('video/') ? 50*1024*1024 : 10*1024*1024;
    if (file.size > maxSize) { toast('File too large'); event.target.value = ''; return; }
    selectedFile = file;
    var reader = new FileReader();
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        var preview = document.getElementById('filePreview');
        if (preview) { preview.innerHTML = '<div style="position:relative;display:inline-block;"><img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;" /><button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;">✕</button></div>'; preview.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
}

function clearFileSelection() {
    selectedFile = null; selectedFileData = null;
    var preview = document.getElementById('filePreview'); if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    var fileInput = document.getElementById('postFile'); if (fileInput) fileInput.value = '';
}

function downloadMedia(url) { if (!url) return; if (url.startsWith('data:')) { var a = document.createElement('a'); a.href = url; a.download = 'media.jpg'; a.click(); } else { window.open(url, '_blank'); } }

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) { S.bookmarks.splice(idx, 1); toast('Removed'); } else { S.bookmarks.push({id:id, type:type, time:new Date().toISOString()}); toast('Saved!'); }
    db.ref('users/' + S.username + '/bookmarks').set(S.bookmarks);
    saveState(); renderSocial(); renderProfile();
}

// Status functions
function renderStories() {
    var row = document.getElementById('storyRow');
    if (!row) return;
    db.ref('statuses').orderByChild('time').limitToLast(30).once('value').then(function(snapshot) {
        var statuses = [];
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach(function(key) {
                var s = snapshot.val()[key]; s.id = key;
                if (new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        var authors = statuses.map(function(s) { return s.author; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
        if (authors.indexOf(S.username) === -1) authors.unshift(S.username);
        
        row.innerHTML = authors.map(function(author) {
            var isMe = author === S.username;
            var s = statuses.find(function(x) { return x.author === author; });
            var avatarHTML = '';
            if (s && s.avatar && s.avatar.startsWith('data:')) { avatarHTML = '<img src="' + s.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'; }
            else if (isMe && S.avatar) { avatarHTML = '<img src="' + S.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'; }
            else { var color = getColor(author); avatarHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;">' + author.charAt(0).toUpperCase() + '</div>'; }
            return '<div class="ig-story" onclick="' + (isMe ? 'addStatus()' : 'viewStatus(\'' + author + '\')') + '"><div class="ig-story-avatar"><div class="inner">' + avatarHTML + '</div></div><span class="ig-story-name">' + (isMe ? 'My Status' : author) + '</span>' + (isMe ? '<span style="font-size:8px;color:#6366f1;">+ Add</span>' : '') + '</div>';
        }).join('');
    });
}

function addStatus() {
    if (!S.username) return;
    showDialog({ emoji: '📸', title: 'Add Status', placeholder: 'What\'s on your mind?', confirmText: 'Post' }).then(function(text) {
        if (text !== null && text.trim()) {
            db.ref('statuses').push({ author: S.username, avatar: S.avatar || null, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString(), views: [] });
            toast('Status added! 📸');
            renderStories();
        }
    });
}

function viewStatus(username) {
    db.ref('statuses').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
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
        var html = '<div style="text-align:center;padding:10px;"><strong>' + escapeHtml(s.author) + '</strong><br><small>' + timeSince(new Date(s.time)) + '</small></div>';
        if (s.text) html += '<p style="font-size:15px;text-align:center;padding:10px;">' + escapeHtml(s.text) + '</p>';
        if (isMine) html += '<div style="text-align:center;margin-top:10px;"><button class="btn-sm btn-danger" onclick="deleteStatus(\'' + s.id + '\')">🗑️ Delete Status</button></div>';
        
        var overlay = document.getElementById('postDetailOverlay');
        var body = document.getElementById('postDetailBody');
        body.innerHTML = '<button class="post-detail-back" onclick="closePostDetail()">← Close</button>' + html;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// DELETE STATUS
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

console.log('📱 Social module loaded - fixed counts, maximize, status delete');