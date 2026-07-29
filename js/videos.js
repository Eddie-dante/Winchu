// Videos Module - Complete with comments

var videosListener = null;
var processedVideoIds = {};
var currentVideoCommentId = null;
var videoLoadAttempts = 0;

// ============================================================
// LOAD VIDEOS - FIXED
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
    
    // Load videos (increased limit for better UX)
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
            
            // Force render
            renderVideos();
        })
        .catch(function(error) {
            console.error('❌ Error loading videos:', error);
            // Show error in feed
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
    
    // Set up listener reference for cleanup
    videosListener = ref;
    
    console.log('🎬 Videos listener active');
}

// ============================================================
// RENDER VIDEOS - FIXED
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
        
        // Video URL or placeholder
        var videoSrc = video.url || '';
        var isDataUrl = videoSrc && videoSrc.startsWith('data:');
        
        html += '<div class="video-slide" style="background:#000;" data-video-id="' + video.id + '" data-index="' + index + '">';
        
        if (videoSrc) {
            html += '<video ' +
                'src="' + videoSrc + '" ' +
                'loop playsinline preload="metadata" ' +
                'style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;" ' +
                'onclick="toggleVideoPlay(this)" ' +
                'poster="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%231a1a1a\'/%3E%3C/svg%3E" ' +
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
        
        if (videoSrc && isDataUrl) {
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
    
    // Auto-play videos in view
    setTimeout(setupVideoAutoplay, 500);
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
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var video = entry.target;
                // Play video when visible
                video.play().catch(function() {
                    // Autoplay may be blocked, try with muted
                    video.muted = true;
                    video.play().catch(function() {});
                });
            } else {
                // Pause when not visible
                var video = entry.target;
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
                loadVideos(); // Reload videos
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
// SHOW VIDEO COMMENTS
// ============================================================
function showVideoComments(videoId) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    var video = S.videoData.find(function(v) { return v.id === videoId; });
    if (!video) {
        toast('Video not found');
        return;
    }
    
    if (!Array.isArray(video.comments)) {
        video.comments = [];
    }
    
    currentVideoCommentId = videoId;
    
    var commentsHTML = '<div style="max-height:300px;overflow-y:auto;margin-bottom:10px;">';
    
    if (video.comments.length === 0) {
        commentsHTML += '<p style="color:#94a3b8;text-align:center;padding:20px;">No comments yet. Be the first! 💬</p>';
    } else {
        var sortedComments = video.comments.slice().sort(function(a, b) {
            return new Date(b.time) - new Date(a.time);
        });
        
        sortedComments.forEach(function(comment) {
            var timeAgo = timeSince(new Date(comment.time));
            var color = getColor(comment.username);
            
            commentsHTML += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">';
            commentsHTML += '<div style="width:32px;height:32px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0;cursor:pointer;" onclick="viewUserProfile(\'' + comment.username + '\')">' + comment.username.charAt(0).toUpperCase() + '</div>';
            commentsHTML += '<div style="flex:1;min-width:0;">';
            commentsHTML += '<div style="font-weight:600;font-size:12px;cursor:pointer;" onclick="viewUserProfile(\'' + comment.username + '\')">@' + escapeHtml(comment.username) + '</div>';
            commentsHTML += '<div style="font-size:12px;word-wrap:break-word;">' + escapeHtml(comment.text) + '</div>';
            commentsHTML += '<div style="font-size:9px;color:#94a3b8;margin-top:2px;">' + timeAgo + '</div>';
            commentsHTML += '</div>';
            
            if (comment.username === S.username) {
                commentsHTML += '<button class="btn-sm btn-danger" onclick="deleteVideoComment(\'' + videoId + '\', \'' + comment.time + '\')" style="font-size:8px;padding:2px 6px;">✕</button>';
            }
            
            commentsHTML += '</div>';
        });
    }
    
    commentsHTML += '</div>';
    
    commentsHTML += '<div style="display:flex;gap:6px;align-items:center;">';
    commentsHTML += '<input type="text" id="videoCommentInput" placeholder="Write a comment..." style="flex:1;padding:8px 12px;border:1px solid rgba(0,0,0,0.1);border-radius:20px;font-size:13px;outline:none;" onkeypress="if(event.key===\'Enter\')postVideoComment()" />';
    commentsHTML += '<button class="btn-sm btn-primary" onclick="postVideoComment()" style="padding:8px 16px;">Post</button>';
    commentsHTML += '</div>';
    
    showDialog({
        emoji: '💬',
        title: 'Comments on Video',
        htmlSubtitle: commentsHTML,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

// ============================================================
// POST VIDEO COMMENT
// ============================================================
function postVideoComment() {
    if (!S.username) {
        toast('Please log in to comment');
        return;
    }
    
    var input = document.getElementById('videoCommentInput');
    if (!input) {
        input = document.querySelector('#videoCommentInput');
    }
    
    if (!input) {
        toast('Comment input not found');
        return;
    }
    
    var text = input.value.trim();
    if (!text) {
        toast('Please write a comment');
        return;
    }
    
    if (!currentVideoCommentId) {
        toast('No video selected');
        return;
    }
    
    var comment = {
        username: S.username,
        text: text,
        time: new Date().toISOString()
    };
    
    var commentsRef = firebase.database().ref('videos/' + currentVideoCommentId + '/comments');
    
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
            console.error('Comment error:', error);
            toast('Error posting comment');
        } else if (committed) {
            input.value = '';
            toast('Comment added! 💬');
            
            var video = S.videoData.find(function(v) { return v.id === currentVideoCommentId; });
            if (video) {
                if (!Array.isArray(video.comments)) {
                    video.comments = [];
                }
                video.comments.push(comment);
                renderVideos();
                showVideoComments(currentVideoCommentId);
            }
        }
    });
}

// ============================================================
// DELETE VIDEO COMMENT
// ============================================================
function deleteVideoComment(videoId, commentTime) {
    if (!S.username) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Comment',
        subtitle: 'Remove this comment?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            var video = S.videoData.find(function(v) { return v.id === videoId; });
            if (!video) return;
            
            if (!Array.isArray(video.comments)) {
                video.comments = [];
            }
            
            video.comments = video.comments.filter(function(c) {
                return c.time !== commentTime;
            });
            
            firebase.database().ref('videos/' + videoId + '/comments').set(video.comments)
                .then(function() {
                    toast('Comment deleted');
                    renderVideos();
                    if (currentVideoCommentId === videoId) {
                        showVideoComments(videoId);
                    }
                })
                .catch(function(error) {
                    console.error('Error deleting comment:', error);
                    toast('Error deleting comment');
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
// DOWNLOAD VIDEO
// ============================================================
function downloadVideo(videoId) {
    var v = S.videoData.find(function(x) { return x.id === videoId; });
    if (v && v.url && v.url.startsWith('data:')) {
        var a = document.createElement('a');
        a.href = v.url;
        a.download = 'winchu-video-' + Date.now() + '.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('⬇️ Downloading...');
    } else {
        toast('Video not available for download');
    }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.loadVideos = loadVideos;
window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.showVideoComments = showVideoComments;
window.postVideoComment = postVideoComment;
window.deleteVideoComment = deleteVideoComment;
window.deleteVideo = deleteVideo;
window.downloadVideo = downloadVideo;
window.toggleVideoPlay = toggleVideoPlay;

console.log('🎬 Videos module loaded (fixed)');