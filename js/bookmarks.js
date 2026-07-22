// Bookmarks Module - Complete with back button

function renderBookmarks() {
    var container = document.getElementById('bookmarksList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to see your saved items.</p>';
        return;
    }
    
    // Add back button at the top
    var backButton = document.createElement('button');
    backButton.className = 'btn-sm';
    backButton.textContent = '← Back to Profile';
    backButton.style.cssText = 'margin-bottom:12px;width:auto;';
    backButton.onclick = function() {
        navigate('profile');
    };
    
    // Clear container and add back button
    container.innerHTML = '';
    container.appendChild(backButton);
    
    // Create content wrapper
    var contentWrapper = document.createElement('div');
    contentWrapper.id = 'bookmarksContent';
    container.appendChild(contentWrapper);
    
    // Load bookmarks
    loadAndDisplayBookmarks(contentWrapper);
}

function loadAndDisplayBookmarks(contentWrapper) {
    S.bookmarks = S.bookmarks || [];
    
    if (S.bookmarks.length === 0) {
        contentWrapper.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">🔖</div>' +
            '<p>No saved items yet.</p>' +
            '<p style="font-size:12px;">Bookmark posts and videos to see them here!</p>' +
            '</div>';
        return;
    }
    
    // Sort bookmarks by time (newest first)
    var sortedBookmarks = S.bookmarks.slice().sort(function(a, b) {
        return new Date(b.time) - new Date(a.time);
    });
    
    var html = '';
    var loadedCount = 0;
    var totalBookmarks = sortedBookmarks.length;
    
    sortedBookmarks.forEach(function(bookmark) {
        if (bookmark.type === 'post') {
            // Find the post in socialPosts
            var post = S.socialPosts.find(function(p) {
                return p.id === bookmark.id;
            });
            
            if (post) {
                html += renderBookmarkPost(post, bookmark);
                loadedCount++;
            } else {
                // Post might have been deleted
                html += '<div class="entry-card" style="opacity:0.5;">' +
                    '<p style="font-size:12px;color:#94a3b8;">📝 Post no longer available</p>' +
                    '<button class="btn-sm btn-danger" onclick="removeBookmark(\'' + bookmark.id + '\')" style="font-size:10px;margin-top:4px;">🗑️ Remove</button>' +
                    '</div>';
                loadedCount++;
            }
        } else if (bookmark.type === 'video') {
            // Find the video in videoData
            var video = S.videoData.find(function(v) {
                return v.id === bookmark.id;
            });
            
            if (video) {
                html += renderBookmarkVideo(video, bookmark);
                loadedCount++;
            } else {
                // Video might have been deleted
                html += '<div class="entry-card" style="opacity:0.5;">' +
                    '<p style="font-size:12px;color:#94a3b8;">🎬 Video no longer available</p>' +
                    '<button class="btn-sm btn-danger" onclick="removeBookmark(\'' + bookmark.id + '\')" style="font-size:10px;margin-top:4px;">🗑️ Remove</button>' +
                    '</div>';
                loadedCount++;
            }
        }
    });
    
    if (loadedCount === 0) {
        contentWrapper.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">📭</div>' +
            '<p>No saved content found.</p>' +
            '</div>';
    } else {
        contentWrapper.innerHTML = html;
    }
}

function renderBookmarkPost(post, bookmark) {
    var timeAgo = timeSince(new Date(bookmark.time));
    var savedDate = new Date(bookmark.time).toLocaleDateString('en', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    var color = getColor(post.author);
    var avatarHTML = post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))
        ? '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
        : '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + post.author.charAt(0).toUpperCase() + '</div>';
    
    var postPreview = post.text ? post.text.substring(0, 100) + (post.text.length > 100 ? '...' : '') : '';
    var hasImage = post.image ? true : false;
    
    var html = '<div class="entry-card" style="cursor:pointer;transition:all 0.2s;" onclick="viewPostDetail(\'' + post.id + '\')">';
    
    // Header with avatar and author
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    html += '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatarHTML + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-weight:600;font-size:13px;">' + escapeHtml(post.author) + '</div>';
    html += '<div style="font-size:10px;color:#94a3b8;">📝 Post · Saved ' + timeAgo + '</div>';
    html += '</div>';
    html += '<span style="font-size:18px;">🔖</span>';
    html += '</div>';
    
    // Post image thumbnail
    if (hasImage) {
        html += '<div style="width:100%;height:120px;background-image:url(' + post.image + ');background-size:cover;background-position:center;border-radius:8px;margin-bottom:8px;"></div>';
    }
    
    // Post text preview
    if (postPreview) {
        html += '<p style="font-size:12px;color:#475569;margin-bottom:8px;">' + escapeHtml(postPreview) + '</p>';
    }
    
    // Stats
    html += '<div style="display:flex;align-items:center;gap:16px;font-size:11px;color:#94a3b8;">';
    html += '<span>❤️ ' + (post.likes || []).length + ' likes</span>';
    html += '<span>💬 ' + (post.comments || []).length + ' comments</span>';
    html += '</div>';
    
    // Action buttons
    html += '<div style="display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.05);">';
    html += '<button class="btn-sm" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')" style="font-size:10px;">👁️ View Post</button>';
    html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();removeBookmark(\'' + bookmark.id + '\')" style="font-size:10px;">🗑️ Remove</button>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

function renderBookmarkVideo(video, bookmark) {
    var timeAgo = timeSince(new Date(bookmark.time));
    
    var color = getColor(video.author);
    var avatarHTML = video.avatar && (video.avatar.startsWith('data:') || video.avatar.includes('http'))
        ? '<img src="' + video.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
        : '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + video.author.charAt(0).toUpperCase() + '</div>';
    
    var html = '<div class="entry-card" style="cursor:pointer;transition:all 0.2s;" onclick="navigate(\'videos\')">';
    
    // Header
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    html += '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatarHTML + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-weight:600;font-size:13px;">' + escapeHtml(video.author) + '</div>';
    html += '<div style="font-size:10px;color:#94a3b8;">🎬 Video · Saved ' + timeAgo + '</div>';
    html += '</div>';
    html += '<span style="font-size:18px;">🔖</span>';
    html += '</div>';
    
    // Video thumbnail
    html += '<div style="width:100%;height:120px;background:#000;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">';
    html += '<span style="font-size:48px;">🎬</span>';
    html += '<div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;">▶ Play</div>';
    html += '</div>';
    
    // Stats
    html += '<div style="display:flex;align-items:center;gap:16px;font-size:11px;color:#94a3b8;">';
    html += '<span>❤️ ' + (video.likes || []).length + ' likes</span>';
    html += '<span>💬 ' + (video.comments || []).length + ' comments</span>';
    html += '</div>';
    
    // Action buttons
    html += '<div style="display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.05);">';
    html += '<button class="btn-sm" onclick="event.stopPropagation();navigate(\'videos\')" style="font-size:10px;">👁️ View Videos</button>';
    html += '<button class="btn-sm" onclick="event.stopPropagation();downloadMedia(\'' + video.url + '\')" style="font-size:10px;">⬇️ Download</button>';
    html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();removeBookmark(\'' + bookmark.id + '\')" style="font-size:10px;">🗑️ Remove</button>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

function bookmarkItem(id, type) {
    if (!S.username) {
        toast('Please log in to save items');
        return;
    }
    
    S.bookmarks = S.bookmarks || [];
    
    // Check if already bookmarked
    var existingIndex = S.bookmarks.findIndex(function(b) {
        return b.id === id;
    });
    
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
    db.ref('users/' + S.username + '/bookmarks').set(S.bookmarks).then(function() {
        console.log('Bookmarks updated in Firebase');
    }).catch(function(error) {
        console.error('Error saving bookmarks:', error);
    });
    
    // Save to local state
    saveState();
    
    // Refresh relevant views
    if (typeof renderSocial === 'function') renderSocial();
    if (typeof renderProfile === 'function') renderProfile();
    if (typeof renderVideos === 'function') renderVideos();
    
    // If on bookmarks page, refresh it
    var bookmarksPage = document.getElementById('page-bookmarks');
    if (bookmarksPage && bookmarksPage.classList.contains('active')) {
        renderBookmarks();
    }
}

function removeBookmark(id) {
    if (!S.username) return;
    
    S.bookmarks = S.bookmarks || [];
    
    // Remove the bookmark
    S.bookmarks = S.bookmarks.filter(function(b) {
        return b.id !== id;
    });
    
    // Save to Firebase
    db.ref('users/' + S.username + '/bookmarks').set(S.bookmarks).then(function() {
        console.log('Bookmark removed from Firebase');
    }).catch(function(error) {
        console.error('Error removing bookmark:', error);
    });
    
    // Save local state
    saveState();
    
    // Refresh bookmarks page
    var contentWrapper = document.getElementById('bookmarksContent');
    if (contentWrapper) {
        loadAndDisplayBookmarks(contentWrapper);
    }
    
    // Refresh other views
    if (typeof renderSocial === 'function') renderSocial();
    if (typeof renderVideos === 'function') renderVideos();
    
    toast('Bookmark removed');
}

// Initialize bookmarks page when navigated to
function initBookmarksPage() {
    var bookmarksPage = document.getElementById('page-bookmarks');
    if (!bookmarksPage) return;
    
    // Add event listener for when the page becomes active
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('active')) {
                renderBookmarks();
            }
        });
    });
    
    observer.observe(bookmarksPage, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// Call initialization
document.addEventListener('DOMContentLoaded', function() {
    initBookmarksPage();
});

// Expose functions globally
window.renderBookmarks = renderBookmarks;
window.bookmarkItem = bookmarkItem;
window.removeBookmark = removeBookmark;
window.loadAndDisplayBookmarks = loadAndDisplayBookmarks;

console.log('🔖 Bookmarks module loaded');