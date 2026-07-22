// Social Feed Module - Fixed posting

let postsListener = null;
let selectedFile = null;
let selectedFileData = null;

// Setup posts listener
function setupPostsListener() {
    console.log('Setting up posts listener...');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    // Load ALL existing posts
    var postsRef = getRef('posts');
    if (!postsRef) {
        console.error('Cannot access posts reference');
        return;
    }
    
    postsRef.once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts');
            
            keys.forEach(function(key) {
                var post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
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
    postsListener = postsRef;
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        
        var exists = S.socialPosts.find(function(p) { return p.id === post.id; });
        if (!exists) {
            console.log('New post:', post.id);
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
    
    postsListener.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial();
        renderProfile();
    });
}

// Render feed
function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
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
        var likeCount = (post.likes || []).length;
        var commentCount = (post.comments || []).length;
        var timeAgo = timeSince(new Date(post.time));
        var canDelete = post.author === S.username;
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
        
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;margin:0 12px 0 4px;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;margin:0 12px 0 4px;">' + commentCount + '</span>';
        html += '<button class="ig-post-action" onclick="bookmarkItem(\'' + post.id + '\',\'post\')">🔖</button>';
        if (post.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')">⬇️</button>';
        }
        html += '</div>';
        
        if (commentCount > 0) {
            html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View ' + commentCount + ' comment' + (commentCount > 1 ? 's' : '') + '</div>';
        }
        
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// CREATE POST - Fixed
function createPost() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) {
        toast('Write something or attach media');
        return;
    }
    
    console.log('Creating post...');
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
    
    // Save to Firebase
    pushData('posts', postData).then(function(result) {
        console.log('Post saved! ID:', result.key);
        
        // Add to local state immediately
        postData.id = result.key;
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
        toast('📝 Posted!');
    }).catch(function(error) {
        console.error('Post error:', error);
        toast('Failed to post. Check connection.');
    });
}

// Handle file select
function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
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

function likePost(postId) {
    if (!S.username) return;
    getRef('posts/' + postId + '/likes').once('value').then(function(snap) {
        var likes = snap.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        getRef('posts/' + postId + '/likes').set(likes).then(function() { renderSocial(); });
    });
}

function commentOnPost(postId) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(text) {
        if (text && text.trim()) {
            getRef('posts/' + postId + '/comments').once('value').then(function(snap) {
                var comments = snap.val() || [];
                comments.push({ username: S.username, text: text.trim(), time: new Date().toISOString() });
                getRef('posts/' + postId + '/comments').set(comments).then(function() {
                    renderSocial();
                    toast('Comment added!');
                });
            });
        }
    });
}

function deletePost(postId) {
    showDialog({ emoji: '🗑️', title: 'Delete', subtitle: 'Delete this post?', confirmText: 'Delete', danger: true }).then(function(result) {
        if (result !== null) {
            getRef('posts/' + postId).remove().then(function() { toast('Deleted'); });
        }
    });
}

function viewPostDetail(postId) {
    var post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) { toast('Post not found'); return; }
    
    var overlay = document.getElementById('postDetailOverlay');
    var body = document.getElementById('postDetailBody');
    if (!overlay || !body) return;
    
    var liked = (post.likes || []).indexOf(S.username) > -1;
    
    var html = '<button class="post-detail-back" onclick="closePostDetail()">← Back</button>';
    html += '<div style="padding:10px 0;"><strong>' + escapeHtml(post.author) + '</strong> <small>' + timeSince(new Date(post.time)) + '</small></div>';
    if (post.image) html += '<img src="' + post.image + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;" />';
    if (post.text) html += '<p style="padding:10px 0;">' + escapeHtml(post.text) + '</p>';
    
    html += '<div style="padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);">' + (liked ? '❤️' : '🤍') + '</button> ';
    html += '<span>' + (post.likes||[]).length + '</span> ';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);">💬</button> ';
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
    var overlay = document.getElementById('postDetailOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function downloadMedia(url) {
    if (!url) return;
    if (url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = url;
        a.download = 'media.jpg';
        a.click();
    } else {
        window.open(url, '_blank');
    }
}

function bookmarkItem(id, type) {
    if (!S.username) return;
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    if (idx > -1) { S.bookmarks.splice(idx, 1); toast('Removed'); }
    else { S.bookmarks.push({id:id, type:type, time:new Date().toISOString()}); toast('Saved!'); }
    setData('users/' + S.username + '/bookmarks', S.bookmarks);
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
    showDialog({ emoji: '📸', title: 'Add Status', placeholder: 'What\'s on your mind?', confirmText: 'Post' }).then(function(text) {
        if (text !== null && text.trim()) {
            pushData('statuses', { author: S.username, text: text.trim(), time: new Date().toISOString(), expires: new Date(Date.now()+86400000).toISOString() });
            toast('Status added!');
        }
    });
}

// Expose globally
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

console.log('📱 Social module ready');