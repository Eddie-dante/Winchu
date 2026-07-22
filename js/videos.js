// Videos Module - Complete fix with adaptive video sizing and poster bubble

var videosListener = null;

function loadVideos() {
    if (videosListener) { videosListener.off(); videosListener = null; }
    S.videoData = [];
    
    db.ref('videos').orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var v = data[key];
                if (v && v.author) { v.id = key; S.videoData.push(v); }
            });
            S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        renderVideos();
    });
    
    videosListener = db.ref('videos');
    videosListener.on('child_added', function(snapshot) {
        var v = snapshot.val(); if (!v || !v.author) return; v.id = snapshot.key;
        if (!S.videoData.find(function(x) { return x.id === v.id; })) { S.videoData.unshift(v); renderVideos(); }
    });
    videosListener.on('child_changed', function(snapshot) {
        var v = snapshot.val(); if (!v) return; v.id = snapshot.key;
        var idx = S.videoData.findIndex(function(x) { return x.id === v.id; });
        if (idx > -1) { S.videoData[idx] = v; renderVideos(); }
    });
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; });
        renderVideos();
    });
}

function renderVideos() {
    var container = document.getElementById('videoFeed');
    if (!container) return;
    if (!S.username) { container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in</p>'; return; }
    
    var videos = S.videoData || [];
    if (videos.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">🎬</div><p>No videos yet.</p></div>';
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
        
        var avatarDisplay = '';
        if (video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http'))) {
            avatarDisplay = '<img src="' + video.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            var color = getColor(video.author);
            avatarDisplay = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
        }
        
        // Video container - adapts to container size
        html += '<div style="position:relative;width:100%;height:calc(100vh - 200px);min-height:400px;background:#000;overflow:hidden;margin-bottom:4px;scroll-snap-align:start;">';
        
        // Video element
        if (video.url) {
            html += '<video src="' + video.url + '" loop playsinline style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;right:0;bottom:0;" onclick="toggleVideoPlay(this)"></video>';
        }
        
        // POSTER BUBBLE - TOP LEFT
        html += '<div style="position:absolute;top:20px;left:16px;z-index:10;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">';
        html += '<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);padding:8px 14px;border-radius:25px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;">';
        html += '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.8);">' + avatarDisplay + '</div>';
        html += '<div><div style="color:#fff;font-weight:700;font-size:14px;">@' + escapeHtml(video.author) + '</div></div>';
        html += '</div></div>';
        
        // SIDE ACTIONS - RIGHT SIDE, BELOW POSTER BUBBLE
        html += '<div style="position:absolute;right:16px;bottom:120px;display:flex;flex-direction:column;gap:18px;align-items:center;z-index:10;">';
        
        // Like button
        html += '<button onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:none;color:' + (liked ? '#ef4444' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">' + (liked ? '❤️' : '🤍') + '<span style="font-size:10px;font-weight:600;">' + likeCount + '</span></button>';
        
        // Comment button
        html += '<button onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:none;color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">💬<span style="font-size:10px;font-weight:600;">' + commentCount + '</span></button>';
        
        // Bookmark button
        html += '<button onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:none;color:' + (bookmarked ? '#f59e0b' : '#fff') + ';width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">🔖<span style="font-size:10px;">Save</span></button>';
        
        // Download button
        html += '<button onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:none;color:#fff;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">⬇️<span style="font-size:10px;">DL</span></button>';
        
        if (canDelete) {
            html += '<button onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:none;color:#ef4444;width:50px;height:50px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">🗑️<span style="font-size:10px;">Del</span></button>';
        }
        
        html += '</div>';
        
        // Description
        if (video.text) {
            html += '<div style="position:absolute;bottom:60px;left:16px;right:80px;z-index:10;color:#fff;font-size:13px;text-shadow:0 1px 3px rgba(0,0,0,0.8);">' + escapeHtml(video.text) + '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Autoplay
    var videoEls = container.querySelectorAll('video');
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) { entry.target.muted = false; entry.target.play().catch(function(){}); }
            else { entry.target.pause(); }
        });
    }, { threshold: 0.6 });
    videoEls.forEach(function(v) { observer.observe(v); });
}

function toggleVideoPlay(el) { if (el.paused) { el.muted = false; el.play().catch(function(){}); } else { el.pause(); } }

function handleVideoUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast('Select a video file'); event.target.value = ''; return; }
    if (file.size > 50*1024*1024) { toast('Max 50MB'); event.target.value = ''; return; }
    toast('Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) {
        var vd = { author: S.username, avatar: S.avatar || null, text: '', url: e.target.result, time: new Date().toISOString(), likes: [], comments: [] };
        var nr = db.ref('videos').push();
        nr.set(vd).then(function() { vd.id = nr.key; S.videoData.unshift(vd); renderVideos(); toast('Uploaded!'); });
    };
    reader.readAsDataURL(file);
}

function likeVideo(id) {
    if (!S.username) return;
    var ref = db.ref('videos/' + id + '/likes');
    ref.once('value').then(function(s) {
        var l = s.val() || [];
        var i = l.indexOf(S.username);
        if (i > -1) l.splice(i, 1); else l.push(S.username);
        return ref.set(l);
    }).then(function() {
        var v = S.videoData.find(function(x) { return x.id === id; });
        if (v) { v.likes = v.likes || []; var i = v.likes.indexOf(S.username); if (i > -1) v.likes.splice(i, 1); else v.likes.push(S.username); }
        renderVideos();
    });
}

function commentVideo(id) {
    if (!S.username) return;
    showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(r) {
        if (r && r.trim()) {
            var ref = db.ref('videos/' + id + '/comments');
            ref.once('value').then(function(s) {
                var c = s.val() || [];
                c.push({ username: S.username, text: r.trim(), time: new Date().toISOString() });
                return ref.set(c);
            }).then(function() {
                var v = S.videoData.find(function(x) { return x.id === id; });
                if (v) { v.comments = v.comments || []; v.comments.push({ username: S.username, text: r.trim(), time: new Date().toISOString() }); }
                renderVideos();
                toast('Comment added!');
            });
        }
    });
}

function deleteVideo(id) {
    showDialog({ emoji: '🗑️', title: 'Delete', subtitle: 'Delete video?', confirmText: 'Delete', danger: true }).then(function(r) {
        if (r !== null) { db.ref('videos/' + id).remove(); S.videoData = S.videoData.filter(function(v) { return v.id !== id; }); renderVideos(); toast('Deleted'); }
    });
}

function downloadVideo(id) {
    var v = S.videoData.find(function(x) { return x.id === id; });
    if (v && v.url && v.url.startsWith('data:')) { var a = document.createElement('a'); a.href = v.url; a.download = 'video.mp4'; a.click(); toast('⬇️ Downloading...'); }
}

window.loadVideos = loadVideos;
window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload;
window.likeVideo = likeVideo;
window.commentVideo = commentVideo;
window.deleteVideo = deleteVideo;
window.downloadVideo = downloadVideo;
window.toggleVideoPlay = toggleVideoPlay;

console.log('🎬 Videos module loaded - fixed layout');