// Videos Module - TikTok-style Winchu Video Feed for Phone and Desktop

var videosListener = null;

// ============================================================
// LOAD VIDEOS FROM FIREBASE
// ============================================================
function loadVideos() {
    console.log('=== LOADING VIDEOS ===');
    
    if (videosListener) { videosListener.off(); videosListener = null; }
    S.videoData = [];
    
    var videosRef = getRef('videos');
    
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
// RENDER VIDEOS - TikTok Style for All Devices
// ============================================================
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Please log in to see videos.</p>';
        return;
    }
    
    var videos = S.videoData || [];
    
    if (videos.length === 0) {
        container.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:40px;">' +
            '<i class="fas fa-play-circle" style="font-size:4rem;margin-bottom:15px;opacity:0.4;"></i>' +
            '<p style="font-size:1.2rem;opacity:0.6;">No videos yet</p>' +
            '<p style="font-size:0.8rem;opacity:0.4;margin-top:8px;">Tap Upload to share your first win!</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    var isDesktop = window.innerWidth >= 768;
    var gradients = [
        'linear-gradient(145deg, #0f0c29, #302b63, #24243e)',
        'linear-gradient(145deg, #1a1a2e, #16213e, #0f3460)',
        'linear-gradient(145deg, #2d1b3d, #1b1b2f, #16213e)',
        'linear-gradient(145deg, #1e3c32, #0f2f2a, #0a1f1b)',
        'linear-gradient(145deg, #1a1a2e, #16213e, #0f3460)',
        'linear-gradient(145deg, #2d1b3d, #1b1b2f, #16213e)'
    ];
    
    videos.forEach(function(video, index) {
        if (!video || !video.author) return;
        
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        var liked = video.likes.indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === video.id; });
        var likeCount = video.likes.length;
        var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        
        var bgGradient = gradients[index % gradients.length];
        var avatarColor = getColor(video.author);
        var avatarInitial = video.author.charAt(0).toUpperCase();
        
        // Desktop uses smaller height, phone uses full height
        var slideHeight = isDesktop ? 'calc(100vh - 200px)' : '100%';
        
        html += '<div class="video-slide" style="background:' + bgGradient + ';height:' + slideHeight + ';">';
        
        // Video element
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline preload="metadata" ' +
                'style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;cursor:pointer;" ' +
                'onclick="toggleVideoPlay(this)"></video>';
        } else {
            html += '<div class="video-placeholder" style="background:' + bgGradient + ';">' +
                '<i class="fas fa-play-circle" style="font-size:4rem;margin-bottom:15px;opacity:0.6;color:#fff;"></i>' +
                '<span style="color:#fff;font-size:1.2rem;">🎉 Win Moment</span>' +
                '<span class="win-tag" style="background:rgba(255,215,0,0.2);padding:6px 18px;border-radius:30px;font-size:0.8rem;border:1px solid rgba(255,215,0,0.3);margin-top:10px;color:#ffd700;letter-spacing:1px;">#Winchu</span>' +
                '</div>';
        }
        
        // Overlay
        html += '<div class="video-overlay">';
        
        // Left - User info
        html += '<div class="video-info">';
        html += '<div class="username" style="cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '@' + escapeHtml(video.author);
        html += ' <i class="fas fa-check-circle" style="color:#ffd700;font-size:0.7rem;"></i>';
        html += '</div>';
        if (video.text) {
            html += '<div class="caption">' + escapeHtml(video.text) + '</div>';
        }
        html += '<div class="hashtags" style="color:#ffd700;font-size:0.75rem;">#Winchu #DailyWins</div>';
        html += '</div>';
        
        // Right - Actions
        html += '<div class="video-actions">';
        
        // Like button
        html += '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-heart" style="font-size:' + (isDesktop ? '2rem' : '1.8rem') + ';color:' + (liked ? '#ff2d55' : '#fff') + ';text-shadow:0 2px 8px rgba(0,0,0,0.5);"></i>';
        html += '<span style="color:#fff;font-size:' + (isDesktop ? '0.75rem' : '0.7rem') + ';">' + formatNumber(likeCount) + '</span>';
        html += '</button>';
        
        // Comment button
        html += '<button class="action-btn" onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-comment" style="font-size:' + (isDesktop ? '2rem' : '1.8rem') + ';color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.5);"></i>';
        html += '<span style="color:#fff;font-size:' + (isDesktop ? '0.75rem' : '0.7rem') + ';">' + commentCount + '</span>';
        html += '</button>';
        
        // Share button
        html += '<button class="action-btn" onclick="event.stopPropagation();shareVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-share" style="font-size:' + (isDesktop ? '2rem' : '1.8rem') + ';color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.5);"></i>';
        html += '<span style="color:#fff;font-size:' + (isDesktop ? '0.75rem' : '0.7rem') + ';">Share</span>';
        html += '</button>';
        
        // Bookmark button
        html += '<button class="action-btn" onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-bookmark" style="font-size:' + (isDesktop ? '2rem' : '1.8rem') + ';color:' + (bookmarked ? '#ffd700' : '#fff') + ';text-shadow:0 2px 8px rgba(0,0,0,0.5);"></i>';
        html += '<span style="color:#fff;font-size:' + (isDesktop ? '0.75rem' : '0.7rem') + ';">Save</span>';
        html += '</button>';
        
        // Delete button (owner only)
        if (canDelete) {
            html += '<button class="action-btn" onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
            html += '<i class="fas fa-trash" style="font-size:' + (isDesktop ? '2rem' : '1.8rem') + ';color:#ef4444;text-shadow:0 2px 8px rgba(0,0,0,0.5);"></i>';
            html += '<span style="color:#ef4444;font-size:' + (isDesktop ? '0.75rem' : '0.7rem') + ';">Del</span>';
            html += '</button>';
        }
        
        // Profile pic
        html += '<div class="profile-pic-small" style="width:' + (isDesktop ? '48px' : '42px') + ';height:' + (isDesktop ? '48px' : '42px') + ';border-radius:50%;border:2px solid #fff;background:' + avatarColor + ';display:flex;align-items:center;justify-content:center;font-size:' + (isDesktop ? '1.4rem' : '1.2rem') + ';font-weight:bold;color:#fff;cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">' + avatarInitial + '</div>';
        
        html += '</div>'; // end video-actions
        html += '</div>'; // end video-overlay
        html += '</div>'; // end video-slide
    });
    
    container.innerHTML = html;
    
    // Setup autoplay
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
        videoElement.volume = 1.0;
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
    if (!file.type.startsWith('video/')) { toast('Select a video file'); event.target.value = ''; return; }
    if (file.size > 50 * 1024 * 1024) { toast('Max 50MB'); event.target.value = ''; return; }
    
    toast('📹 Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) {
        var vd = { author: S.username, avatar: S.avatar || null, text: '', url: e.target.result, time: new Date().toISOString(), likes: [], comments: [] };
        var nr = getRef('videos').push();
        nr.set(vd).then(function() { vd.id = nr.key; S.videoData.unshift(vd); renderVideos(); toast('Uploaded!'); });
    };
    reader.readAsDataURL(file);
}

// ============================================================
// LIKE VIDEO
// ============================================================
function likeVideo(videoId) {
    if (!S.username) return;
    
    var likeRef = getRef('videos/' + videoId + '/likes');
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
    });
}

// ============================================================
// COMMENT VIDEO
// ============================================================
function commentVideo(videoId) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(result) {
        if (result && result.trim()) {
            var ref = getRef('videos/' + videoId + '/comments');
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
            getRef('videos/' + videoId).remove();
            S.videoData = S.videoData.filter(function(v) { return v.id !== videoId; });
            renderVideos();
            toast('Deleted');
        }
    });
}

// ============================================================
// SHARE VIDEO
// ============================================================
function shareVideo(videoId) {
    var video = S.videoData.find(function(v) { return v.id === videoId; });
    if (!video) { toast('Video not found'); return; }
    
    if (navigator.share) {
        navigator.share({
            title: 'Winchu Video by @' + video.author,
            text: video.text || 'Check out this Winchu video!',
            url: window.location.href
        }).catch(function() {});
    } else {
        // Fallback: copy link
        var dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        toast('📋 Link copied!');
    }
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================
function downloadVideo(videoId) {
    var v = S.videoData.find(function(x) { return x.id === videoId; });
    if (v && v.url && v.url.startsWith('data:')) {
        var a = document.createElement('a'); a.href = v.url; a.download = 'winchu-video.mp4'; a.click();
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
window.shareVideo = shareVideo;
window.toggleVideoPlay = toggleVideoPlay;
window.setupVideoAutoplay = setupVideoAutoplay;

console.log('🎬 Winchu Videos module loaded - TikTok Style for Phone & Desktop');