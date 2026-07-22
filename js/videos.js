// Videos Module - Complete with upload, like, comment, save, download, and full-screen playback

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
        console.log('Firebase videos snapshot received');
        
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
            
            // Sort by newest first
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            console.log('Total videos loaded: ' + S.videoData.length);
        } else {
            console.log('No videos found in database');
        }
        
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
        
        var existing = S.videoData.find(function(v) {
            return v.id === video.id;
        });
        
        if (!existing) {
            console.log('New video detected:', video.id, 'by', video.author);
            S.videoData.unshift(video);
            
            // Keep only last 100 videos
            if (S.videoData.length > 100) {
                S.videoData = S.videoData.slice(0, 100);
            }
            
            // Re-sort
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            renderVideos();
        }
    });
    
    videosListener.on('child_changed', function(snapshot) {
        var video = snapshot.val();
        if (!video) return;
        video.id = snapshot.key;
        
        var idx = S.videoData.findIndex(function(v) {
            return v.id === video.id;
        });
        
        if (idx > -1) {
            S.videoData[idx] = video;
            renderVideos();
        }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        console.log('Video removed:', snapshot.key);
        S.videoData = S.videoData.filter(function(v) {
            return v.id !== snapshot.key;
        });
        renderVideos();
    });
    
    console.log('🎬 Videos listener active');
}

// ============================================================
// RENDER VIDEOS FEED
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
        
        var liked = (video.likes || []).indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === video.id; });
        var likeCount = (video.likes || []).length;
        var commentCount = (video.comments || []).length;
        var canDelete = video.author === S.username;
        
        // Avatar
        var avatarDisplay = '';
        if (video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + video.avatar + '" alt="' + video.author + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(video.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
        }
        
        html += '<div class="tiktok-video">';
        
        // Video element
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline preload="metadata" ' +
                'style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;cursor:pointer;" ' +
                'onclick="toggleVideoPlay(this)"></video>';
        }
        
        // Overlay
        html += '<div class="overlay">';
        
        // User info
        html += '<div class="user" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '<div class="avatar">' + avatarDisplay + '</div>';
        html += '<span>@' + escapeHtml(video.author) + '</span>';
        html += '</div>';
        
        // Description
        if (video.text) {
            html += '<div class="desc">' + escapeHtml(video.text) + '</div>';
        }
        
        // Side actions
        html += '<div class="side-actions">';
        
        // Like button
        html += '<button class="' + (liked ? 'liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" title="Like">';
        html += '❤️<span>' + likeCount + '</span>';
        html += '</button>';
        
        // Comment button
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" title="Comment">';
        html += '💬<span>' + commentCount + '</span>';
        html += '</button>';
        
        // Save/Bookmark button
        html += '<button class="' + (bookmarked ? 'bookmarked' : '') + '" onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" title="Save">';
        html += '🔖<span>Save</span>';
        html += '</button>';
        
        // Download button
        html += '<button onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" title="Download">';
        html += '⬇️<span>DL</span>';
        html += '</button>';
        
        // Delete button (only for owner)
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="color:#ef4444;" title="Delete">';
            html += '🗑️<span>Del</span>';
            html += '</button>';
        }
        
        html += '</div>'; // End side-actions
        html += '</div>'; // End overlay
        html += '</div>'; // End tiktok-video
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
                    // Autoplay blocked, try muted
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

// Toggle video play/pause on click
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
    
    reader.onprogress = function(e) {
        if (e.lengthComputable) {
            var percent = Math.round((e.loaded / e.total) * 100);
            console.log('Loading: ' + percent + '%');
        }
    };
    
    reader.readAsDataURL(file);
}

// ============================================================
// LIKE VIDEO
// ============================================================
function likeVideo(videoId) {
    if (!S.username) {
        toast('Please log in to like videos');
        return;
    }
    
    db.ref('videos/' + videoId + '/likes').once('value').then(function(snapshot) {
        var likes = snapshot.val() || [];
        var idx = likes.indexOf(S.username);
        
        if (idx > -1) {
            likes.splice(idx, 1);
        } else {
            likes.push(S.username);
        }
        
        return db.ref('videos/' + videoId + '/likes').set(likes);
    }).then(function() {
        // Update local state
        var video = S.videoData.find(function(v) { return v.id === videoId; });
        if (video) {
            var idx = (video.likes || []).indexOf(S.username);
            if (idx > -1) {
                video.likes.splice(idx, 1);
            } else {
                if (!video.likes) video.likes = [];
                video.likes.push(S.username);
            }
        }
        renderVideos();
    }).catch(function(error) {
        console.error('Like error:', error);
    });
}

// ============================================================
// COMMENT ON VIDEO
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
            db.ref('videos/' + videoId + '/comments').once('value').then(function(snapshot) {
                var comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                return db.ref('videos/' + videoId + '/comments').set(comments);
            }).then(function() {
                // Update local state
                var video = S.videoData.find(function(v) { return v.id === videoId; });
                if (video) {
                    if (!video.comments) video.comments = [];
                    video.comments.push({
                        username: S.username,
                        text: result.trim(),
                        time: new Date().toISOString()
                    });
                }
                renderVideos();
                toast('Comment added! 💬');
            }).catch(function(error) {
                console.error('Comment error:', error);
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
// VIEW VIDEO COMMENTS
// ============================================================
function viewVideoComments(videoId) {
    var video = S.videoData.find(function(v) { return v.id === videoId; });
    if (!video) {
        toast('Video not found');
        return;
    }
    
    var comments = video.comments || [];
    
    if (comments.length === 0) {
        toast('No comments yet on this video');
        return;
    }
    
    var html = '<div style="max-height:400px;overflow-y:auto;">';
    html += '<strong style="display:block;margin-bottom:8px;">💬 Comments (' + comments.length + ')</strong>';
    
    comments.forEach(function(comment) {
        html += '<div style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">';
        html += '<strong style="cursor:pointer;" onclick="closeDialog();viewUserProfile(\'' + comment.username + '\')">' + escapeHtml(comment.username) + '</strong>';
        html += ' <span style="font-size:10px;color:#94a3b8;">' + timeSince(new Date(comment.time)) + '</span>';
        html += '<br>' + escapeHtml(comment.text);
        html += '</div>';
    });
    
    html += '</div>';
    
    showDialog({
        emoji: '💬',
        title: 'Video Comments',
        htmlSubtitle: html,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
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
window.viewVideoComments = viewVideoComments;
window.toggleVideoPlay = toggleVideoPlay;
window.setupVideoAutoplay = setupVideoAutoplay;

console.log('🎬 Videos module loaded');