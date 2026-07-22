// Social Feed Module - Fixed preview and posting

let postsListener = null;
let selectedFile = null;
let selectedFileData = null;

function setupPostsListener() {
    console.log('Setting up posts...');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    // Load all posts
    database.ref('posts').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        
        console.log('Posts loaded:', S.socialPosts.length);
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    });
    
    // Listen for new posts
    postsListener = database.ref('posts');
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        post.id = snapshot.key;
        
        if (!S.socialPosts.find(function(p) { return p.id === post.id; })) {
            S.socialPosts.unshift(post);
            renderSocial();
            renderProfile();
            saveState();
        }
    });
    
    postsListener.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial();
        renderProfile();
    });
}

function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    var posts = S.socialPosts || [];
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet!</p></div>';
        return;
    }
    
    var html = '';
    
    posts.forEach(function(post) {
        if (!post || !post.author) return;
        
        var liked = (post.likes || []).indexOf(S.username) > -1;
        var likeCount = (post.likes || []).length;
        var commentCount = (post.comments || []).length;
        var timeAgo = timeSince(new Date(post.time));
        var color = getColor(post.author);
        
        var avatarHTML = post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))
            ? '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
            : '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + post.id + '\')">';
        html += '<div class="ig-post-header">';
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + post.author + '\')">';
        html += '<div class="pb-avatar">' + avatarHTML + '</div>';
        html += '<span class="pb-name">' + escapeHtml(post.author) + '</span>';
        html += '</div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (post.author === S.username) {
            html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        }
        html += '</div>';
        
        if (post.image) {
            html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" />';
        }
        
        if (post.text) {
            html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        }
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="margin:0 12px 0 4px;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')">💬</button>';
        html += '<span style="margin:0 12px 0 4px;">' + commentCount + '</span>';
        html += '<button class="ig-post-action" onclick="bookmarkItem(\'' + post.id + '\',\'post\')">🔖</button>';
        if (post.image) html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')">⬇️</button>';
        html += '</div>';
        
        if (commentCount > 0) {
            html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View ' + commentCount + ' comments</div>';
        }
        
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// CREATE POST
function createPost() {
    if (!S.username) { toast('Please log in'); return; }
    
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) { toast('Write something or attach media'); return; }
    
    toast('Posting...');
    
    var postData = {
        author: S.username,
        avatar: S.avatar || null,
        text: text,
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    var newRef = database.ref('posts').push();
    newRef.set(postData).then(function() {
        postData.id = newRef.key;
        S.socialPosts.unshift(postData);
        
        // Clear form
        if (input) input.value = '';
        selectedFile = null;
        selectedFileData = null;
        
        var preview = document.getElementById('filePreview');
        if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
        
        var fileInput = document.getElementById('postFile');
        if (fileInput) fileInput.value = '';
        
        renderSocial();
        renderProfile();
        saveState();
        toast('Posted!');
    }).catch(function(err) {
        console.error(err);
        toast('Failed to post');
    });
}

// HANDLE FILE SELECT - Fixed preview
function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type);
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('File too large (max ' + Math.round(maxSize/(1024*1024)) + 'MB)');
        event.target.value = '';
        return;
    }
    
    selectedFile = file;
    
    var reader = new FileReader();
    reader.onload = function(e) {
        selectedFileData = e.target.result;
        console.log('File loaded, size:', selectedFileData.length);
        
        var preview = document.getElementById('filePreview');
        if (!preview) return;
        
        if (file.type.startsWith('image/')) {
            preview.innerHTML = '<div style="position:relative;display:inline-block;margin-top:4px;">' +
                '<img src="' + e.target.result + '" style="max-height:120px;max-width:100%;border-radius:8px;" />' +
                '<button onclick="clearFileSelection()" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:10px;cursor:pointer;">✕</button>' +
                '</div>';
        } else if (file.type.startsWith('video/')) {
            preview.innerHTML = '<div style="position:relative;display:inline-block;margin-top:4px;">' +
                '<video src="' + e.target.result + '" controls style="max-height:120px;max-width:100%;border-radius:8px;"></video>' +
                '<button onclick="clearFileSelection()" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:10px;cursor:pointer;">✕</button>' +
                '</div>';
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
    var preview = document.getElementById('filePreview');
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    var fileInput = document.getElementById('postFile');
    if (fileInput) fileInput.value = '';
}

function likePost(postId) {
    if (!S.username) return;
    database.ref('posts/' + postId + '/likes').once('value').then(function(snap) {
        var likes = snap.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        database.ref('posts/' + postId + '/likes').set(likes).then(function() { renderSocial(); });
    });
}

function commentOnPost(postId) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(text) {
        if (text && text.trim()) {
            database.ref('posts/' + postId + '/comments').once('value').then(function(snap) {
                var comments = snap.val() || [];
                comments.push({ username: S.username, text: text.trim(), time: new Date().toISOString() });
                database.ref('posts/' + postId + '/comments').set(comments).then(function() { renderSocial(); toast('Done!'); });
            });
        }
    });
}

function deletePost(postId) {
    showDialog({ emoji: '🗑️', title: 'Delete', confirmText: 'Delete', danger: true }).then(function(result) {
        if (result !== null) {
            database.ref('posts/' + postId).remove();
            S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== postId; });
            renderSocial();
            renderProfile();
            toast('Deleted');
        }
    });
}

function viewPostDetail(postId) {
    var post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) { toast('Not found'); return; }
    
    var overlay = document.getElementById('postDetailOverlay');
    var body = document.getElementById('postDetailBody');
    var liked = (post.likes || []).indexOf(S.username) > -1;
    
    var html = '<button class="post-detail-back" onclick="closePostDetail()">← Back</button>';
    html += '<div style="padding:10px 0;"><strong>' + escapeHtml(post.author) + '</strong> <small>' + timeSince(new Date(post.time)) + '</small></div>';
    if (post.image) html += '<img src="' + post.image + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;" />';
    if (post.text) html += '<p style="padding:10px 0;">' + escapeHtml(post.text) + '</p>';
    
    html += '<div style="padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')">' + (liked ? '❤️' : '🤍') + '</button> ';
    html += '<span>' + (post.likes||[]).length + '</span> ';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')">💬</button> ';
    html += '<span>' + (post.comments||[]).length + '</span>';
    html += '</div>';
    
    html += '<div style="border-top:1px solid #eee;padding-top:8px;"><strong>Comments</strong></div>';
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(function(c) {
            html += '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><strong>' + c.username + '</strong> ' + c.text + '</div>';
        });
    } else {
        html += '<div style="color:#999;padding:10px;">No comments</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostDetail() {
    document.getElementById('postDetailOverlay').classList.remove('active');
    document.body.style.overflow = '';
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
    database.ref('users/' + S.username + '/bookmarks').set(S.bookmarks);
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
        if (text && text.trim()) {
            database.ref('statuses').push({ author: S.username, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString() });
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

console.log('📱 Social ready');