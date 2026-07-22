// App Initialization - With retry logic

let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

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
        
        // Update online status every 30 seconds
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
    const auth = localStorage.getItem('winchu_auth');
    
    if (auth) {
        try {
            const data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                loadState();
                
                if (S.username === data.username) {
                    // Check database connection first
                    if (database) {
                        database.ref('.info/connected').once('value', (snap) => {
                            if (snap.val() === true) {
                                // Connected - proceed with login
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
                            } else {
                                // Not connected - retry
                                retryInit(data);
                            }
                        });
                    } else {
                        retryInit(data);
                    }
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

function retryInit(data) {
    initAttempts++;
    if (initAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`Retrying init... attempt ${initAttempts}`);
        setTimeout(() => initApp(), 1000 * initAttempts);
    } else {
        console.log('Max retries reached. Showing landing page.');
        // Load from local state and continue offline
        if (S.username === data.username) {
            document.getElementById('wpFab').style.display = 'flex';
            document.getElementById('bottomNav').style.display = 'flex';
            
            if (S.selectedAuras.length === 0) {
                navigate('select');
            } else {
                navigate('social');
                // Try to render with cached data
                renderSocial();
                renderProfile();
                renderHome();
                renderChatList();
            }
            toast('⚠️ Working offline. Some features limited.');
        } else {
            navigate('landing');
        }
    }
}

function loadUserData(username) {
    if (!database) return;
    
    getRef('users/' + username).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            S.name = data.name || '';
            S.bio = data.bio || S.bio;
            S.avatar = data.avatar || null;
            S.wallpaper = data.wallpaper || null;
            S.friends = data.friends || [];
            S.bookmarks = data.bookmarks || [];
            saveState();
        }
    });
    
    getRef('diary/' + username).orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            S.diary = Object.values(snapshot.val()).reverse();
            if (typeof renderDiary === 'function') renderDiary();
        }
    });
    
    getRef('routines/' + username).orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            S.routines = Object.values(snapshot.val()).reverse();
            if (typeof renderRoutines === 'function') renderRoutines();
        }
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

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            if (pageId === 'videos') renderVideos();
            if (pageId === 'wallpapers') renderWallpapers();
        }
    }, 250);
});

console.log('⚡ Winchu · Nexus Core Loaded');