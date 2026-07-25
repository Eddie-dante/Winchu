// Navigation Module - Fixed - No diary auto-redirect

// ============================================================
// PAGE NAVIGATION SYSTEM
// ============================================================
function navigate(page, data) {
    console.log('🧭 Navigating to:', page);
    
    var authPages = ['landing', 'login', 'signup'];
    var protectedPages = [
        'home', 'social', 'chat', 'profile', 'routine', 'videos', 
        'wallpapers', 'users', 'groups', 'notifications', 'bookmarks', 'userprofile'
    ];
    
    // Diary redirect - ONLY when diary button is clicked
    if (page === 'diary') {
        window.location.href = 'page/diary.html';
        return;
    }
    
    if (protectedPages.indexOf(page) > -1 && !S.username) {
        toast('Please log in first');
        page = 'landing';
    }
    
    // Hide all pages
    var allPages = document.querySelectorAll('.page');
    allPages.forEach(function(p) {
        p.classList.remove('active');
    });
    
    // Show target page
    var target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
        target.style.animation = 'none';
        target.offsetHeight;
        target.style.animation = 'fadeUp 0.4s ease forwards';
    }
    
    // Update navigation buttons
    var navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === page) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide bottom navigation
    var bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.style.display = S.username && authPages.indexOf(page) === -1 ? 'flex' : 'none';
    }
    
    // Show/hide wallpaper FAB
    var wpFab = document.getElementById('wpFab');
    if (wpFab) {
        wpFab.style.display = S.username && authPages.indexOf(page) === -1 ? 'flex' : 'none';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Render page content - NO diary case
    renderPageContent(page, data);
}

// ============================================================
// RENDER PAGE CONTENT - No diary auto-redirect
// ============================================================
function renderPageContent(page, data) {
    switch(page) {
        case 'social':
            if (typeof renderSocial === 'function') renderSocial();
            if (typeof renderStories === 'function') renderStories();
            break;
        case 'videos':
            if (typeof renderVideos === 'function') renderVideos();
            break;
        case 'chat':
            if (typeof renderChatList === 'function') renderChatList();
            break;
        case 'profile':
            if (typeof renderProfile === 'function') renderProfile();
            break;
        case 'home':
            if (typeof renderHome === 'function') renderHome();
            break;
        case 'users':
            if (typeof renderUsers === 'function') renderUsers();
            break;
        case 'wallpapers':
            if (typeof renderWallpapers === 'function') renderWallpapers();
            break;
        case 'select':
            if (typeof renderAuraGrid === 'function') renderAuraGrid();
            break;
        case 'routine':
            if (typeof renderRoutines === 'function') renderRoutines();
            break;
        case 'notifications':
            if (typeof renderNotifications === 'function') renderNotifications();
            break;
        case 'groups':
            if (typeof renderGroups === 'function') renderGroups();
            break;
        case 'bookmarks':
            if (typeof renderBookmarks === 'function') renderBookmarks();
            break;
        case 'userprofile':
            if (data && typeof renderUserProfile === 'function') {
                viewingProfile = data;
                renderUserProfile(data);
            }
            break;
        case 'landing':
        case 'login':
        case 'signup':
            // These pages don't need rendering
            break;
    }
}

// ============================================================
// DIALOG SYSTEM
// ============================================================
function showDialog(options) {
    return new Promise(function(resolve) {
        var overlay = document.getElementById('dialogOverlay');
        var emoji = document.getElementById('dialogEmoji');
        var title = document.getElementById('dialogTitle');
        var subtitle = document.getElementById('dialogSubtitle');
        var input = document.getElementById('dialogInput');
        var cancelBtn = document.getElementById('dialogCancel');
        var confirmBtn = document.getElementById('dialogConfirm');
        var backBtn = document.getElementById('dialogBack');
        
        if (!overlay || !emoji || !title || !subtitle || !input || !cancelBtn || !confirmBtn) {
            console.error('Dialog elements not found');
            resolve(null);
            return;
        }
        
        backBtn.style.display = options.showBack ? 'flex' : 'none';
        input.style.display = options.htmlSubtitle ? 'none' : 'block';
        cancelBtn.style.display = options.noCancel ? 'none' : 'block';
        
        emoji.textContent = options.emoji || '💬';
        title.textContent = options.title || 'Dialog';
        
        if (options.htmlSubtitle) {
            subtitle.innerHTML = options.htmlSubtitle;
        } else {
            subtitle.textContent = options.subtitle || '';
        }
        
        input.value = options.defaultValue || '';
        input.placeholder = options.placeholder || 'Type here...';
        input.type = options.type || 'text';
        
        cancelBtn.textContent = options.cancelText || 'Cancel';
        confirmBtn.textContent = options.confirmText || 'Confirm';
        
        confirmBtn.className = 'dialog-confirm';
        if (options.danger) {
            confirmBtn.className = 'dialog-danger';
        }
        
        overlay.classList.add('active');
        
        if (!options.htmlSubtitle) {
            setTimeout(function() {
                input.focus();
                if (options.defaultValue) {
                    input.select();
                }
            }, 100);
        }
        
        var cleanup = function() {
            overlay.classList.remove('active');
            cancelBtn.onclick = null;
            confirmBtn.onclick = null;
            input.onkeypress = null;
            overlay.onclick = null;
            backBtn.onclick = null;
        };
        
        cancelBtn.onclick = function(e) { e.preventDefault(); cleanup(); resolve(null); };
        confirmBtn.onclick = function(e) { e.preventDefault(); cleanup(); resolve(options.htmlSubtitle ? 'close' : input.value); };
        input.onkeypress = function(e) { if (e.key === 'Enter' && !options.htmlSubtitle) { e.preventDefault(); cleanup(); resolve(input.value); } };
        overlay.onclick = function(e) { if (e.target === overlay && !options.noOverlayClose) { cleanup(); resolve(null); } };
        backBtn.onclick = function(e) { e.preventDefault(); cleanup(); resolve(null); };
    });
}

// ============================================================
// CLOSE DIALOG
// ============================================================
function closeDialog() {
    var overlay = document.getElementById('dialogOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================================
// POST DETAIL VIEW
// ============================================================
function viewPostDetail(postId) {
    var post = (S.socialPosts || []).find(function(p) { return p.id === postId; });
    
    if (!post) { toast('Post not found'); return; }
    
    var overlay = document.getElementById('postDetailOverlay');
    var body = document.getElementById('postDetailBody');
    
    if (!overlay || !body) return;
    
    if (!post.likes) post.likes = [];
    if (!post.comments) post.comments = [];
    
    var liked = post.likes.indexOf(S.username) > -1;
    var bookmarked = (S.bookmarks || []).some(function(b) { return b.id === postId; });
    var likeCount = post.likes.length;
    var commentCount = post.comments.length;
    var timeAgo = typeof timeSince === 'function' ? timeSince(new Date(post.time)) : 'recently';
    
    var avatarDisplay = '';
    if (post.avatar && (post.avatar.startsWith('data:') || post.avatar.includes('http'))) {
        avatarDisplay = '<img src="' + post.avatar + '" style="width:36px;height:36px;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = typeof getColor === 'function' ? getColor(post.author) : '#6366f1';
        avatarDisplay = '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + post.author.charAt(0).toUpperCase() + '</div>';
    }
    
    var html = '';
    html += '<button class="post-detail-back" onclick="closePostDetail()">← <span>Back</span></button>';
    
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;">';
    html += '<div class="profile-bubble" onclick="closePostDetail();viewUserProfile(\'' + post.author + '\')">';
    html += '<div class="pb-avatar">' + avatarDisplay + '</div>';
    html += '<span class="pb-name">' + escapeHtml(post.author) + '</span>';
    html += '</div>';
    html += '<span style="font-size:11px;color:#94a3b8;margin-left:auto;">' + timeAgo + '</span>';
    if (post.author === S.username) {
        html += '<button class="btn-sm btn-danger" onclick="deletePost(\'' + post.id + '\');closePostDetail();">🗑️</button>';
    }
    html += '</div>';
    
    if (post.image) {
        html += '<img src="' + post.image + '" style="width:100%;max-height:60vh;object-fit:contain;border-radius:12px;margin:8px 0;background:#000;" />';
    }
    
    if (post.text) {
        html += '<div style="padding:8px 0;"><p style="font-size:15px;">' + escapeHtml(post.text) + '</p></div>';
    }
    
    html += '<div style="display:flex;align-items:center;gap:14px;padding:8px 0;">';
    html += '<button class="ig-post-action' + (liked ? ' liked' : '') + '" onclick="likePost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},300);" style="font-size:22px;">' + (liked ? '❤️' : '🤍') + '</button>';
    html += '<span style="font-weight:600;">' + likeCount + '</span>';
    html += '<button class="ig-post-action" onclick="commentOnPost(\'' + post.id + '\');setTimeout(function(){viewPostDetail(\'' + post.id + '\');},500);" style="font-size:22px;">💬</button>';
    html += '<span style="font-weight:600;">' + commentCount + '</span>';
    html += '<button class="ig-post-action' + (bookmarked ? ' bookmarked' : '') + '" onclick="bookmarkItem(\'' + post.id + '\',\'post\');closePostDetail();" style="font-size:22px;">🔖</button>';
    if (post.image) {
        html += '<button class="ig-post-action" onclick="downloadMedia(\'' + post.image + '\')" style="font-size:22px;">⬇️</button>';
    }
    html += '</div>';
    
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;"><strong>Comments (' + commentCount + ')</strong></div>';
    if (post.comments.length > 0) {
        post.comments.forEach(function(c) {
            html += '<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><strong>' + escapeHtml(c.username) + '</strong> <span style="font-size:10px;color:#94a3b8;">' + timeSince(new Date(c.time)) + '</span><br>' + escapeHtml(c.text) + '</div>';
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:16px;">No comments yet</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================================
// CLOSE POST DETAIL
// ============================================================
function closePostDetail() {
    var overlay = document.getElementById('postDetailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// ============================================================
// BACK BUTTON HANDLER (mobile)
// ============================================================
window.addEventListener('popstate', function(e) {
    if (S.username) {
        navigate('social');
    } else {
        navigate('landing');
    }
});

// ============================================================
// INITIALIZE NAVIGATION
// ============================================================
function initNavigation() {
    if (window.history && window.history.pushState) {
        window.history.pushState({ page: 'landing' }, '', window.location.href);
    }
    console.log('🧭 Navigation initialized');
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.navigate = navigate;
window.showDialog = showDialog;
window.closeDialog = closeDialog;
window.viewPostDetail = viewPostDetail;
window.closePostDetail = closePostDetail;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
});

console.log('🧭 Navigation module loaded');