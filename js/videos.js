// Videos Module - No doubles, seeking, adaptive

var videosListener = null;
var processedVideoIds = {};

function loadVideos() {
    if (videosListener) { videosListener.off(); videosListener = null; }
    S.videoData = []; processedVideoIds = {};
    var ref = firebase.database().ref('videos');
    ref.orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val(); S.videoData = []; processedVideoIds = {};
        if (data) { Object.keys(data).forEach(function(key) { var video = data[key]; if (video && video.author && !processedVideoIds[key]) { video.id = key; if (!video.likes) video.likes = []; if (!video.comments) video.comments = []; processedVideoIds[key] = true; S.videoData.push(video); } }); S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); }); }
        renderVideos();
    });
    ref.on('child_added', function(snapshot) { var video = snapshot.val(); var key = snapshot.key; if (!video || !video.author || processedVideoIds[key]) return; video.id = key; processedVideoIds[key] = true; if (!video.likes) video.likes = []; if (!video.comments) video.comments = []; if (!S.videoData.find(function(v) { return v.id === key; })) { S.videoData.unshift(video); if (S.videoData.length > 100) S.videoData.pop(); renderVideos(); } });
    ref.on('child_changed', function(snapshot) { var video = snapshot.val(); if (!video) return; video.id = snapshot.key; if (!video.likes) video.likes = []; if (!video.comments) video.comments = []; var idx = S.videoData.findIndex(function(v) { return v.id === video.id; }); if (idx > -1) { S.videoData[idx] = video; renderVideos(); } });
    ref.on('child_removed', function(snapshot) { delete processedVideoIds[snapshot.key]; S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; }); renderVideos(); });
}

function renderVideos() {
    var container = document.getElementById('videoFeed'); if (!container) return;
    if (!S.username) { container.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Please log in</p>'; return; }
    var videos = S.videoData || [];
    if (videos.length === 0) { container.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;"><div><i class="fas fa-play-circle" style="font-size:4rem;opacity:0.4;"></i><p style="font-size:1.2rem;opacity:0.6;">No videos yet</p></div></div>'; return; }
    var html = '';
    videos.forEach(function(video, index) {
        if (!video || !video.author) return;
        if (!video.likes) video.likes = []; if (!video.comments) video.comments = [];
        var liked = video.likes.indexOf(S.username) > -1;
        var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === video.id; });
        var likeCount = video.likes.length; var commentCount = video.comments.length;
        var canDelete = video.author === S.username;
        var avatarInitial = video.author.charAt(0).toUpperCase();
        var avatarColor = getColor(video.author);
        var avatarDisplay = video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http')) ? '<img src="' + video.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : '<div style="width:100%;height:100%;border-radius:50%;background:' + avatarColor + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + avatarInitial + '</div>';
        html += '<div class="video-slide" style="background:#000;">';
        if (video.url) html += '<video src="' + video.url + '" loop playsinline controls style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;" onclick="toggleVideoPlay(this)"></video>';
        else html += '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;">🎬 Win Moment</div>';
        html += '<div class="video-overlay"><div class="video-info"><div class="username" style="cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">@' + escapeHtml(video.author) + ' <i class="fas fa-check-circle" style="color:#ffd700;font-size:0.7rem;"></i></div>' + (video.text ? '<div class="caption">' + escapeHtml(video.text) + '</div>' : '') + '<div class="hashtags" style="color:#ffd700;font-size:0.75rem;">#Winchu</div></div>';
        html += '<div class="video-actions">';
        html += '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" onclick="event.stopPropagation();likeVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-heart" style="font-size:1.8rem;color:' + (liked ? '#ff2d55' : '#fff') + ';"></i><span style="color:#fff;font-size:0.7rem;">' + likeCount + '</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();commentVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-comment" style="font-size:1.8rem;color:#fff;"></i><span style="color:#fff;font-size:0.7rem;">' + commentCount + '</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();bookmarkItem(\'' + video.id + '\',\'video\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-bookmark" style="font-size:1.8rem;color:' + (bookmarked ? '#ffd700' : '#fff') + ';"></i><span style="color:#fff;font-size:0.7rem;">Save</span></button>';
        html += '<button class="action-btn" onclick="event.stopPropagation();downloadVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-download" style="font-size:1.8rem;color:#fff;"></i><span style="color:#fff;font-size:0.7rem;">DL</span></button>';
        if (canDelete) html += '<button class="action-btn" onclick="event.stopPropagation();deleteVideo(\'' + video.id + '\')" style="background:none;border:none;cursor:pointer;"><i class="fas fa-trash" style="font-size:1.8rem;color:#ef4444;"></i><span style="color:#ef4444;font-size:0.7rem;">Del</span></button>';
        html += '<div class="profile-pic-small" style="width:42px;height:42px;border-radius:50%;border:2px solid #fff;background:' + avatarColor + ';display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;cursor:pointer;" onclick="event.stopPropagation();viewUserProfile(\'' + video.author + '\')">' + avatarInitial + '</div>';
        html += '</div></div></div>';
    });
    container.innerHTML = html;
    setupVideoAutoplay(container);
}

function setupVideoAutoplay(container) { var videos = container.querySelectorAll('video'); var observer = new IntersectionObserver(function(entries) { entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.muted = false; entry.target.play().catch(function() { entry.target.muted = true; entry.target.play().catch(function() {}); }); } else { entry.target.pause(); } }); }, { threshold: 0.6 }); videos.forEach(function(v) { observer.observe(v); }); }
function toggleVideoPlay(el) { if (el.paused) { el.muted = false; el.play().catch(function() { el.muted = true; el.play().catch(function() {}); }); } else { el.pause(); } }

function handleVideoUpload(event) { var file = event.target.files[0]; if (!file) return; if (!file.type.startsWith('video/')) { toast('Select a video'); event.target.value = ''; return; } if (file.size > 50*1024*1024) { toast('Max 50MB'); event.target.value = ''; return; } toast('Uploading...'); var reader = new FileReader(); reader.onload = function(e) { firebase.database().ref('videos').push({ author: S.username, avatar: S.avatar || null, text: '', url: e.target.result, time: new Date().toISOString(), likes: [], comments: [] }); toast('Uploaded!'); }; reader.readAsDataURL(file); }
function likeVideo(videoId) { if (!S.username) return; var likeRef = firebase.database().ref('videos/' + videoId + '/likes'); likeRef.once('value').then(function(snapshot) { var likes = snapshot.val() || []; var idx = likes.indexOf(S.username); if (idx > -1) { likes.splice(idx, 1); } else { likes.push(S.username); } return likeRef.set(likes); }).then(function() { var v = S.videoData.find(function(x) { return x.id === videoId; }); if (v) { if (!v.likes) v.likes = []; var idx = v.likes.indexOf(S.username); if (idx > -1) { v.likes.splice(idx, 1); } else { v.likes.push(S.username); } } renderVideos(); }); }
function commentVideo(videoId) { if (!S.username) return; showDialog({ emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post' }).then(function(r) { if (r && r.trim()) { var ref = firebase.database().ref('videos/' + videoId + '/comments'); ref.once('value').then(function(s) { var c = s.val() || []; c.push({ username: S.username, text: r.trim(), time: new Date().toISOString() }); return ref.set(c); }).then(function() { var v = S.videoData.find(function(x) { return x.id === videoId; }); if (v) { if (!v.comments) v.comments = []; v.comments.push({ username: S.username, text: r.trim(), time: new Date().toISOString() }); } renderVideos(); toast('Comment added!'); }); } }); }
function deleteVideo(videoId) { showDialog({ emoji: '🗑️', title: 'Delete', confirmText: 'Delete', danger: true }).then(function(r) { if (r !== null) { firebase.database().ref('videos/' + videoId).remove(); toast('Deleted'); } }); }
function downloadVideo(videoId) { var v = S.videoData.find(function(x) { return x.id === videoId; }); if (v && v.url && v.url.startsWith('data:')) { var a = document.createElement('a'); a.href = v.url; a.download = 'video.mp4'; a.click(); toast('⬇️ Downloading...'); } }

window.loadVideos = loadVideos; window.renderVideos = renderVideos;
window.handleVideoUpload = handleVideoUpload; window.likeVideo = likeVideo;
window.commentVideo = commentVideo; window.deleteVideo = deleteVideo;
window.downloadVideo = downloadVideo; window.toggleVideoPlay = toggleVideoPlay;
console.log('🎬 Videos ready');