// Social Feed Module - Complete with posts, likes, comments, bookmarks, and stories

var postsListener = null;
var selectedFile = null;
var selectedFileData = null;

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
    
    var postsRef = db.ref('posts');
    
    // Load ALL existing posts once
    postsRef.orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val();
        console.log('Firebase posts snapshot received');
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                var post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
            // Sort by newest first
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            console.log('Total posts loaded: ' + S.socialPosts.length);
        } else {
            console.log('No posts found in database');
        }
        
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Listen for new posts in real-time
    postsListener = postsRef;
    
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        
        var existing = S.socialPosts.find(function(p) {
            return p.id === post.id;
        });
        
        if (!existing) {
            console.log('New post detected:', post.id, 'by', post.author);
            S.socialPosts.unshift(post);
            
            // Keep only last 200 posts
            if (S.socialPosts.length > 200) {
                S.socialPosts = S.socialPosts.slice(0, 200);
            }
            
            // Re-sort
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
        var post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        
        var idx = S.socialPosts.findIndex(function(p) {
            return p.id === post.id;
        });
        
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    postsListener.on('child_removed', function(snapshot) {
        console.log('Post removed:', snapshot.key);
        S.socialPosts = S.socialPosts.filter(function(p) {
            return p.id !== snapshot.key;
        });
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
    if (!feed) {
        console.log('Feed element not found');
        return;
    }
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in to see posts.</p>';
        return;
    }
    
    var posts = S.socialPosts || [];
    console.log('Rendering ' + posts.length + ' posts in feed');
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">📸</div>' +
            '<p>No posts yet. Be the first to share something!</p>' +
            '</div>';
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
        
        // Avatar
        var avatarDisplay = '';
        if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + post.avatar + '" alt="' + post.author + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentNode.innerHTML=\'<div style=&quot;width:100%;height:100%;border-radius:50%;background:\' + getColor(post.author) + \';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;&quot;>\' + post.author.charAt(0).toUpperCase() + \'</div>\';" />';
        } else {
            var color = getColor(post.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        }
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + post.id + '\')">';
        
        // Header
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
        
        // Image
        if (post.image) {
            html += '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;" onclick="event.stopPropagation();" />';
        }
        
        // Text
        if (post.text) {
            html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;margin:0;">' + escapeHtml(post.text) + '</p></div>';
        }
        
        // Actions
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:12px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;">🔖</button>';
        if (post.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:20px;">⬇️</button>';
        }
        html += '</div>';
        
        // Comments preview
        if (commentCount > 0) {
            html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;cursor:pointer;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">View ' + commentCount + ' comment' + (commentCount > 1 ? 's' : '') + '</div>';
        }
        
        html += '</div>';
    });
    
    feed.innerHTML = html;
}

// ============================================================
// CREATE POST
// ============================================================
function createPost() {
    if (!S.username) {
        toast('Please log in to post');
        return;
    }
    
    var input = document.getElementById('postInput');
    var text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) {
        toast('Write something or attach media');
        return;
    }
    
    console.log('Creating post for:', S.username);
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
    
    var newRef = db.ref('posts').push();
    
    newRef.set(postData).then(function() {
        console.log('Post saved with ID:', newRef.key);
        
        // Add to local state immediately
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
        renderStories();
        saveState();
        
        toast('📝 Posted!');
    }).catch(function(error) {
        console.error('Post error:', error);
        toast('Failed to post. Please try again.');
    });
}

// ============================================================
// HANDLE FILE SELECT
// ============================================================
function handleFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    
    var allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.indexOf(file.type) === -1) {
        toast('Unsupported file type. Use JPEG, PNG, GIF, WebP, MP4, or WebM.');
        event.target.value = '';
        return;
    }
    
    var maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('File too large. Max size is ' + Math.round(maxSize / (1024 * 1024)) + 'MB.');
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
            preview.innerHTML = '<div style="position:relative;display:inline-block;">' +
                '<img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;" />' +
                '<button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button>' +
                '</div>';
        } else {
            preview.innerHTML = '<div style="position:relative;display:inline-block;">' +
                '<video src="' + e.target.result + '" controls style="max-height:150px;border-radius:8px;max-width:100%;"></video>' +
                '<button onclick="clearFileSelection()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;">✕</button>' +
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

// ============================================================
// LIKE POST
// ============================================================
function likePost(postId) {
    if (!S.username) return;
    
    db.ref('posts/' + postId + '/likes').once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
        } else {
            likes.push(S.username);
        }
        
        return db.ref('posts/' + postId + '/likes').set(likes);
    }).then(function() {
        // Update local state
        var post = S.socialPosts.find(function(p) { return p.id === postId; });
        if (post) {
            var idx = (post.likes || []).indexOf(S.username);
            if (idx > -1) {
                post.likes.splice(idx, 1);
            } else {
                if (!post.likes) post.likes = [];
                post.likes.push(S.username);
            }
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
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            db.ref('posts/' + postId + '/comments').once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                return db.ref('posts/' + postId + '/comments').set(comments);
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
            });
        }
    });
}

// ============================================================
// DELETE POST
// ============================================================
function deletePost(postId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Post',
        subtitle: 'Are you sure you want to delete this post?',
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
            }).catch(function(error) {
                console.error('Delete error:', error);
            });
        }
    });
}

// ============================================================
// VIEW POST DETAIL
// ============================================================
function viewPostDetail(postId) {
    var post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) { toast('Post not found'); return; }
    
    var overlay = document.getElementById('postDetailOverlay');
    var body = document.getElementById('postDetailBody');
    if (!overlay || !body) return;
    
    var liked = (post.likes || []).indexOf(S.username) > -1;
    var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === postId; });
    
    // Avatar
    var avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = '<img src="' + post.avatar + '" style="width:36px;height:36px;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = getColor(post.author);
        avatarDisplay = '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + post.author.charAt(0).toUpperCase() + '</div>';
    }
    
    var html = '<button class="post-detail-back" onclick="closePostDetail()">← <span>Back</span></button>';
    
    // Author
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;">';
    html += '<div class="profile-bubble" onclick="closePostDetail();viewUserProfile(\'' + post.author + '\')">';
    html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
    html += '<span class="pb-name">' + escapeHtml(post.author) + '</span>';
    html += '</div>';
    html += '<span style="font-size:11px;color:#94a3b8;margin-left:auto;">' + timeSince(new Date(post.time)) + '</span>';
    if (post.author === S.username) {
        html += '<button class="btn-sm btn-danger" onclick="deletePost(\'' + post.id + '\');closePostDetail();">🗑️</button>';
    }
    html += '</div>';
    
    // Image
    if (post.image) {
        html += '<img src="' + post.image + '" style="width:100%;max-height:450px;object-fit:cover;border-radius:12px;margin:8px 0;" />';
    }
    
    // Text
    if (post.text) {
        html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    }
    
    // Actions
    html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);" style="font-size:22px;">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="font-weight:600;">' + (post.likes || []).length + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);" style="font-size:22px;">💬</button>';
    html += '<span style="font-weight:600;">' + (post.comments || []).length + '</span>';
    html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\');closePostDetail();" style="font-size:22px;">🔖</button>';
    if (post.image) {
        html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:22px;">⬇️</button>';
    }
    html += '</div>';
    
    // Comments
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments</strong></div>';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(function(comment) {
            html += '<div style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">';
            html += '<strong style="cursor:pointer;" onclick="closePostDetail();viewUserProfile(\'' + comment.username + '\')">' + escapeHtml(comment.username) + '</strong>';
            html += ' <span style="font-size:10px;color:#94a3b8;">' + timeSince(new Date(comment.time)) + '</span>';
            html += '<br>' + escapeHtml(comment.text);
            html += '</div>';
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:16px;">No comments yet.</div>';
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
// DOWNLOAD MEDIA
// ============================================================
function downloadMedia(url) {
    if (!url) return;
    if (url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = url;
        a.download = 'winchu-media.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('⬇️ Downloading...');
    } else if (url.startsWith('http')) {
        window.open(url, '_blank');
    }
}

// ============================================================
// BOOKMARK ITEM
// ============================================================
function bookmarkItem(id, type) {
    if (!S.username) return;
    
    S.bookmarks = S.bookmarks || [];
    var idx = S.bookmarks.findIndex(function(b) { return b.id === id; });
    
    if (idx > -1) {
        S.bookmarks.splice(idx, 1);
        toast('Removed from saved');
    } else {
        S.bookmarks.push({ id: id, type: type, time: new Date().toISOString() });
        toast('Saved! 🔖');
    }
    
    db.ref('users/' + S.username + '/bookmarks').set(S.bookmarks);
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
    
    db.ref('statuses').orderByChild('time').limitToLast(30).once('value').then(function(snapshot) {
        var statuses = [];
        var data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var s = data[key];
                s.id = key;
                if (new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        
        var authors = statuses.map(function(s) { return s.author; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
        if (authors.indexOf(S.username) === -1) authors.unshift(S.username);
        
        if (authors.length === 0) {
            row.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No stories yet</div>';
            return;
        }
        
        row.innerHTML = authors.map(function(author) {
            var isMe = author === S.username;
            var s = statuses.find(function(x) { return x.author === author; });
            var color = getColor(author);
            
            var avatarHTML = '';
            if (s && s.avatar && s.avatar.startsWith('data:')) {
                avatarHTML = '<img src="' + s.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
            } else if (isMe && S.avatar) {
                avatarHTML = '<img src="' + S.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
            } else {
                avatarHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;">' + author.charAt(0).toUpperCase() + '</div>';
            }
            
            return '<div class="ig-story" onclick="' + (isMe ? 'addStatus()' : 'viewStatus(\'' + author + '\')') + '">' +
                '<div class="ig-story-avatar"><div class="inner">' + avatarHTML + '</div></div>' +
                '<span class="ig-story-name">' + (isMe ? 'My Status' : author) + '</span>' +
                (isMe ? '<span style="font-size:8px;color:#6366f1;">+ Add</span>' : '') +
                '</div>';
        }).join('');
    });
}

function addStatus() {
    if (!S.username) return;
    
    showDialog({
        emoji: '📸',
        title: 'Add Status',
        subtitle: 'Share a text status (expires in 24 hours)',
        placeholder: 'What\'s on your mind?',
        confirmText: 'Post'
    }).then(function(text) {
        if (text !== null && text.trim()) {
            var status = {
                author: S.username,
                avatar: S.avatar || null,
                text: text.trim(),
                time: new Date().toISOString(),
                expires: new Date(Date.now() + 86400000).toISOString(),
                views: []
            };
            
            db.ref('statuses').push(status).then(function() {
                toast('Status added! 📸');
                renderStories();
            });
        }
    });
}

function viewStatus(username) {
    db.ref('statuses').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
        var statuses = [];
        var data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var s = data[key];
                if (s.author === username && new Date(s.expires) > new Date()) statuses.push(s);
            });
        }
        
        if (statuses.length === 0) { toast('No active status'); return; }
        
        var status = statuses[statuses.length - 1];
        var html = '<div style="text-align:center;padding:10px;"><strong>' + escapeHtml(status.author) + '</strong><br><small>' + timeSince(new Date(status.time)) + '</small></div>';
        if (status.text) html += '<p style="font-size:15px;text-align:center;padding:10px;">' + escapeHtml(status.text) + '</p>';
        
        var overlay = document.getElementById('postDetailOverlay');
        var body = document.getElementById('postDetailBody');
        body.innerHTML = '<button class="post-detail-back" onclick="closePostDetail()">← Close</button>' + html;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// Expose globally
window.addStatus = addStatus;
window.viewStatus = viewStatus;
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

console.log('📱 Social module loaded');