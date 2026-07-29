// ============================================================
// RENDER SOCIAL - OPTIMIZED
// ============================================================
function renderSocial() {
    var feed = document.getElementById('socialFeed');
    if (!feed) return;
    
    if (!S.username) {
        feed.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">Please log in</p>';
        return;
    }
    
    var posts = S.socialPosts || [];
    if (posts.length === 0) {
        feed.innerHTML = '<div style="text-align:center;padding:50px;">' +
            '<div style="font-size:48px;">📸</div>' +
            '<p>No posts yet. Be the first to share!</p>' +
            '</div>';
        return;
    }
    
    // Only render first 20 posts for performance
    var visiblePosts = posts.slice(0, 20);
    
    var html = '';
    visiblePosts.forEach(function(post) {
        if (!post || !post.author) return;
        if (!Array.isArray(post.likes)) post.likes = [];
        if (!Array.isArray(post.comments)) post.comments = [];
        
        var liked = post.likes.indexOf(S.username) > -1;
        var likeCount = post.likes.length;
        var commentCount = post.comments.length;
        var timeAgo = timeSince(new Date(post.time));
        var canDelete = post.author === S.username;
        
        // Lazy load images
        var imageHTML = '';
        if (post.image) {
            imageHTML = '<img src="' + post.image + '" class="ig-post-image" style="width:100%;max-height:400px;object-fit:cover;loading="lazy";" />';
        }
        
        var avatarDisplay = post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))
            ? '<img src="' + post.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />'
            : '<div style="width:100%;height:100%;border-radius:50%;background:' + getColor(post.author) + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + post.author.charAt(0).toUpperCase() + '</div>';
        
        html += '<div class="ig-post" onclick="viewPostDetail(\'' + post.id + '\')">';
        html += '<div class="ig-post-header">';
        html += '<div class="profile-bubble" onclick="event.stopPropagation();viewUserProfile(\'' + post.author + '\')">';
        html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
        html += '<span class="pb-name">' + escapeHtml(post.author) + '</span>';
        html += '</div>';
        html += '<span class="ig-post-time">' + timeAgo + '</span>';
        if (canDelete) {
            html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();deletePost(\'' + post.id + '\')" style="font-size:10px;padding:2px 6px;">🗑️</button>';
        }
        html += '</div>';
        html += imageHTML;
        if (post.text) {
            html += '<div style="padding:8px 12px 4px;"><p style="font-size:13px;">' + escapeHtml(post.text) + '</p></div>';
        }
        html += '<div class="ig-post-actions" onclick="event.stopPropagation();" style="padding:8px 12px;display:flex;align-items:center;gap:14px;">';
        html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\')" style="font-size:20px;">' + (liked ? '❤️' : '🤍') + '</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;" id="likeCount-' + post.id + '">' + likeCount + '</span>';
        html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\')" style="font-size:20px;">💬</button>';
        html += '<span style="font-size:12px;font-weight:600;color:#94a3b8;">' + commentCount + '</span>';
        html += '<button class="ig-post-action" onclick="bookmarkItem(\'' + post.id + '\',\'post\')" style="font-size:20px;">🔖</button>';
        if (post.image) {
            html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:20px;">⬇️</button>';
        }
        html += '</div>';
        if (commentCount > 0) {
            html += '<div style="padding:4px 12px 8px;font-size:12px;color:#64748b;" onclick="event.stopPropagation();viewPostDetail(\'' + post.id + '\')">';
            html += 'View ' + commentCount + ' comment' + (commentCount > 1 ? 's' : '');
            html += '</div>';
        }
        html += '</div>';
    });
    
    feed.innerHTML = html;
}