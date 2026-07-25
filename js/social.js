// Social Feed Module - Fixed likes and comments

var postsListener = null;
var selectedFile = null;
var selectedFileData = null;
var processedPostIds = {};

function setupPostsListener() {
    if (postsListener) { postsListener.off(); postsListener = null; }
    S.socialPosts = []; processedPostIds = {};
    
    var ref = firebase.database().ref('posts');
    
    ref.orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = []; processedPostIds = {};
        if (data) {
            Object.keys(data).forEach(function(key) {
                var post = data[key];
                if (post && post.author && !processedPostIds[key]) {
                    post.id = key;
                    // ENSURE likes and comments are ALWAYS arrays
                    if (!Array.isArray(post.likes)) post.likes = [];
                    if (!Array.isArray(post.comments)) post.comments = [];
                    processedPostIds[key] = true;
                    S.socialPosts.push(post);
                }
            });
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        renderSocial(); renderProfile(); renderStories(); saveState();
    });
    
    ref.on('child_added', function(snapshot) {
        var post = snapshot.val(); var key = snapshot.key;
        if (!post || !post.author || processedPostIds[key]) return;
        post.id = key;
        if (!Array.isArray(post.likes)) post.likes = [];
        if (!Array.isArray(post.comments)) post.comments = [];
        processedPostIds[key] = true;
        if (!S.socialPosts.find(function(p) { return p.id === key; })) {
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 200) S.socialPosts.pop();
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            renderSocial(); renderProfile(); renderStories(); saveState();
        }
    });
    
    ref.on('child_changed', function(snapshot) {
        var post = snapshot.val(); if (!post) return; post.id = snapshot.key;
        if (!Array.isArray(post.likes)) post.likes = [];
        if (!Array.isArray(post.comments)) post.comments = [];
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) { S.socialPosts[idx] = post; renderSocial(); }
    });
    
    ref.on('child_removed', function(snapshot) {
        delete processedPostIds[snapshot.key];
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial(); renderProfile();
    });
    
    console.log('📱 Posts listener active');
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
        if (!Array.isArray(post.likes)) post.likes = [];
        if (!Array.isArray(post.comments)) post.comments = [];
        
        var liked = post.likes.indexOf(S.username) > -1;
        var likeCount = post.likes.length;
        var commentCount = post.comments.length;
        var timeAgo = timeSince(new Date(post.time));
        var canDelete = post.author === S.username;
        
        var avatarDisplay = post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http')) 
            ? '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' 
            : '<div style="width:100%;height:100%;border-radius:50%;background:' + getColor(post.author) + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + post.id + '\')">';
        html += '<div class="ig-post-header">';
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + post.author + '\')"><div class="pb-avatar">' + avatarDisplay + '</div><span class="pb-name">' + escapeHtml(post.author) + '</span></div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (canDelete) html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        html += '</div>';
        if (post.image) html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" />';
        if (post.text) html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:14px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;">🔖</button>';
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
    
    var postData = {
        author: S.username, avatar: S.avatar || null,
        text: text || '', image: selectedFileData || null,
        time: new Date().toISOString(), likes: [], comments: []
    };
    
    var newRef = firebase.database().ref('posts').push();
    newRef.set(postData).then(function() {
        if (input) input.value = '';
        selectedFile = null; selectedFileData = null;
        var preview = document.getElementById('filePreview'); if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
        var fileInput = document.getElementById('postFile'); if (fileInput) fileInput.value = '';
        renderSocial(); renderProfile(); renderStories(); saveState();
        toast('📝 Posted!');
    }).catch(function() { toast('Failed to post'); });
}

// ============================================================
// FIXED LIKE POST - Persists correctly
// ============================================================
function likePost(postId) {
    if (!S.username) return;
    
    // Get current likes from Firebase FIRST
    firebase.database().ref('posts/' + postId + '/likes').once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        // Ensure it's an array
        if (!Array.isArray(likes)) likes = [];
        
        var idx = likes.indexOf(S.username);
        if (idx > -1) {
            // Unlike
            likes.splice(idx, 1);
        } else {
            // Like
            likes.push(S.username);
        }
        
        // Save back to Firebase
        return firebase.database().ref('posts/' + postId + '/likes').set(likes);
    }).then(function() {
        // The child_changed listener will update the UI
        console.log('Like toggled for post:', postId);
    }).catch(function(error) {
        console.error('Like error:', error);
    });
}

// ============================================================
// FIXED COMMENT ON POST - Persists correctly
// ============================================================
function commentOnPost(postId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬', title: 'Add Comment', placeholder: 'Write your comment...', confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            // Get current comments from Firebase FIRST
            firebase.database().ref('posts/' + postId + '/comments').once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                if (!Array.isArray(comments)) comments = [];
                
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                
                // Save back to Firebase
                return firebase.database().ref('posts/' + postId + '/comments').set(comments);
            }).then(function() {
                toast('Comment added! 💬');
            }).catch(function(error) {
                console.error('Comment error:', error);
            });
        }
    });
}

function deletePost(postId) {
    showDialog({ emoji: '🗑️', title: 'Delete Post', subtitle: 'Are you sure?', confirmText: 'Delete', danger: true }).then(function(result) {
        if (result !== null) {
            firebase.database().ref('posts/' + postId).remove().then(function() {
                toast('Post deleted');
            });
        }
    });
}

function handleFileSelect(event) {
    var file = event.target.files[0]; if (!file) return;
    var maxSize = file.type.startsWith('video/') ? 50*1024*1024 : 10*1024*1024;
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
    selectedFile = null; selectedFileData = null;
    var preview = document.getElementById('filePreview'); if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    var fileInput = document.getElementById('postFile'); if (fileInput) fileInput.value = '';
}

function downloadMedia(url) { if (!url) return; if (url.startsWith('data:')) { var a = document.createElement('a'); a.href = url; a.download = 'media.jpg'; a.click(); } }

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) { S.bookmarks.splice(idx, 1); toast('Removed'); }
    else { S.bookmarks.push({ id: id, type: type, time: new Date().toISOString() }); toast('Saved! 🔖'); }
    firebase.database().ref('users/' + S.username + '/bookmarks').set(S.bookmarks);
    saveState(); renderSocial(); renderProfile();
}

function renderStories() {
    var row = document.getElementById('storyRow'); if (!row) return;
    row.innerHTML = '<div class="ig-story" onclick="addStatus()"><div class="ig-story-avatar"><div class="inner" style="display:flex;align-items:center;justify-content:center;font-size:24px;">📸</div></div><span class="ig-story-name">My Status</span><span style="font-size:8px;color:#6366f1;">+ Add</span></div>';
}

function addStatus() {
    if (!S.username) return;
    showDialog({ emoji: '📸', title: 'Add Status', placeholder: 'What\'s on your mind?', confirmText: 'Post' }).then(function(text) {
        if (text !== null && text.trim()) {
            firebase.database().ref('statuses').push({ author: S.username, avatar: S.avatar || null, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString(), views: [] });
            toast('Status added! 📸');
            renderStories();
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
window.downloadMedia = downloadMedia;
window.bookmarkItem = bookmarkItem;

console.log('📱 Social loaded - likes and comments fixed');