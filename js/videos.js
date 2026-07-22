// Videos Module - Complete with flexible video sizing and poster bubble on top

var videosListener = null;

// ============================================================
// LOAD VIDEOS FROM FIREBASE
// ============================================================
function loadVideos() {
    console.log('=== LOADING VIDEOS ===');
    
    if (videosListener) {
        videosListener.off();
        videosListener = null;
    }
    
    S.videoData = [];
    
    var videosRef = firebase.database().ref('videos');
    
    videosRef.orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' videos in database');
            
            keys.forEach(function(key) {
                var video = data[key];
                if (video && video.author) {
                    video.id = key;
                    if (!video.likes) video.likes = [];
                    if (!video.comments) video.comments = [];
                    S.videoData.push(video);
                }
            });
            
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.videoData.length + ' videos');
        renderVideos();
    }).catch(function(error) {
        console.error('Error loading videos:', error);
    });
    
    videosListener = videosRef;
    
    videosListener.on('child_added', function(snapshot) {
        var video = snapshot.val();
        if (!video || !video.author) return;
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        if (!S.videoData.find(function(v) { return v.id === video.id; })) {
            S.videoData.unshift(video);
            if (S.videoData.length > 100) S.videoData = S.videoData.slice(0, 100);
            renderVideos();
        }
    });
    
    videosListener.on('child_changed', function(snapshot) {
        var video = snapshot.val();
        if (!video) return;
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        var idx = S.videoData.findIndex(function(v) { return v.id === video.id; });
        if (idx > -1) { S.videoData[idx] = video; renderVideos(); }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; });
        renderVideos();
    });
}

// ============================================================
// RENDER VIDEOS - Flexible container, poster bubble on top
// ============================================================
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in to see videos.</p>';
        return;
    }
    
    var videos = S.videoData || [];
    console.log('Rendering ' + videos.length + ' videos');
    
    if (videos.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">🎬</div>' +
            '<p>No videos yet.</p>' +
            '<p style="font-size:12px;">Tap the upload button to share your first video!</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    
    videos.forEach(function(video) {
        if (!video || !video.author) return;
        
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        var liked = video.likes.indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === video.id; });
        var likeCount = video.likes.length;
        var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        
        var avatarDisplay = '';
        if (video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + video.avatar + '" alt="' + video.author + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(video.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
        }
        
        // FLEXIBLE VIDEO CONTAINER
        html += '<div class="tiktok-video" style="position:relative;width:100%;background:#000;overflow:hidden;border-radius:12px;min-height:300px;max-height:80vh;margin-bottom:16px;">';
        
        // VIDEO ELEMENT
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline preload="metadata" ' +
                'style="width:100%;height:auto;max-height:80vh;object-fit:contain;display:block;cursor:pointer;background:#000;" ' +
                'onclick="toggleVideoPlay(this)"></video>';
        }
        
        // ============================================================
        // POSTER BUBBLE - TOP LEFT (ABOVE LIKE BUTTON)
        // ============================================================
        html += '<div class="video-poster-bubble" style="position:absolute;top:16px;left:16px;z-index:20;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '<div class="video-poster-bubble-inner" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:6px 12px;border-radius:25px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;">';
        html += '<div class="vp-avatar" style="width:34px;height:34px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.8);">' + avatarDisplay + '</div>';
        html += '<span class="vp-name" style="color:#fff;font-weight:700;font-size:13px;">@' + escapeHtml(video.author) + '</span>';
        html += '</div></div>';
        
        // ============================================================
        // SIDE ACTIONS - RIGHT SIDE
        // ============================================================
        html += '<div style="position:absolute;right:12px;bottom:100px;display:flex;flex-direction:column;gap:16px;align-items:center;z-index:10;">';
        
        // Like
        html += '<button onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:' + (liked ? '#ef4444' : '#fff') + ';width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">' +
            (liked ? '❤️' : '🤍') + '<span style="font-size:10px;font-weight:600;">' + likeCount + '</span></button>';
        
        // Comment
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:#fff;width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">' +
            '💬<span style="font-size:10px;font-weight:600;">' + commentCount + '</span></button>';
        
        // Save
        html += '<button onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:' + (bookmarked ? '#f59e0b' : '#fff') + ';width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">' +
            '🔖<span style="font-size:10px;">Save</span></button>';
        
        // Download
        html += '<button onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:#fff;width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">' +
            '⬇️<span style="font-size:10px;">DL</span></button>';
        
        // Delete (owner)
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" ' +
                'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:#ef4444;width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">' +
                '🗑️<span style="font-size:10px;">Del</span></button>';
        }
        
        html += '</div>';
        
        // Description at bottom
        if (video.text) {
            html += '<div style="position:absolute;bottom:60px;left:16px;right:80px;z-index:5;color:#fff;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,0.9);">' + escapeHtml(video.text) + '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Autoplay videos when visible
    setupVideoAutoplay(container);
}

// ============================================================
// VIDEO AUTOPLAY
// ============================================================
function setupVideoAutoplay(container) {
    var videos = container.querySelectorAll('video');
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.muted = false;
                entry.target.volume = 1.0;
                entry.target.play().catch(function() {
                    entry.target.muted = true;
                    entry.target.play().catch(function() {});
                });
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.6 });
    
    videos.forEach(function(video) {
        observer.observe(video);
    });
}

// ============================================================
// TOGGLE VIDEO PLAY/PAUSE
// ============================================================
function toggleVideoPlay(videoElement) {
    if (videoElement.paused) {
        videoElement.muted = false;
        videoElement.play().catch(function() {
            videoElement.muted = true;
            videoElement.play().catch(function() {});
        });
    } else {
        videoElement.pause();
    }
}

// ============================================================
// UPLOAD VIDEO
// ============================================================
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
    
    toast('📹 Uploading video...');
    
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
        
        var newRef = firebase.database().ref('videos').push();
        newRef.set(videoData).then(function() {
            videoData.id = newRef.key;
            S.videoData.unshift(videoData);
            renderVideos();
            toast('📹 Video uploaded!');
        }).catch(function(error) {
            console.error('Upload error:', error);
            toast('Failed to upload');
        });
    };
    reader.onerror = function() {
        toast('Error reading file');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

// ============================================================
// LIKE VIDEO
// ============================================================
function likeVideo(videoId) {
    if (!S.username) return;
    
    var likeRef = firebase.database().ref('videos/' + videoId + '/likes');
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        return likeRef.set(likes);
    }).then(function() {
        var video = S.videoData.find(function(v) { return v.id === videoId; });
        if (video) {
            if (!video.likes) video.likes = [];
            var idx = video.likes.indexOf(S.username);
            if (idx > -1) video.likes.splice(idx, 1);
            else video.likes.push(S.username);
        }
        renderVideos();
    });
}

// ============================================================
// COMMENT ON VIDEO
// ============================================================
function commentVideo(videoId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            var commentRef = firebase.database().ref('videos/' + videoId + '/comments');
            commentRef.once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                return commentRef.set(comments);
            }).then(function() {
                var video = S.videoData.find(function(v) { return v.id === videoId; });
                if (video) {
                    if (!video.comments) video.comments = [];
                    video.comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                }
                renderVideos();
                toast('Comment added!');
            });
        }
    });
}

// ============================================================
// DELETE VIDEO
// ============================================================
function deleteVideo(videoId) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Video',
        subtitle: 'Are you sure?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            firebase.database().ref('videos/' + videoId).remove().then(function() {
                S.videoData = S.videoData.filter(function(v) { return v.id !== videoId; });
                renderVideos();
                toast('Video deleted');
            });
        }
    });
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================
function downloadVideo(videoId) {
    var video = S.videoData.find(function(v) { return v.id === videoId; });
    if (!video || !video.url) { toast('Not available'); return; }
    
    if (video.url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = video.url;
        a.download = 'winchu-video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('⬇️ Downloading...');
    }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.loadVideos = loadVideos;
window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.commentVideo = commentVideo;
window.deleteVideo = deleteVideo;
window.downloadVideo = downloadVideo;
window.toggleVideoPlay = toggleVideoPlay;
window.setupVideoAutoplay = setupVideoAutoplay;

console.log('🎬 Videos module loaded - Flexible containers, poster bubble on top');