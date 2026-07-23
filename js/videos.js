// Videos Module - Adaptive containers, seeking, poster bubble, like count fix

var videosListener = null;

// ============================================================
// LOAD VIDEOS
// ============================================================
function loadVideos() {
    console.log('=== LOADING VIDEOS ===');
    
    if (videosListener) { videosListener.off(); videosListener = null; }
    S.videoData = [];
    
    var videosRef = firebase.database().ref('videos');
    
    videosRef.orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var video = data[key];
                if (video && video.author) {
                    video.id = key;
                    if (!video.likes) video.likes = [];
                    if (!video.comments) video.comments = [];
                    S.videoData.push(video);
                }
            });
            S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        renderVideos();
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
// RENDER VIDEOS - Adaptive to video size, poster bubble ABOVE like
// ============================================================
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in</p>';
        return;
    }
    
    var videos = S.videoData || [];
    
    if (videos.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">🎬</div><p>No videos yet.</p></div>';
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
            avatarDisplay = '<img src="' + video.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(video.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
        }
        
        // Video container - height adapts to video
        html += '<div style="position:relative;width:100%;background:#000;border-radius:12px;overflow:hidden;margin-bottom:16px;display:flex;align-items:center;justify-content:center;">';
        
        // Video element with controls for seeking
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline controls preload="metadata" ' +
                'style="width:100%;height:auto;max-height:70vh;object-fit:contain;display:block;background:#000;" ' +
                'onloadedmetadata="this.parentElement.style.height=this.videoHeight+\'px\'"></video>';
        }
        
        // POSTER BUBBLE - TOP LEFT (ABOVE like button)
        html += '<div style="position:absolute;top:16px;left:16px;z-index:20;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '<div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:8px 14px;border-radius:25px;border:1px solid rgba(255,255,255,0.25);cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.5);">';
        html += '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid #fff;flex-shrink:0;">' + avatarDisplay + '</div>';
        html += '<div><div style="color:#fff;font-weight:700;font-size:13px;">@' + escapeHtml(video.author) + '</div></div>';
        html += '</div></div>';
        
        // SIDE ACTIONS - RIGHT SIDE
        html += '<div style="position:absolute;right:12px;bottom:120px;display:flex;flex-direction:column;gap:18px;align-items:center;z-index:10;">';
        
        // Like button with live count
        html += '<button onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:' + (liked ? '#ef4444' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;' +
            'cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">' +
            (liked ? '❤️' : '🤍') +
            '<span style="font-size:11px;font-weight:700;">' + likeCount + '</span></button>';
        
        // Comment button
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;' +
            'cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">' +
            '💬<span style="font-size:11px;font-weight:700;">' + commentCount + '</span></button>';
        
        // Bookmark
        html += '<button onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" ' +
            'style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:' + (bookmarked ? '#f59e0b' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;' +
            'cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">' +
            '🔖<span style="font-size:10px;">Save</span></button>';
        
        // Download
        html += '<button onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;' +
            'cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">' +
            '⬇️<span style="font-size:10px;">DL</span></button>';
        
        // Delete
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" ' +
                'style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
                'color:#ef4444;width:50px;height:50px;border-radius:50%;font-size:22px;' +
                'cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">' +
                '🗑️<span style="font-size:10px;">Del</span></button>';
        }
        
        html += '</div>';
        
        // Description
        if (video.text) {
            html += '<div style="position:absolute;bottom:50px;left:16px;right:80px;z-index:5;color:#fff;font-size:13px;text-shadow:0 1px 3px rgba(0,0,0,0.9);">' + escapeHtml(video.text) + '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Setup autoplay
    setupVideoAutoplay(container);
    
    // Adjust container heights after videos load
    setTimeout(function() {
        var videoEls = container.querySelectorAll('video');
        videoEls.forEach(function(v) {
            if (v.videoHeight) {
                var parent = v.parentElement;
                if (parent && parent.classList.contains('tiktok-video') === false) {
                    parent.style.height = Math.min(v.videoHeight, window.innerHeight * 0.7) + 'px';
                }
            }
        });
    }, 500);
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
    }, { threshold: 0.5 });
    
    videos.forEach(function(video) {
        observer.observe(video);
    });
}

// ============================================================
// UPLOAD VIDEO
// ============================================================
function handleVideoUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast('Select a video file'); event.target.value = ''; return; }
    if (file.size > 50*1024*1024) { toast('Max 50MB'); event.target.value = ''; return; }
    
    toast('📹 Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) {
        var vd = { author: S.username, avatar: S.avatar || null, text: '', url: e.target.result, time: new Date().toISOString(), likes: [], comments: [] };
        var nr = firebase.database().ref('videos').push();
        nr.set(vd).then(function() { vd.id = nr.key; S.videoData.unshift(vd); renderVideos(); toast('Uploaded!'); });
    };
    reader.readAsDataURL(file);
}

// ============================================================
// LIKE VIDEO - Fixed to persist count
// ============================================================
function likeVideo(videoId) {
    if (!S.username) return;
    
    var likeRef = firebase.database().ref('videos/' + videoId + '/likes');
    
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        if (idx > -1) { likes.splice(idx, 1); } else { likes.push(S.username); }
        return likeRef.set(likes);
    }).then(function() {
        var video = S.videoData.find(function(v) { return v.id === videoId; });
        if (video) {
            if (!video.likes) video.likes = [];
            var idx = video.likes.indexOf(S.username);
            if (idx > -1) { video.likes.splice(idx, 1); } else { video.likes.push(S.username); }
        }
        renderVideos();
    }).catch(function(error) {
        console.error('Like error:', error);
    });
}

// ============================================================
// COMMENT VIDEO
// ============================================================
function commentVideo(videoId) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(result) {
        if (result && result.trim()) {
            var ref = firebase.database().ref('videos/' + videoId + '/comments');
            ref.once('value').then(function(s) {
                var c = s.val() || [];
                c.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                return ref.set(c);
            }).then(function() {
                var v = S.videoData.find(function(x) { return x.id === videoId; });
                if (v) { if (!v.comments) v.comments = []; v.comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() }); }
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
    showDialog({ emoji: '🗑️', title: 'Delete', confirmText: 'Delete', danger: true }).then(function(r) {
        if (r !== null) {
            firebase.database().ref('videos/' + videoId).remove();
            S.videoData = S.videoData.filter(function(v) { return v.id !== videoId; });
            renderVideos();
            toast('Deleted');
        }
    });
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================
function downloadVideo(videoId) {
    var v = S.videoData.find(function(x) { return x.id === videoId; });
    if (v && v.url && v.url.startsWith('data:')) {
        var a = document.createElement('a'); a.href = v.url; a.download = 'video.mp4'; a.click();
        toast('⬇️ Downloading...');
    }
}

window.loadVideos = loadVideos;
window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.commentVideo = commentVideo;
window.deleteVideo = deleteVideo;
window.downloadVideo = downloadVideo;

console.log('🎬 Videos module loaded - Fixed all issues');