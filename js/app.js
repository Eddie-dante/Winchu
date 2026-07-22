// App Initialization

function initAll() {
    loadVideos();
    initWallpapers();
    setupPostsListener();
    setupNotifListener();
    loadGroups();
    renderChatList();
    renderProfile();
    renderHome();
    renderSocial();
    renderDiary();
    renderRoutines();
    renderGroups();
    
    // Update online status every 30 seconds
    setInterval(() => {
        if (S.username) {
            setData('users/' + S.username + '/last_seen', new Date().toISOString());
        }
    }, 30000);
}

function initApp() {
    const auth = localStorage.getItem('winchu_auth');
    
    if (auth) {
        try {
            const data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                // Valid session
                loadState();
                
                if (S.username === data.username) {
                    setupPresence();
                    loadUserData(data.username);
                    
                    // Apply wallpaper if set
                    if (S.wallpaper) {
                        document.body.style.backgroundImage = `url(${S.wallpaper})`;
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundPosition = 'center';
                        document.body.style.backgroundAttachment = 'fixed';
                    }
                    
                    // Show UI elements
                    document.getElementById('wpFab').style.display = 'flex';
                    document.getElementById('bottomNav').style.display = 'flex';
                    
                    // Navigate to appropriate page
                    if (S.selectedAuras.length === 0) {
                        navigate('select');
                    } else {
                        navigate('social');
                        initAll();
                    }
                    
                    console.log('✅ Winchu · Nexus initialized');
                    return;
                }
            }
        } catch (e) {
            console.error('Init error:', e);
        }
    }
    
    // No valid session, show landing
    navigate('landing');
    console.log('👋 Winchu · Nexus - Welcome');
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initApp, 300);
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K for search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        navigate('users');
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeDialog();
        closePostDetail();
    }
});

// Handle window resize for responsive layout
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-render current page if needed
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            if (pageId === 'videos') renderVideos();
            if (pageId === 'wallpapers') renderWallpapers();
        }
    }, 250);
});

console.log('⚡ Winchu · Nexus Core Loaded');