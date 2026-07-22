// Social Feed Module - Complete

// Global variables
let postsListener = null;
let selectedFile = null;
let selectedFileData = null;

// ============================================================
// SETUP POSTS LISTENER
// ============================================================
function setupPostsListener() {
    console.log('=== SETTING UP POSTS LISTENER ===');
    
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    // Clear existing posts
    S.socialPosts = [];
    
    // Reference to posts in Firebase
    const postsRef = getRef('posts');
    
    // Load ALL existing posts once
    postsRef.once('value', function(snapshot) {
        console.log('Firebase posts snapshot received');
        const data = snapshot.val();
        
        if (data) {
            const keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                const post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
            // Sort by time - newest first
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            console.log('Total posts loaded: ' + S.socialPosts.length);
        } else {
            console.log('No posts found in database');
        }
        
        // Render after loading
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Listen for new posts added in real-time
    postsRef.on('child_added', function(snapshot) {
        const post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        
        // Check if post already exists in array
        const existingIndex = S.socialPosts.findIndex(function(p) {
            return p.id === post.id;
        });
        
        if (existingIndex === -1) {
            console.log('New post detected via listener:', post.id, 'by', post.author);
            S.socialPosts.unshift(post);
            
            // Re-sort by time
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            // Keep only last 200 posts in memory
            if (S.socialPosts.length > 200) {
                S.socialPosts = S.socialPosts.slice(0, 200);
            }
            
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    // Listen for post updates (likes, comments)
    postsRef.on('child_changed', function(snapshot) {
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
    
    // Listen for post deletions
    postsRef.on('child_removed', function(snapshot) {
        console.log('Post removed:', snapshot.key);
        S.socialPosts = S.socialPosts.filter(function(p) {
            return p.id !== snapshot.key;
        });
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active and listening');
}

// ============================================================
// RENDER SOCIAL FEED
// ============================================================
function renderSocial() {
    const feed = document.getElementById('socialFeed');
    if (!feed) {
        console.log('Feed element not found');
        return;
    }
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in to see posts</p>';
        return;
    }
    
    const posts = S.socialPosts || [];
    console.log('Rendering ' + posts.length + ' posts in feed');
    
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><div style="font-size:48px;">📸</div><p>No posts yet. Be the first to share something!</p></div>';
        return;
    }
    
    let html = '';
    
    posts.forEach(function(post) {
        if (!post || !post.author) return;
        
        const liked = (post.likes || []).indexOf(S.username) > -1;
        const bookmarked = (S.bookmarks || []).some(function(b) { return b.id === post.id; });
        const likeCount = (post.likes || []).length;
        const commentCount = (post.comments || []).length;
        const timeAgo = timeSince(new Date(post.time));
        const canDelete = post.author === S.username;
        
        // Avatar display
        let avatarDisplay = '';
        if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + post.avatar + '" alt="' + post.author + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div style=&quot;width:100%;height:100%;border-radius:50%;background:' + getColor(post.author) + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;&quot;>' + post.author.charAt(0).toUpperCase() + '</div>\';" />';
        } else {
            const color = getColor(post.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        }
        
        html += '<div class="ig-post" style="cursor:pointer;" onclick="viewPostDetail(\'' + post.id + '\')">';
        
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
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;cursor:pointer;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;cursor:pointer;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;cursor:pointer;">🔖</button>';
        if (post.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:20px;cursor:pointer;">⬇️</button>';
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
        toast('Please log in');
        return;
    }
    
    const input = document.getElementById('postInput');
    const text = input ? input.value.trim() : '';
    
    if (!text && !selectedFileData) {
        toast('Write something or attach media');
        return;
    }
    
    console.log('Creating post for user:', S.username);
    
    const postData = {
        author: S.username,
        avatar: S.avatar || null,
        text: text,
        image: selectedFileData || null,
        time: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    // Save to Firebase using push
    const newPostRef = getRef('posts').push();
    
    newPostRef.set(postData).then(function() {
        console.log('Post saved successfully with ID:', newPostRef.key);
        
        // Clear form
        if (input) input.value = '';
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
        
        // The Firebase listener will pick up the new post automatically
    }).catch(function(error) {
        console.error('Post save error:', error);
        toast('Failed to post. Error: ' + error.message);
    });
}

// ============================================================
// HANDLE FILE SELECT
// ============================================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
        toast('Unsupported file type. Please use JPEG, PNG, GIF, WebP, MP4, or WebM.');
        event.target.value = '';
        return;
    }
    
    // Check file size
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('File too large. Max size is ' + Math.round(maxSize / (1024 * 1024)) + 'MB.');
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
        console.error('File read error');
        toast('Error reading file. Please try again.');
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

// ============================================================
// LIKE POST
// ============================================================
function likePost(postId) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    const postRef = getRef('posts/' + postId + '/likes');
    
    postRef.once('value', function(snapshot) {
        let likes = snapshot.val() || [];
        const index = likes.indexOf(S.username);
        
        if (index > -1) {
            // Unlike
            likes.splice(index, 1);
        } else {
            // Like
            likes.push(S.username);
        }
        
        postRef.set(likes).then(function() {
            console.log('Like updated for post:', postId);
            renderSocial();
        }).catch(function(error) {
            console.error('Like error:', error);
        });
    });
}

// ============================================================
// COMMENT ON POST
// ============================================================
function commentOnPost(postId) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        subtitle: 'Write your comment',
        placeholder: 'Type your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            const commentRef = getRef('posts/' + postId + '/comments');
            
            commentRef.once('value', function(snapshot) {
                let comments = snapshot.val() || [];
                
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                
                commentRef.set(comments).then(function() {
                    console.log('Comment added to post:', postId);
                    renderSocial();
                    toast('Comment added! 💬');
                    saveState();
                }).catch(function(error) {
                    console.error('Comment error:', error);
                });
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
        danger: true,
        cancelText: 'Cancel'
    }).then(function(result) {
        if (result !== null) {
            getRef('posts/' + postId).remove().then(function() {
                console.log('Post deleted:', postId);
                toast('Post deleted');
                // Listener will handle removal from UI
            }).catch(function(error) {
                console.error('Delete error:', error);
                toast('Failed to delete post');
            });
        }
    });
}

// ============================================================
// VIEW POST DETAIL
// ============================================================
function viewPostDetail(postId) {
    const post = S.socialPosts.find(function(p) { return p.id === postId; });
    if (!post) {
        toast('Post not found');
        return;
    }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    
    if (!overlay || !body) return;
    
    const liked = (post.likes || []).indexOf(S.username) > -1;
    const bookmarked = (S.bookmarks || []).some(function(b) { return b.id === postId; });
    
    // Avatar
    let avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = '<img src="' + post.avatar + '" style="width:36px;height:36px;object-fit:cover;border-radius:50%;" />';
    } else {
        const color = getColor(post.author);
        avatarDisplay = '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + post.author.charAt(0).toUpperCase() + '</div>';
    }
    
    let html = '';
    
    // Back button
    html += '<button class="post-detail-back" onclick="closePostDetail()">← <span>Back</span></button>';
    
    // Author info
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
        html += '<img src="' + post.image + '" class="post-detail-image" style="width:100%;max-height:450px;object-fit:cover;border-radius:12px;margin:8px 0;" />';
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
    
    // Comments section
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments</strong></div>';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(function(comment) {
            html += '<div class="post-detail-comment" style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">';
            html += '<strong style="cursor:pointer;" onclick="closePostDetail();viewUserProfile(\'' + comment.username + '\')">' + escapeHtml(comment.username) + '</strong>';
            html += ' <span style="font-size:10px;color:#94a3b8;">' + timeSince(new Date(comment.time)) + '</span>';
            html += '<br>' + escapeHtml(comment.text);
            html += '</div>';
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:16px;">No comments yet. Be the first!</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostDetail() {
    const overlay = document.getElementById('postDetailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// ============================================================
// DOWNLOAD MEDIA
// ============================================================
function downloadMedia(url) {
    if (!url) {
        toast('No media to download');
        return;
    }
    
    try {
        if (url.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'winchu-media.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast('⬇️ Downloading...');
        } else if (url.startsWith('http')) {
            window.open(url, '_blank');
            toast('⬇️ Opening in new tab...');
        }
    } catch (e) {
        console.error('Download error:', e);
        toast('Download failed');
    }
}

// ============================================================
// BOOKMARK ITEM
// ============================================================
function bookmarkItem(id, type) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    S.bookmarks = S.bookmarks || [];
    
    const existingIndex = S.bookmarks.findIndex(function(b) {
        return b.id === id;
    });
    
    if (existingIndex > -1) {
        // Remove bookmark
        S.bookmarks.splice(existingIndex, 1);
        toast('Removed from saved');
    } else {
        // Add bookmark
        S.bookmarks.push({
            id: id,
            type: type,
            time: new Date().toISOString()
        });
        toast('Saved! 🔖');
    }
    
    // Save to Firebase
    if (S.username) {
        setData('users/' + S.username + '/bookmarks', S.bookmarks);
    }
    
    saveState();
    renderSocial();
    renderProfile();
}

// ============================================================
// STORIES / STATUS
// ============================================================
function renderStories() {
    const row = document.getElementById('storyRow');
    if (!row) return;
    
    // Load statuses from Firebase
    getRef('statuses').orderByChild('time').limitToLast(30).once('value', function(snapshot) {
        const statuses = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                const s = data[key];
                s.id = key;
                // Only show non-expired statuses
                if (new Date(s.expires) > new Date()) {
                    statuses.push(s);
                }
            });
        }
        
        // Get unique authors
        const authors = [...new Set(statuses.map(function(s) { return s.author; }))];
        
        // Always show "My Status" first
        if (!authors.includes(S.username)) {
            authors.unshift(S.username);
        }
        
        if (authors.length === 0) {
            row.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No stories yet</div>';
            return;
        }
        
        row.innerHTML = authors.map(function(author) {
            const isMyStatus = author === S.username;
            const authorStatus = statuses.find(function(s) { return s.author === author; });
            
            let avatarDisplay = '';
            if (authorStatus && authorStatus.avatar && authorStatus.avatar.startsWith('data:')) {
                avatarDisplay = '<img src="' + authorStatus.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
            } else if (isMyStatus && S.avatar) {
                avatarDisplay = '<img src="' + S.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
            } else {
                const color = getColor(author);
                avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;">' + author.charAt(0).toUpperCase() + '</div>';
            }
            
            const ringColor = isMyStatus ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)';
            
            return '<div class="ig-story" onclick="' + (isMyStatus ? 'addStatus()' : 'viewStatus(\'' + author + '\')') + '">' +
                '<div class="ig-story-avatar" style="background:' + ringColor + ';">' +
                '<div class="inner">' + avatarDisplay + '</div>' +
                '</div>' +
                '<span class="ig-story-name">' + (isMyStatus ? 'My Status' : author) + '</span>' +
                (isMyStatus ? '<span style="font-size:8px;color:#6366f1;">+ Add</span>' : '') +
                '</div>';
        }).join('');
    });
}

function addStatus() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    showDialog({
        emoji: '📸',
        title: 'Add Status',
        subtitle: 'Share a text status (expires in 24 hours)',
        placeholder: 'What\'s on your mind?',
        confirmText: 'Post Status'
    }).then(function(text) {
        if (text !== null && text.trim()) {
            const status = {
                author: S.username,
                avatar: S.avatar || null,
                text: text.trim(),
                image: null,
                time: new Date().toISOString(),
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                views: []
            };
            
            pushData('statuses', status).then(function() {
                toast('Status added! 📸');
                renderStories();
            }).catch(function() {
                toast('Failed to add status');
            });
        }
    });
}

function viewStatus(username) {
    getRef('statuses').orderByChild('time').limitToLast(20).once('value', function(snapshot) {
        const statuses = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                const s = data[key];
                if (s.author === username && new Date(s.expires) > new Date()) {
                    statuses.push(s);
                }
            });
        }
        
        if (statuses.length === 0) {
            toast('No active status from @' + username);
            return;
        }
        
        const status = statuses[statuses.length - 1];
        
        let html = '<div style="text-align:center;padding:10px;">';
        html += '<strong>' + escapeHtml(status.author) + '</strong><br>';
        html += '<small style="color:#94a3b8;">' + timeSince(new Date(status.time)) + '</small>';
        html += '</div>';
        
        if (status.image) {
            html += '<img src="' + status.image + '" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin:8px 0;" />';
        }
        
        if (status.text) {
            html += '<p style="font-size:15px;text-align:center;padding:10px;">' + escapeHtml(status.text) + '</p>';
        }
        
        html += '<p style="font-size:10px;color:#94a3b8;text-align:center;">Expires in 24 hours · ' + (status.views || []).length + ' views</p>';
        
        const overlay = document.getElementById('postDetailOverlay');
        const body = document.getElementById('postDetailBody');
        
        body.innerHTML = '<button class="post-detail-back" onclick="closePostDetail()">← <span>Close</span></button>' + html;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Mark as viewed
        if (!status.views) status.views = [];
        if (!status.views.includes(S.username)) {
            status.views.push(S.username);
            getRef('statuses/' + status.id + '/views').set(status.views);
        }
    });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
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

console.log('📱 Social module fully loaded');