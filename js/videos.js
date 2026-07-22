// Videos Module

function renderVideos() {
    const container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in</p>';
        return;
    }
    
    if (!S.videoData || S.videoData.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">No videos yet. Tap 📹 to upload!</p>';
        return;
    }
    
    let html = '';
    S.videoData.forEach(v => {
        const liked = (v.likes || []).includes(S.username);
        const bookmarked = (S.bookmarks || []).some(b => b.id === v.id);
        const likeCount = (v.likes || []).length;
        const commentCount = (v.comments || []).length;
        
        html += `<div class="tiktok-video">
            <video src="${v.url}" loop playsinline preload="metadata"></video>
            <div class="overlay">
                <div class="user" onclick="viewUserProfile('${v.author}')">
                    <div class="avatar">${v.avatar || '😊'}</div>
                    @${v.author}
                </div>
                <div class="desc">${escapeHtml(v.text || '')}</div>
                <div class="side-actions">
                    <button class="${liked ? 'liked' : ''}" onclick="likeVideo('${v.id}')">❤️<span>${likeCount}</span></button>
                    <button onclick="commentVideo('${v.id}')">💬<span>${commentCount}</span></button>
                    <button class="${bookmarked ? 'bookmarked' : ''}" onclick="bookmarkItem('${v.id}','video')">🔖<span>Save</span></button>
                    ${v.author === S.username ? `<button onclick="deleteVideo('${v.id}')" style="color:#ef4444;">🗑️<span>Delete</span></button>` : ''}
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    
    // Video autoplay with Intersection Observer
    const videos = container.querySelectorAll('video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.muted = false;
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.6 });
    
    videos.forEach(v => observer.observe(v));
}

function likeVideo(id) {
    if (!S.username) return;
    
    getRef('videos/' + id + '/likes').once('value', (snapshot) => {
        let likes = snapshot.val() || [];
        const idx = likes.indexOf(S.username);
        
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(S.username);
        
        getRef('videos/' + id + '/likes').set(likes);
        
        const video = S.videoData.find(v => v.id === id);
        if (video) video.likes = likes;
        
        renderVideos();
    });
}

function commentVideo(id) {
    if (!S.username) return;
    
    showDialog({
        emoji: '💬',
        title: 'Add Comment',
        placeholder: 'Write your comment...',
        confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            getRef('videos/' + id + '/comments').once('value', (snapshot) => {
                let comments = snapshot.val() || [];
                comments.push({
                    username: S.username,
                    text: result.trim(),
                    time: new Date().toISOString()
                });
                
                getRef('videos/' + id + '/comments').set(comments);
                
                const video = S.videoData.find(v => v.id === id);
                if (video) video.comments = comments;
                
                renderVideos();
                toast('Comment added! 💬');
            });
        }
    });
}

function deleteVideo(id) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Video',
        subtitle: 'Are you sure you want to delete this video?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            getRef('videos/' + id).remove().then(() => {
                S.videoData = S.videoData.filter(v => v.id !== id);
                renderVideos();
                toast('Video deleted');
            });
        }
    });
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
        toast('Video too large (max 50MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const video = {
            author: S.username,
            avatar: S.avatar || '😊',
            text: '',
            url: e.target.result,
            time: new Date().toISOString(),
            likes: [],
            comments: []
        };
        
        pushData('videos', video).then(() => {
            toast('📹 Video uploaded!');
        });
    };
    reader.readAsDataURL(file);
}

function loadVideos() {
    if (videosListener) videosListener.off();
    
    videosListener = getRef('videos').orderByChild('time').limitToLast(50);
    
    videosListener.on('child_added', (snapshot) => {
        const data = snapshot.val();
        data.id = snapshot.key;
        
        if (!S.videoData.find(v => v.id === data.id)) {
            S.videoData.unshift(data);
            if (S.videoData.length > 50) S.videoData.pop();
            renderVideos();
        }
    });
    
    videosListener.on('child_removed', (snapshot) => {
        S.videoData = S.videoData.filter(v => v.id !== snapshot.key);
        renderVideos();
    });
}