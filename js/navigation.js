// Navigation System
function navigate(page, data) {
    const authPages = ['landing', 'login', 'signup'];
    if (!authPages.includes(page) && !S.username) {
        toast('Please log in first');
        page = 'landing';
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Show/hide bottom nav
    const nav = document.getElementById('bottomNav');
    if (nav) {
        nav.style.display = S.username && !authPages.includes(page) ? 'flex' : 'none';
    }

    // Show/hide wallpaper FAB
    const fab = document.getElementById('wpFab');
    if (fab) fab.style.display = S.username ? 'flex' : 'none';

    window.scrollTo(0, 0);

    // Render page content
    switch (page) {
        case 'social': renderSocial(); break;
        case 'videos': renderVideos(); break;
        case 'chat': renderChatList(); break;
        case 'profile': renderProfile(); break;
        case 'home': renderHome(); break;
        case 'users': renderUsers(); break;
        case 'diary': renderDiary(); break;
        case 'wallpapers': renderWallpapers(); break;
        case 'select': renderAuraGrid(); break;
        case 'routine': renderRoutines(); break;
        case 'notifications': renderNotifications(); break;
        case 'groups': renderGroups(); break;
        case 'bookmarks': renderBookmarks(); break;
        case 'userprofile':
            if (data) { viewingProfile = data; renderUserProfile(data); }
            break;
    }
}

// Dialog System
function showDialog(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('dialogOverlay');
        const emoji = document.getElementById('dialogEmoji');
        const title = document.getElementById('dialogTitle');
        const subtitle = document.getElementById('dialogSubtitle');
        const input = document.getElementById('dialogInput');
        const cancelBtn = document.getElementById('dialogCancel');
        const confirmBtn = document.getElementById('dialogConfirm');
        const backBtn = document.getElementById('dialogBack');

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
        input.placeholder = options.placeholder || '';
        input.type = options.type || 'text';
        
        cancelBtn.textContent = options.cancelText || 'Cancel';
        confirmBtn.textContent = options.confirmText || 'Confirm';
        confirmBtn.className = options.danger ? 'dialog-danger' : 'dialog-confirm';

        overlay.classList.add('active');
        
        if (!options.htmlSubtitle) {
            setTimeout(() => { input.focus(); input.select(); }, 100);
        }

        const cleanup = () => { overlay.classList.remove('active'); };
        
        cancelBtn.onclick = () => { cleanup(); resolve(null); };
        confirmBtn.onclick = () => { cleanup(); resolve(options.htmlSubtitle ? 'close' : input.value); };
        input.onkeypress = (e) => { if (e.key === 'Enter' && !options.htmlSubtitle) { cleanup(); resolve(input.value); } };
        overlay.onclick = (e) => { if (e.target === overlay && !options.noOverlayClose) { cleanup(); resolve(null); } };
        backBtn.onclick = () => { cleanup(); resolve(null); };
    });
}

function closeDialog() {
    document.getElementById('dialogOverlay').classList.remove('active');
}

function closePostDetail() {
    document.getElementById('postDetailOverlay').classList.remove('active');
    document.body.style.overflow = '';
}