// Videos Module - Complete with fixed video playback

var videosListener = null;
var processedVideoIds = {};
var currentVideoCommentId = null;
var videoLoadAttempts = 0;

// ============================================================
// LOAD VIDEOS
// ============================================================
function loadVideos() {
    console.log('🎬 Loading videos...');
    
    if (videosListener) { 
        videosListener.off(); 
        videosListener = null; 
    }
    S.videoData = []; 
    processedVideoIds = {};
    
    var ref = firebase.database().ref('videos');
    
    ref.orderByChild('time').limitToLast(50).once('value')
        .then(function(snapshot) {
            var data = snapshot.val();
            S.videoData = []; 
            processedVideoIds = {};
            
            if (data) {
                Object.keys(data).forEach(function(key) {
                    var video = data[key];
                    if (video && video.author && !processedVideoIds[key]) {
                        video.id = key;
                        if (!Array.isArray(video.likes)) video.likes = [];
                        if (!Array.isArray(video.comments)) video.comments = [];
                        processedVideoIds[key] = true;
                        S.videoData.push(video);
                    }
                });
                S.videoData.sort(function(a, b) { 
                    return new Date(b.time) - new Date(a.time); 
                });
                console.log('✅ Videos loaded:', S.videoData.length);
            } else {
                console.log('📹 No videos found');
            }
            
            renderVideos();
        })
        .catch(function(error) {
            console.error('❌ Error loading videos:', error);
            var container = document.getElementById('videoFeed');
            if (container) {
                container.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;flex-direction:column;padding:20px;">' +
                    '<i class="fas fa-exclamation-triangle" style="font-size:3rem;opacity:0.6;margin-bottom:20px;"></i>' +
                    '<p style="font-size:1.2rem;opacity:0.8;">Error loading videos</p>' +
                    '<p style="font-size:0.9rem;opacity:0.5;margin-top:10px;">' + error.message + '</p>' +
                    '<button onclick="loadVideos()" style="margin-top:20px;padding:10px 30px;background:#6366f1;color:#fff;border:none;border-radius:10px;cursor:pointer;">🔄 Retry</button>' +
                    '</div>';
            }
        });
    
    // Listen for new videos
    ref.orderByChild('time').limitToLast(50).on('child_added', function(snapshot) {
        var video = snapshot.val(); 
        var key = snapshot.key;
        if (!video || !video.author || processedVideoIds[key]) return;
        video.id = key;
        if (!Array.isArray(video.likes)) video.likes = [];
        if (!Array.isArray(video.comments)) video.comments = [];
        processedVideoIds[key] = true;
        
        if (!S.videoData.find(function(v) { return v.id === key; })) {
            S.videoData.unshift(video);
            if (S.videoData.length > 100) S.videoData.pop();
            renderVideos();
        }
    });
    
    ref.on('child_changed', function(snapshot) {
        var video = snapshot.val(); 
        if (!video) return; 
        video.id = snapshot.key;
        if (!Array.isArray(video.likes)) video.likes = [];
        if (!Array.isArray(video.comments)) video.comments = [];
        var idx = S.videoData.findIndex(function(v) { return v.id === video.id; });
        if (idx > -1) { 
            S.videoData[idx] = video; 
            renderVideos(); 
        }
    });
    
    ref.on('child_removed', function(snapshot) {
        delete processedVideoIds[snapshot.key];
        S.videoData = S.videoData.filter(function(v) { 
            return v.id !== snapshot.key; 
        });
        renderVideos();
    });
    
    videosListener = ref;
    console.log('🎬 Videos listener active');
}

// ============================================================
// RENDER VIDEOS - FIXED PLAYBACK
// ============================================================
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) {
        console.warn('⚠️ videoFeed container not found');
        return;
    }
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Please log in to see videos</p>';
        return;
    }
    
    var videos = S.videoData || [];
    
    if (videos.length === 0) {
        container.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;flex-direction:column;padding:20px;">' +
            '<i class="fas fa-play-circle" style="font-size:4rem;opacity:0.4;"></i>' +
            '<p style="font-size:1.2rem;opacity:0.6;margin-top:15px;">No videos yet</p>' +
            '<p style="font-size:0.9rem;opacity:0.4;margin-top:5px;">Upload your first video!</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    videos.forEach(function(video, index) {
        if (!video || !video.author) return;
        if (!Array.isArray(video.likes)) video.likes = [];
        if (!Array.isArray(video.comments)) video.comments = [];
        
        var liked = video.likes.indexOf(S.username) > -1;
        var likeCount = video.likes.length;
        var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        var avatarInitial = video.author.charAt(0).toUpperCase();
        var avatarColor = getColor(video.author);
        
        var videoSrc = video.url || '';
        
        html += '<div class="video-slide" style="background:#000;" data-video-id="' + video.id + '" data-index="' + index + '">';
        
        if (videoSrc) {
            html += '<video ' +
                'src="' + videoSrc + '" ' +
                'loop playsinline preload="metadata" ' +
                'style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;" ' +
                'onclick="toggleVideoPlay(this)" ' +
                'playsinline ' +
                'webkit-playsinline ' +
                'x5-playsinline ' +
                '></video>';
        } else {
            html += '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;background:#1a1a1a;flex-direction:column;">' +
                '<i class="fas fa-video" style="font-size:4rem;opacity:0.3;margin-bottom:15px;"></i>' +
                '<span style="opacity:0.5;">Video unavailable</span>' +
                '</div>';
        }
        
        html += '<div class="video-overlay">';
        html += '<div class="video-info">';
        html += '<div class="username" style="cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '@' + escapeHtml(video.author) + ' <i class="fas fa-check-circle" style="color:#ffd700;font-size:0.7rem;"></i>';
        html += '</div>';
        if (video.text) html += '<div class="caption">' + escapeHtml(video.text) + '</div>';
        html += '<div class="hashtags" style="color:#ffd700;font-size:0.75rem;">#Winchu</div>';
        html += '</div>';
        
        html += '<div class="video-actions">';
        html += '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-heart" style="font-size:1.8rem;color:' + (liked ? '#ff2d55' : '#fff') + ';"></i>';
        html += '<span style="color:#fff;font-size:0.7rem;" id="videoLikeCount-' + video.id + '">' + likeCount + '</span>';
        html += '</button>';
        
        html += '<button class="action-btn" onclick="event.stopPropagation();showVideoComments(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-comment" style="font-size:1.8rem;color:#fff;"></i>';
        html += '<span style="color:#fff;font-size:0.7rem;">' + commentCount + '</span>';
        html += '</button>';
        
        html += '<button class="action-btn" onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" style="background:none;border:none;cursor:pointer;">';
        html += '<i class="fas fa-bookmark" style="font-size:1.8rem;color:#fff;"></i>';
        html += '<span style="color:#fff;font-size:0.7rem;">Save</span>';
        html += '</button>';
        
        if (videoSrc && videoSrc.startsWith('data:')) {
            html += '<button class="action-btn" onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
            html += '<i class="fas fa-download" style="font-size:1.8rem;color:#fff;"></i>';
            html += '<span style="color:#fff;font-size:0.7rem;">DL</span>';
            html += '</button>';
        }
        
        if (canDelete) {
            html += '<button class="action-btn" onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;">';
            html += '<i class="fas fa-trash" style="font-size:1.8rem;color:#ef4444;"></i>';
            html += '<span style="color:#ef4444;font-size:0.7rem;">Del</span>';
            html += '</button>';
        }
        
        html += '<div class="profile-pic-small" style="width:42px;height:42px;border-radius:50%;border:2px solid #fff;background:' + avatarColor + ';display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">' + avatarInitial + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    setTimeout(function() {
        setupVideoAutoplay(container);
    }, 500);
}

// ============================================================
// VIDEO AUTOPLAY - FIXED
// ============================================================
function setupVideoAutoplay(container) {
    if (!container) {
        container = document.getElementById('videoFeed');
    }
    if (!container) return;
    
    var videos = container.querySelectorAll('video');
    if (videos.length === 0) return;
    
    if (videos.length > 0) {
        var firstVideo = videos[0];
        firstVideo.muted = true;
        firstVideo.play().catch(function() {});
    }
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var video = entry.target;
            if (entry.isIntersecting) {
                video.muted = false;
                video.play().catch(function() {
                    video.muted = true;
                    video.play().catch(function() {});
                });
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 });
    
    videos.forEach(function(v) {
        observer.observe(v);
    });
}

// ============================================================
// TOGGLE VIDEO PLAY
// ============================================================
function toggleVideoPlay(el) {
    if (!el) return;
    if (el.paused) {
        el.muted = false;
        el.play().catch(function() {
            el.muted = true;
            el.play().catch(function() {});
        });
    } else {
        el.pause();
    }
}

// ============================================================
// HANDLE VIDEO UPLOAD
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
        toast('Max file size: 50MB');
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
        
        firebase.database().ref('videos').push(videoData)
            .then(function() {
                toast('Video uploaded! 🎬');
                loadVideos();
            })
            .catch(function(error) {
                console.error('Upload error:', error);
                toast('Upload failed: ' + error.message);
            });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ============================================================
// LIKE VIDEO
// ============================================================
function likeVideo(videoId) {
    if (!S.username) {
        toast('Please log in to like');
        return;
    }
    
    var videoRef = firebase.database().ref('videos/' + videoId + '/likes');
    
    videoRef.transaction(function(currentLikes) {
        if (currentLikes === null) {
            currentLikes = [];
        }
        if (!Array.isArray(currentLikes)) {
            currentLikes = [];
        }
        
        var index = currentLikes.indexOf(S.username);
        
        if (index !== -1) {
            currentLikes.splice(index, 1);
        } else {
            currentLikes.push(S.username);
        }
        
        return currentLikes;
        
    }, function(error, committed, snapshot) {
        if (error) {
            console.error('Like error:', error);
            toast('Error processing like');
        } else if (committed) {
            var video = S.videoData.find(function(v) { return v.id === videoId; });
            if (video) {
                var likes = snapshot.val() || [];
                if (!Array.isArray(likes)) likes = [];
                video.likes = likes;
                renderVideos();
            }
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
        subtitle: 'Are you sure you want to delete this video?',
        confirmText: 'Delete',
        danger: true
    }).then(function(r) {
        if (r !== null) {
            firebase.database().ref('videos/' + videoId).remove()
                .then(function() {
                    toast('Video deleted');
                    S.videoData = S.videoData.filter(function(v) {
                        return v.id !== videoId;
                    });
                    renderVideos();
                })
                .catch(function(error) {
                    toast('Error deleting video');
                    console.error(error);
                });
        }
    });
}

// ============================================================
// EXPOSE
// ============================================================
window.loadVideos = loadVideos;
window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.deleteVideo = deleteVideo;
window.toggleVideoPlay = toggleVideoPlay;

console.log('🎬 Videos module loaded (fixed)');