// Videos Module - Complete with adaptive video sizing, poster bubble on top, like/comment counts

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
    
    var videosRef = db.ref('videos');
    
    // Load ALL existing videos once
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
                    // Ensure likes and comments are arrays
                    if (!video.likes) video.likes = [];
                    if (!video.comments) video.comments = [];
                    S.videoData.push(video);
                }
            });
            
            // Sort by newest first
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.videoData.length + ' videos');
        renderVideos();
    }).catch(function(error) {
        console.error('Error loading videos:', error);
    });
    
    // Listen for new videos in real-time
    videosListener = videosRef;
    
    videosListener.on('child_added', function(snapshot) {
        var video = snapshot.val();
        if (!video || !video.author) return;
        
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        var existing = S.videoData.find(function(v) {
            return v.id === video.id;
        });
        
        if (!existing) {
            console.log('New video detected:', video.id);
            S.videoData.unshift(video);
            
            if (S.videoData.length > 100) {
                S.videoData = S.videoData.slice(0, 100);
            }
            
            renderVideos();
        }
    });
    
    videosListener.on('child_changed', function(snapshot) {
        var video = snapshot.val();
        if (!video) return;
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        var idx = S.videoData.findIndex(function(v) {
            return v.id === video.id;
        });
        
        if (idx > -1) {
            S.videoData[idx] = video;
            renderVideos();
        }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) {
            return v.id !== snapshot.key;
        });
        renderVideos();
    });
    
    console.log('🎬 Videos listener active');
}

// ============================================================
// RENDER VIDEOS - Full screen adaptive, poster bubble on top
// ============================================================
function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) {
        console.log('Video feed container not found');
        return;
    }
    
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
        
        // Ensure arrays exist
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        var liked = video.likes.indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === video.id; });
        var likeCount = video.likes.length;
        var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        
        // Avatar for poster bubble
        var avatarDisplay = '';
        if (video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + video.avatar + '" alt="' + video.author + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(video.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
        }
        
        // Video container - adapts to screen
        html += '<div style="position:relative;width:100%;height:calc(100vh - 220px);min-height:450px;background:#000;overflow:hidden;scroll-snap-align:start;margin-bottom:4px;">';
        
        // Video element - fills container
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline preload="metadata" ' +
                'style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer;" ' +
                'onclick="toggleVideoPlay(this)"></video>';
        }
        
        // ============================================================
        // POSTER BUBBLE - TOP LEFT CORNER (above everything)
        // ============================================================
        html += '<div style="position:absolute;top:20px;left:16px;z-index:20;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:8px 14px;border-radius:25px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.4);">';
        html += '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.9);flex-shrink:0;">' + avatarDisplay + '</div>';
        html += '<div>';
        html += '<div style="color:#fff;font-weight:700;font-size:14px;line-height:1.2;">@' + escapeHtml(video.author) + '</div>';
        html += '<div style="color:rgba(255,255,255,0.7);font-size:10px;">' + timeSince(new Date(video.time)) + '</div>';
        html += '</div>';
        html += '</div></div>';
        
        // ============================================================
        // SIDE ACTION BUTTONS - RIGHT SIDE
        // ============================================================
        html += '<div style="position:absolute;right:12px;bottom:130px;display:flex;flex-direction:column;gap:16px;align-items:center;z-index:20;">';
        
        // Like button with count
        html += '<button onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:' + (liked ? '#ef4444' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;">' +
            (liked ? '❤️' : '🤍') +
            '<span style="font-size:10px;font-weight:700;">' + likeCount + '</span>' +
            '</button>';
        
        // Comment button with count
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;">' +
            '💬' +
            '<span style="font-size:10px;font-weight:700;">' + commentCount + '</span>' +
            '</button>';
        
        // Bookmark button
        html += '<button onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:' + (bookmarked ? '#f59e0b' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;">' +
            '🔖' +
            '<span style="font-size:10px;font-weight:700;">Save</span>' +
            '</button>';
        
        // Download button
        html += '<button onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" ' +
            'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
            'color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;">' +
            '⬇️' +
            '<span style="font-size:10px;font-weight:700;">DL</span>' +
            '</button>';
        
        // Delete button (owner only)
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" ' +
                'style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);' +
                'color:#ef4444;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;' +
                'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;">' +
                '🗑️' +
                '<span style="font-size:10px;font-weight:700;">Del</span>' +
                '</button>';
        }
        
        html += '</div>';
        
        // Description text at bottom
        if (video.text) {
            html += '<div style="position:absolute;bottom:70px;left:16px;right:80px;z-index:15;color:#fff;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,0.9);line-height:1.4;word-wrap:break-word;">' + escapeHtml(video.text) + '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Setup autoplay with Intersection Observer
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
                    // If unmuted fails, try muted
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
    
    console.log('Video upload started:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
        toast('Please select a valid video file (MP4, WebM, MOV)');
        event.target.value = '';
        return;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        toast('Video is too large. Maximum size is 50MB.');
        event.target.value = '';
        return;
    }
    
    toast('📹 Uploading video... This may take a moment.');
    
    var reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('Video file loaded, size:', e.target.result.length);
        
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
        var newRef = db.ref('videos').push();
        
        newRef.set(videoData).then(function() {
            console.log('Video saved with ID:', newRef.key);
            
            // Add to local state immediately
            videoData.id = newRef.key;
            S.videoData.unshift(videoData);
            
            renderVideos();
            toast('📹 Video uploaded successfully!');
        }).catch(function(error) {
            console.error('Video upload error:', error);
            toast('Failed to upload video. Please try again.');
        });
    };
    
    reader.onerror = function() {
        console.error('FileReader error');
        toast('Error reading video file. Please try again.');
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

// ============================================================
// LIKE VIDEO - Fixed to persist
// ============================================================
function likeVideo(videoId) {
    if (!S.username) {
        toast('Please log in to like videos');
        return;
    }
    
    console.log('Like toggle for video:', videoId);
    
    var likeRef = db.ref('videos/' + videoId + '/likes');
    
    likeRef.once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        console.log('Current likes:', likes);
        
        var idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
            console.log('Unliked');
        } else {
            likes.push(S.username);
            console.log('Liked');
        }
        
        return likeRef.set(likes);
    }).then(function() {
        // Update local state immediately
        var video = S.videoData.find(function(v) { return v.id === videoId; });
        if (video) {
            if (!video.likes) video.likes = [];
            var idx = video.likes.indexOf(S.username);
            if (idx > -1) {
                video.likes.splice(idx, 1);
            } else {
                video.likes.push(S.username);
            }
        }
        // Re-render to update counts
        renderVideos();
    }).catch(function(error) {
        console.error('Like error:', error);
        toast('Error updating like');
    });
}

// ============================================================
// COMMENT ON VIDEO - Fixed to persist
// ============================================================
function commentVideo(videoId) {
    if (!S.username) {
        toast('Please log in to comment');
        return;
    }
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        subtitle: 'Write your comment on this video',
        placeholder: 'Type your comment...',
        confirmText: 'Post Comment'
    }).then(function(result) {
        if (result && result.trim()) {
            var commentRef = db.ref('videos/' + videoId + '/comments');
            
            commentRef.once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                return commentRef.set(comments);
            }).then(function() {
                // Update local state immediately
                var video = S.videoData.find(function(v) { return v.id === videoId; });
                if (video) {
                    if (!video.comments) video.comments = [];
                    video.comments.push({
                        username: S.username,
                        text: result.trim(),
                        time: new Date().toISOString()
                    });
                }
                // Re-render to update counts
                renderVideos();
                toast('Comment added! 💬');
            }).catch(function(error) {
                console.error('Comment error:', error);
                toast('Error adding comment');
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
        subtitle: 'Are you sure you want to permanently delete this video?',
        confirmText: 'Delete',
        danger: true,
        cancelText: 'Cancel'
    }).then(function(result) {
        if (result !== null) {
            db.ref('videos/' + videoId).remove().then(function() {
                S.videoData = S.videoData.filter(function(v) { return v.id !== videoId; });
                renderVideos();
                toast('Video deleted');
            }).catch(function(error) {
                console.error('Delete error:', error);
                toast('Failed to delete video');
            });
        }
    });
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================
function downloadVideo(videoId) {
    var video = S.videoData.find(function(v) { return v.id === videoId; });
    if (!video || !video.url) {
        toast('Video not available for download');
        return;
    }
    
    try {
        if (video.url.startsWith('data:')) {
            var a = document.createElement('a');
            a.href = video.url;
            a.download = 'winchu-video-' + videoId + '.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast('⬇️ Downloading video...');
        } else if (video.url.startsWith('http')) {
            window.open(video.url, '_blank');
            toast('⬇️ Opening video in new tab...');
        }
    } catch (e) {
        console.error('Download error:', e);
        toast('Download failed. Please try again.');
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

console.log('🎬 Videos module loaded - Adaptive sizing, poster bubble on top, persistent counts');