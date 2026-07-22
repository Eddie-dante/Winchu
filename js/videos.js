// Videos Module - Fixed to display videos properly

let videosListener = null;
let selectedFile = null;
let selectedFileData = null;

// Load videos from Firebase
function loadVideos() {
    console.log('Loading videos...');
    
    if (videosListener) {
        videosListener.off();
        videosListener = null;
    }
    
    // Load ALL existing videos
    database.ref('videos').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' videos in database');
            
            keys.forEach(function(key) {
                var video = data[key];
                if (video && video.author) {
                    video.id = key;
                    S.videoData.push(video);
                }
            });
            
            // Sort newest first
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.videoData.length + ' videos');
        renderVideos();
    }).catch(function(error) {
        console.error('Error loading videos:', error);
    });
    
    // Listen for new videos
    videosListener = database.ref('videos');
    videosListener.on('child_added', function(snapshot) {
        var video = snapshot.val();
        if (!video || !video.author) return;
        
        video.id = snapshot.key;
        
        var exists = S.videoData.find(function(v) { return v.id === video.id; });
        if (!exists) {
            console.log('New video detected:', video.id);
            S.videoData.unshift(video);
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            renderVideos();
        }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; });
        renderVideos();
    });
}

// Render videos in feed
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in</p>';
        return;
    }
    
    var videos = S.videoData || [];
    console.log('Rendering ' + videos.length + ' videos');
    
    if (videos.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">No videos yet. Upload one!</p>';
        return;
    }
    
    var html = '';
    
    videos.forEach(function(v) {
        if (!v || !v.author) return;
        
        var liked = (v.likes || []).indexOf(S.username) > -1;
        var likeCount = (v.likes || []).length;
        var commentCount = (v.comments || []).length;
        var canDelete = v.author === S.username;
        var color = getColor(v.author);
        
        var avatarHTML = v.avatar && (v.avatar.startsWith('data:') || v.avatar.includes('http'))
            ? '<img src="' + v.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
            : '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + v.author.charAt(0).toUpperCase() + '</div>';
        
        html += '<div class="tiktok-video">';
        if (v.url) {
            html += '<video src="' + v.url + '" loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;"></video>';
        }
        html += '<div class="overlay">';
        html += '<div class="user" onclick="viewUserProfile(\'' + v.author + '\')">';
        html += '<div class="avatar">' + avatarHTML + '</div>';
        html += '@' + v.author;
        html += '</div>';
        if (v.text) {
            html += '<div class="desc">' + escapeHtml(v.text) + '</div>';
        }
        html += '<div class="side-actions">';
        html += '<button class="' + (liked ? 'liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + v.id + '\')">❤️<span>' + likeCount + '</span></button>';
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + v.id + '\')">💬<span>' + commentCount + '</span></button>';
        html += '<button onclick="event.stopPropagation();bookmarkItem(\'' + v.id + '\',\'video\')">🔖<span>Save</span></button>';
        html += '<button onclick="event.stopPropagation();downloadMedia(\'' + v.url + '\')">⬇️<span>DL</span></button>';
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + v.id + '\')" style="color:#ef4444;">🗑️<span>Del</span></button>';
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Setup video autoplay
    var videoElements = container.querySelectorAll('video');
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.play().catch(function() {});
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.6 });
    
    videoElements.forEach(function(v) { observer.observe(v); });
}

// Upload video
function handleVideoUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
        toast('Please select a video file');
        event.target.value = '';
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        toast('Video too large (max 50MB)');
        event.target.value = '';
        return;
    }
    
    toast('Uploading video...');
    
    var reader = new FileReader();
    reader.onload = function(e) {
        var videoData = {
            author: S.username,
            avatar: S.avatar || null,
            text: '',
            url: e.target.result,
            time: new Date().toISOString(),
            likes: [],
            comments: []
        };
        
        // Save to Firebase
        var newRef = database.ref('videos').push();
        newRef.set(videoData).then(function() {
            console.log('Video saved! ID:', newRef.key);
            
            // Add to local state
            videoData.id = newRef.key;
            S.videoData.unshift(videoData);
            renderVideos();
            
            toast('Video uploaded!');
        }).catch(function(error) {
            console.error('Video upload error:', error);
            toast('Failed to upload');
        });
    };
    reader.onerror = function() {
        toast('Error reading file');
    };
    reader.readAsDataURL(file);
}

function likeVideo(id) {
    if (!S.username) return;
    database.ref('videos/' + id + '/likes').once('value').then(function(snap) {
        var likes = snap.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        database.ref('videos/' + id + '/likes').set(likes);
        renderVideos();
    });
}

function commentVideo(id) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(text) {
        if (text && text.trim()) {
            database.ref('videos/' + id + '/comments').once('value').then(function(snap) {
                var comments = snap.val() || [];
                comments.push({ username: S.username, text: text.trim(), time: new Date().toISOString() });
                database.ref('videos/' + id + '/comments').set(comments);
                renderVideos();
                toast('Comment added!');
            });
        }
    });
}

function deleteVideo(id) {
    showDialog({ emoji: '🗑️', title: 'Delete', subtitle: 'Delete this video?', confirmText: 'Delete', danger: true }).then(function(result) {
        if (result !== null) {
            database.ref('videos/' + id).remove();
            S.videoData = S.videoData.filter(function(v) { return v.id !== id; });
            renderVideos();
            toast('Deleted');
        }
    });
}

function downloadMedia(url) {
    if (!url) return;
    if (url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = url;
        a.download = 'video.mp4';
        a.click();
    }
}

// Expose globally
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.commentVideo = commentVideo;
window.deleteVideo = deleteVideo;
window.downloadMedia = downloadMedia;
window.loadVideos = loadVideos;

console.log('🎬 Videos module loaded');