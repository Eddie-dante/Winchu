// App Initialization - With Firebase Auth

function initAll() {
    try {
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
        
        setInterval(() => {
            if (S && S.username) {
                setData('users/' + S.username + '/last_seen', new Date().toISOString());
            }
        }, 30000);
        
        console.log('✅ All features initialized');
    } catch (e) {
        console.error('Init error:', e);
    }
}

function initApp() {
    // First, ensure Firebase Auth is ready
    waitForAuth().then(() => {
        const auth = localStorage.getItem('winchu_auth');
        
        if (auth) {
            try {
                const data = JSON.parse(auth);
                if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                    loadState();
                    
                    if (S.username === data.username) {
                        setupPresence();
                        loadUserData(data.username);
                        
                        if (S.wallpaper) {
                            document.body.style.backgroundImage = `url(${S.wallpaper})`;
                            document.body.style.backgroundSize = 'cover';
                            document.body.style.backgroundPosition = 'center';
                            document.body.style.backgroundAttachment = 'fixed';
                        }
                        
                        document.getElementById('wpFab').style.display = 'flex';
                        document.getElementById('bottomNav').style.display = 'flex';
                        
                        if (S.selectedAuras.length === 0) {
                            navigate('select');
                        } else {
                            navigate('social');
                            initAll();
                        }
                        
                        console.log('✅ Winchu · Nexus ready');
                        return;
                    }
                }
            } catch (e) {
                console.error('Init error:', e);
            }
        }
        
        navigate('landing');
        console.log('👋 Winchu · Nexus - Welcome');
    });
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initApp, 500);
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        navigate('users');
    }
    if (e.key === 'Escape') {
        closeDialog();
        closePostDetail();
    }
});

console.log('⚡ Winchu · Nexus Core Loaded');