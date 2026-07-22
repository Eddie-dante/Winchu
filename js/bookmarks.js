// Bookmarks Module

function bookmarkItem(id, type) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    S.bookmarks = S.bookmarks || [];
    
    const existingIndex = S.bookmarks.findIndex(b => b.id === id);
    
    if (existingIndex > -1) {
        // Remove bookmark
        S.bookmarks.splice(existingIndex, 1);
        toast('Removed from saved items');
    } else {
        // Add bookmark
        S.bookmarks.push({
            id: id,
            type: type,
            time: new Date().toISOString()
        });
        toast('Saved! 🔖');
    }
    
    // Save to Firebase
    setData('users/' + S.username + '/bookmarks', S.bookmarks);
    saveState();
    
    // Update UI
    renderSocial();
    renderProfile();
    renderVideos();
    if (document.getElementById('page-bookmarks').classList.contains('active')) {
        renderBookmarks();
    }
}

function renderBookmarks() {
    const container = document.getElementById('bookmarksList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Please log in</p>';
        return;
    }
    
    S.bookmarks = S.bookmarks || [];
    
    if (S.bookmarks.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">🔖</div><p>No saved items yet. Bookmark posts and videos!</p></div>';
        return;
    }
    
    let html = '';
    const sorted = [...S.bookmarks].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    sorted.forEach(b => {
        const item = b.type === 'post' ?
            S.socialPosts.find(p => p.id === b.id) :
            S.videoData.find(v => v.id === b.id);
        
        if (item) {
            html += `<div class="entry-card" style="display:flex;justify-content:space-between;align-items:center;">
                <div style="flex:1;cursor:pointer;" onclick="${b.type === 'post' ? `viewPostDetail('${b.id}')` : `navigate('videos')`}">
                    <strong>🔖 ${b.type === 'post' ? 'Post' : 'Video'}</strong>
                    <p style="font-size:11px;color:#94a3b8;">${timeSince(new Date(b.time))}</p>
                    <p style="font-size:12px;margin-top:2px;">${escapeHtml((item.text || '').substring(0, 60))}...</p>
                </div>
                <button class="btn-sm btn-danger" onclick="bookmarkItem('${b.id}','${b.type}')">🗑️</button>
            </div>`;
        }
    });
    
    container.innerHTML = html || '<p style="color:#94a3b8;text-align:center;">No saved items found.</p>';
}