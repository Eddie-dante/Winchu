// Videos Module - Fixed likes and comments with transactions

var videosListener = null;
var processedVideoIds = {};

function loadVideos() {
    if (videosListener) { 
        videosListener.off(); 
        videosListener = null; 
    }
    S.videoData = []; 
    processedVideoIds = {};
    
    var ref = firebase.database().ref('videos');
    
    ref.orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
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
        }
        renderVideos();
    });
    
    ref.on('child_added', function(snapshot) {
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
}

function renderVideos() {
    var container = document.getElementById('videoFeed'); 
    if (!container) return;
    if (!S.username) { 
        container.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Please log in</p>'; 
        return; 
    }
    var videos = S.videoData || [];
    if (videos.length === 0) { 
        container.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;"><div><i class="fas fa-play-circle" style="font-size:4rem;opacity:0.4;"></i><p style="font-size:1.2rem;opacity:0.6;">No videos yet</p></div></div>'; 
        return; 
    }
    
    var html = '';
    videos.forEach(function(video) {
        if (!video || !video.author) return;
        if (!Array.isArray(video.likes)) video.likes = [];
        if (!Array.isArray(video.comments)) video.comments = [];
        
        var liked = video.likes.indexOf(S.username) > -1;
        var likeCount = video.likes.length;
        var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        var avatarInitial = video.author.charAt(0).toUpperCase();
        var avatarColor = getColor(video.author);
        
        html += '<div class="video-slide" style="background:#000;">';
        if (video.url) html += '<video src="' + video.url + '" loop playsinline controls style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;" onclick="toggleVideoPlay(this)"></video>';
        else html += '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;">🎬 Win Moment</div>';
        
        html += '<div class="video-overlay">';
        html += '<div class="video-info"><div class="username" style="cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">@' + escapeHtml(video.author) + ' <i class="fas fa-check-circle" style="color:#ffd700;font-size:0.7rem;"></i></div>';
        if (video.text) html += '<div class="caption">' + escapeHtml(video.text) + '</div>';
        html += '<div class="hashtags" style="color:#ffd700;font-size:0.75rem;">#Winchu</div></div>';
        
        html += '<div class="video-actions">';
        html += '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-heart" style="font-size:1.8rem;color:' + (liked ? '#ff2d55' : '#fff') + ';"></i><span style="color:#fff;font-size:0.7rem;" id="videoLikeCount-' + video.id + '">' + likeCount + '</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-comment" style="font-size:1.8rem;color:#fff;"></i><span style="color:#fff;font-size:0.7rem;">' + commentCount + '</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-bookmark" style="font-size:1.8rem;color:#fff;"></i><span style="color:#fff;font-size:0.7rem;">Save</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-download" style="font-size:1.8rem;color:#fff;"></i><span style="color:#fff;font-size:0.7rem;">DL</span></button>';
        if (canDelete) html += '<button class="action-btn" onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-trash" style="font-size:1.8rem;color:#ef4444;"></i><span style="color:#ef4444;font-size:0.7rem;">Del</span></button>';
        html += '<div class="profile-pic-small" style="width:42px;height:42px;border-radius:50%;border:2px solid #fff;background:' + avatarColor + ';display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">' + avatarInitial + '</div>';
        html += '</div></div></div>';
    });
    container.innerHTML = html;
    setupVideoAutoplay(container);
}

function setupVideoAutoplay(container) {
    var videos = container.querySelectorAll('video');
    var observer = new IntersectionObserver(function(entries) { 
        entries.forEach(function(entry) { 
            if (entry.isIntersecting) { 
                entry.target.muted = false; 
                entry.target.play().catch(function() { 
                    entry.target.muted = true; 
                    entry.target.play().catch(function() {}); 
                }); 
            } else { 
                entry.target.pause(); 
            } 
        }); 
    }, { threshold: 0.6 });
    videos.forEach(function(v) { observer.observe(v); });
}

function toggleVideoPlay(el) { 
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

function handleVideoUpload(event) {
    var file = event.target.files[0]; 
    if (!file) return;
    if (!file.type.startsWith('video/')) { 
        toast('Select a video'); 
        event.target.value = ''; 
        return; 
    }
    if (file.size > 50*1024*1024) { 
        toast('Max 50MB'); 
        event.target.value = ''; 
        return; 
    }
    toast('Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) {
        firebase.database().ref('videos').push({ 
            author: S.username, 
            avatar: S.avatar || null, 
            text: '', 
            url: e.target.result, 
            time: new Date().toISOString(), 
            likes: [], 
            comments: [] 
        });
        toast('Uploaded!');
    };
    reader.readAsDataURL(file);
}

// ============================================================
// FIXED LIKE VIDEO - Uses transaction for atomic updates
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
            console.error('Video like error:', error);
            toast('Error processing like');
        } else if (committed) {
            // Update local state
            var video = S.videoData.find(function(v) { return v.id === videoId; });
            if (video) {
                var likes = snapshot.val() || [];
                if (!Array.isArray(likes)) likes = [];
                video.likes = likes;
                renderVideos();
                
                // Update like count in video feed
                var likeCountEl = document.getElementById('videoLikeCount-' + videoId);
                if (likeCountEl) {
                    likeCountEl.textContent = likes.length;
                }
            }
        }
    });
}

// ============================================================
// FIXED COMMENT VIDEO - Uses transaction
// ============================================================
function commentVideo(videoId) {
    if (!S.username) {
        toast('Please log in to comment');
        return;
    }
    
    showDialog({
        emoji: '💬',
        title: 'Comment on Video',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(function(result) {
        if (result && result.trim()) {
            var comment = {
                username: S.username,
                text: result.trim(),
                time: new Date().toISOString()
            };
            
            var commentsRef = firebase.database().ref('videos/' + videoId + '/comments');
            
            commentsRef.transaction(function(currentComments) {
                if (currentComments === null) {
                    currentComments = [];
                }
                if (!Array.isArray(currentComments)) {
                    currentComments = [];
                }
                currentComments.push(comment);
                return currentComments;
                
            }, function(error, committed) {
                if (error) {
                    console.error('Video comment error:', error);
                    toast('Error posting comment');
                } else if (committed) {
                    toast('Comment added! 💬');
                }
            });
        }
    });
}

function deleteVideo(videoId) { 
    showDialog({ 
        emoji: '🗑️', 
        title: 'Delete', 
        confirmText: 'Delete', 
        danger: true 
    }).then(function(r) { 
        if (r !== null) { 
            firebase.database().ref('videos/' + videoId).remove(); 
            toast('Deleted'); 
        } 
    }); 
}

function downloadVideo(videoId) { 
    var v = S.videoData.find(function(x) { return x.id === videoId; }); 
    if (v && v.url && v.url.startsWith('data:')) { 
        var a = document.createElement('a'); 
        a.href = v.url; 
        a.download = 'video.mp4'; 
        a.click(); 
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
window.toggleVideoPlay = toggleVideoPlay;

console.log('🎬 Videos loaded - likes and comments fixed with transactions');