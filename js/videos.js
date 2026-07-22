// Videos Module - Fixed avatar and upload button position

function renderVideos() {
    const container = document.getElementById('videoFeed');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">Please log in</p>';
        return;
    }
    
    if (!S.videoData || S.videoData.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px;">No videos yet.</p>';
        return;
    }
    
    let html = '';
    S.videoData.forEach(v => {
        const liked = (v.likes || []).includes(S.username);
        const bookmarked = (S.bookmarks || []).some(b => b.id === v.id);
        const likeCount = (v.likes || []).length;
        const commentCount = (v.comments || []).length;
        
        // FIXED: Avatar display
        let avatarDisplay = '';
        if (v.avatar && (v.avatar.startsWith('data:') || v.avatar.includes('http'))) {
            avatarDisplay = `<img src="${v.avatar}" alt="${v.author}" style="width:100%;height:100%;object-fit:cover;" />`;
        } else {
            avatarDisplay = v.avatar || '😊';
        }
        
        html += `<div class="tiktok-video">
            <video src="${v.url}" loop playsinline preload="metadata" 
                style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0;"></video>
            <div class="overlay">
                <div class="user" onclick="viewUserProfile('${v.author}')">
                    <div class="avatar">${avatarDisplay}</div>
                    @${v.author}
                </div>
                <div class="desc">${escapeHtml(v.text || '')}</div>
                <div class="side-actions">
                    <button class="${liked ? 'liked' : ''}" onclick="event.stopPropagation();likeVideo('${v.id}')">
                        ❤️<span>${likeCount}</span>
                    </button>
                    <button onclick="event.stopPropagation();commentVideo('${v.id}')">
                        💬<span>${commentCount}</span>
                    </button>
                    <button class="${bookmarked ? 'bookmarked' : ''}" onclick="event.stopPropagation();bookmarkItem('${v.id}','video')">
                        🔖<span>Save</span>
                    </button>
                    <button onclick="event.stopPropagation();downloadVideo('${v.url}', 'winchu-video.mp4')">
                        ⬇️<span>DL</span>
                    </button>
                    ${v.author === S.username ? 
                        `<button onclick="event.stopPropagation();deleteVideo('${v.id}')" style="color:#ef4444;">
                            🗑️<span>Del</span>
                        </button>` : ''}
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    
    // Video autoplay
    const videos = container.querySelectorAll('video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.muted = false;
                entry.target.volume = 1.0;
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.6 });
    
    videos.forEach(v => observer.observe(v));
    
    // Click to mute/unmute
    videos.forEach(v => {
        v.addEventListener('click', (e) => {
            e.stopPropagation();
            v.muted = !v.muted;
            toast(v.muted ? '🔇 Muted' : '🔊 Unmuted');
        });
    });
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
        toast('Video too large (max 50MB)');
        return;
    }
    
    if (!file.type.startsWith('video/')) {
        toast('Please select a video file');
        return;
    }
    
    toast('📹 Uploading video...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Store the actual avatar
        const video = {
            author: S.username,
            avatar: S.avatar || null,  // Store actual avatar image
            text: '',
            url: e.target.result,
            time: new Date().toISOString(),
            likes: [],
            comments: []
        };
        
        pushData('videos', video).then(() => {
            toast('📹 Video uploaded!');
        }).catch(() => {
            toast('Failed to upload');
        });
    };
    
    reader.onerror = function() {
        toast('Error reading file');
    };
    
    reader.readAsDataURL(file);
}

function downloadVideo(url, filename) {
    if (!url) { toast('No video'); return; }
    
    if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'winchu-video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('⬇️ Downloading...');
    } else {
        window.open(url, '_blank');
        toast('⬇️ Opening video...');
    }
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
        emoji: '💬', title: 'Comment', placeholder: 'Write...', confirmText: 'Post'
    }).then(result => {
        if (result && result.trim()) {
            getRef('videos/' + id + '/comments').once('value', (snapshot) => {
                let comments = snapshot.val() || [];
                comments.push({ username: S.username, text: result.trim(), time: new Date().toISOString() });
                getRef('videos/' + id + '/comments').set(comments);
                const video = S.videoData.find(v => v.id === id);
                if (video) video.comments = comments;
                renderVideos();
                toast('Comment added!');
            });
        }
    });
}

function deleteVideo(id) {
    showDialog({
        emoji: '🗑️', title: 'Delete', subtitle: 'Delete this video?', confirmText: 'Delete', danger: true
    }).then(result => {
        if (result !== null) {
            getRef('videos/' + id).remove();
            S.videoData = S.videoData.filter(v => v.id !== id);
            renderVideos();
            toast('Deleted');
        }
    });
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
}

console.log('🎬 Video module loaded');