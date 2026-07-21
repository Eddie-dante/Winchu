return <div class="ig-post"><div class="ig-post-header"><div class="ig-post-avatar">${p.avatar || '😊'}</div><span class="ig-post-user">${p.author}</span><span class="ig-post-time">${timeAgo}</span>${p.author === App.state.username ? <button class="btn-sm btn-danger" onclick="Social.deletePost('${p.id}')" style="font-size:11px;padding:2px 8px;">🗑</button> : ''}</div>${p.image ? <img src="${p.image}" class="post-image" /> : ''}<div style="padding:0 12px 4px;"><p style="font-size:13px;margin:4px 0;">${p.text}</p></div><div class="ig-post-actions"><button class="ig-post-action ${liked ? 'liked' : ''}" onclick="Social.likePost('${p.id}')">${liked ? '❤️' : '🤍'}</button><span style="font-size:13px;font-weight:600;color:#94a3b8;">${(p.likes || []).length} likes</span></div></div>;
        }).join('');
        this.renderStories();
    },

    cleanup() {
        if (this.postsListener) this.postsListener.off();
    }
};

function timeSince(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString();
}

window.Social = Social;
window.createPost = Social.createPost.bind(Social);
window.likePost = Social.likePost.bind(Social);
window.deletePost = Social.deletePost.bind(Social);
window.handleFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        window.selectedFileData = e.target.result;
        const preview = document.getElementById('filePreview');
        preview.style.display = 'block';
        preview.innerHTML = '<img src="' + e.target.result + '" style="max-height:150px;border-radius:8px;max-width:100%;">';
    };
    reader.readAsDataURL(file);
};