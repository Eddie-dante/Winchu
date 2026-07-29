// ============================================================
// APP INITIALIZATION WITH DEBUG
// ============================================================

debugLog('⚡ APP CORE LOADING...');

// ============================================================
// CHECK ALL DEPENDENCIES
// ============================================================
debugLog('📦 Checking dependencies:');
debugLog('  - firebase: ' + (typeof firebase !== 'undefined' ? '✅' : '❌'));
debugLog('  - S: ' + (typeof S !== 'undefined' ? '✅' : '❌'));
debugLog('  - toast: ' + (typeof toast !== 'undefined' ? '✅' : '❌'));
debugLog('  - navigate: ' + (typeof navigate !== 'undefined' ? '✅' : '❌'));
debugLog('  - handleSignup: ' + (typeof handleSignup !== 'undefined' ? '✅' : '❌'));
debugLog('  - handleLogin: ' + (typeof handleLogin !== 'undefined' ? '✅' : '❌'));

// ============================================================
// FORCE FUNCTIONS TO BE GLOBAL
// ============================================================
if (typeof handleSignup !== 'undefined') {
    window.handleSignup = handleSignup;
    debugLog('✅ handleSignup attached to window');
}
if (typeof handleLogin !== 'undefined') {
    window.handleLogin = handleLogin;
    debugLog('✅ handleLogin attached to window');
}

// ============================================================
// APP INITIALIZATION
// ============================================================
function initApp() {
    debugLog('=== INITIALIZING APP ===');
    var auth = localStorage.getItem('wa');
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 86400000)) {
                loadState();
                if (S.username === data.username) {
                    debugLog('✅ Restoring session for: ' + S.username);
                    setupPresence();
                    firebase.database().ref('users/' + S.username).once('value').then(function(snapshot) { 
                        if (snapshot.exists()) { 
                            var d = snapshot.val(); 
                            S.name = d.name || ''; 
                            S.bio = d.bio || 'Building my energy. ⚡'; 
                            S.avatar = d.avatar; 
                            S.wallpaper = d.wallpaper; 
                            S.friends = d.friends || []; 
                            S.bookmarks = d.bookmarks || []; 
                            S.selectedAuras = d.selected_auras || []; 
                            saveState(); 
                            debugLog('✅ User data loaded from Firebase');
                        } 
                    });
                    if (S.wallpaper) { 
                        document.body.style.backgroundImage = 'url(' + S.wallpaper + ')'; 
                        document.body.style.backgroundSize = 'cover'; 
                        document.body.style.backgroundPosition = 'center'; 
                        document.body.style.backgroundAttachment = 'fixed'; 
                    }
                    document.getElementById('wpFab').style.display = 'flex';
                    document.getElementById('bottomNav').style.display = 'flex';
                    
                    if (typeof initAI === 'function') {
                        setTimeout(initAI, 1500);
                    }
                    
                    if (S.selectedAuras.length === 0) { 
                        debugLog('🧭 No auras, navigating to select');
                        navigate('select'); 
                    } else { 
                        debugLog('🧭 Navigating to social');
                        navigate('social'); 
                        initAppData(); 
                    }
                    debugLog('✅ Winchu ready');
                    return;
                }
            }
        } catch(e) { 
            debugLog('❌ Init error: ' + e.message);
        }
    }
    debugLog('🧭 No session, navigating to landing');
    navigate('landing');
}

// ============================================================
// INIT APP DATA
// ============================================================
function initAppData() {
    debugLog('=== INITIALIZING APP DATA ===');
    
    firebase.database().ref('posts').orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.socialPosts = [];
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                var post = data[key]; 
                if (post && post.author) { 
                    post.id = key; 
                    if (!post.likes) post.likes = []; 
                    if (!post.comments) post.comments = []; 
                    S.socialPosts.push(post); 
                } 
            }); 
            S.socialPosts.sort(function(a, b) { 
                return new Date(b.time) - new Date(a.time); 
            }); 
        }
        if (typeof renderSocial === 'function') renderSocial();
        if (typeof renderProfile === 'function') renderProfile();
        if (typeof renderStories === 'function') renderStories();
        saveState();
        debugLog('✅ Posts loaded: ' + S.socialPosts.length);
    });
    
    firebase.database().ref('videos').orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.videoData = [];
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                var video = data[key]; 
                if (video && video.author) { 
                    video.id = key; 
                    if (!video.likes) video.likes = []; 
                    if (!video.comments) video.comments = []; 
                    S.videoData.push(video); 
                } 
            }); 
            S.videoData.sort(function(a, b) { 
                return new Date(b.time) - new Date(a.time); 
            }); 
        }
        if (typeof renderVideos === 'function') renderVideos();
        debugLog('✅ Videos loaded: ' + S.videoData.length);
    });
    
    firebase.database().ref('groups').once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.groups = [];
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                var group = data[key]; 
                group.id = key; 
                if (group.members && group.members.indexOf(S.username) > -1) 
                    S.groups.push(group); 
            }); 
        }
        if (typeof renderGroups === 'function') renderGroups();
        if (typeof renderChatList === 'function') renderChatList();
        debugLog('✅ Groups loaded: ' + S.groups.length);
    });
    
    firebase.database().ref('diary/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.diary = [];
        if (data) S.diary = Object.values(data).reverse();
        var diaryCount = document.getElementById('diaryCount');
        if (diaryCount) diaryCount.textContent = S.diary.length;
        debugLog('✅ Diary entries: ' + S.diary.length);
    });
    
    firebase.database().ref('routines/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.routines = [];
        if (data) S.routines = Object.values(data).reverse();
        debugLog('✅ Routines loaded: ' + S.routines.length);
    });
    
    firebase.database().ref('notifications/' + S.username).orderByChild('time').limitToLast(50).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.notifications = [];
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                var notif = data[key]; 
                if (notif) { 
                    notif.id = key; 
                    S.notifications.push(notif); 
                } 
            }); 
            S.notifications.sort(function(a, b) { 
                return new Date(b.time) - new Date(a.time); 
            }); 
        }
        updateNotifBadge();
        debugLog('✅ Notifications loaded: ' + S.notifications.length);
    });
    
    firebase.database().ref('users/' + S.username + '/bookmarks').once('value').then(function(snapshot) { 
        S.bookmarks = snapshot.val() || []; 
        debugLog('✅ Bookmarks loaded: ' + S.bookmarks.length);
    });
    
    setupPostsListener();
    setupVideosListener();
    setupNotifListener();
    setupGroupsListener();
    if (typeof initWallpapers === 'function') initWallpapers();
    setupPresence();
    
    if (typeof initAI === 'function') {
        setTimeout(initAI, 1500);
    }
    
    setInterval(function() { 
        if (S && S.username) 
            updateData('users/' + S.username, { 
                last_seen: new Date().toISOString(), 
                online: true 
            }); 
    }, 60000);
    
    debugLog('✅ All app data initialized');
}

// ============================================================
// LISTENER SETUP
// ============================================================
function setupPostsListener() {
    if (postsListener) { 
        postsListener.off(); 
        postsListener = null; 
    }
    postsListener = firebase.database().ref('posts');
    postsListener.on('child_added', function(snapshot) { 
        var post = snapshot.val(); 
        if (!post || !post.author) return; 
        post.id = snapshot.key; 
        if (!post.likes) post.likes = []; 
        if (!post.comments) post.comments = []; 
        if (!S.socialPosts.find(function(p) { return p.id === post.id; })) { 
            S.socialPosts.unshift(post); 
            if (S.socialPosts.length > 200) S.socialPosts = S.socialPosts.slice(0, 200); 
            S.socialPosts.sort(function(a, b) { 
                return new Date(b.time) - new Date(a.time); 
            }); 
            if (typeof renderSocial === 'function') renderSocial(); 
            if (typeof renderProfile === 'function') renderProfile(); 
            if (typeof renderStories === 'function') renderStories(); 
            saveState(); 
        } 
    });
    postsListener.on('child_changed', function(snapshot) { 
        var post = snapshot.val(); 
        if (!post) return; 
        post.id = snapshot.key; 
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; }); 
        if (idx > -1) { 
            S.socialPosts[idx] = post; 
            if (typeof renderSocial === 'function') renderSocial(); 
        } 
    });
    postsListener.on('child_removed', function(snapshot) { 
        S.socialPosts = S.socialPosts.filter(function(p) { 
            return p.id !== snapshot.key; 
        }); 
        if (typeof renderSocial === 'function') renderSocial(); 
        if (typeof renderProfile === 'function') renderProfile(); 
    });
}

function setupVideosListener() {
    if (videosListener) { 
        videosListener.off(); 
        videosListener = null; 
    }
    videosListener = firebase.database().ref('videos');
    videosListener.on('child_added', function(snapshot) { 
        var video = snapshot.val(); 
        if (!video || !video.author) return; 
        video.id = snapshot.key; 
        if (!video.likes) video.likes = []; 
        if (!video.comments) video.comments = []; 
        if (!S.videoData.find(function(v) { return v.id === video.id; })) { 
            S.videoData.unshift(video); 
            if (S.videoData.length > 100) S.videoData = S.videoData.slice(0, 100); 
            if (typeof renderVideos === 'function') renderVideos(); 
        } 
    });
    videosListener.on('child_changed', function(snapshot) { 
        var video = snapshot.val(); 
        if (!video) return; 
        video.id = snapshot.key; 
        var idx = S.videoData.findIndex(function(v) { return v.id === video.id; }); 
        if (idx > -1) { 
            S.videoData[idx] = video; 
            if (typeof renderVideos === 'function') renderVideos(); 
        } 
    });
    videosListener.on('child_removed', function(snapshot) { 
        S.videoData = S.videoData.filter(function(v) { 
            return v.id !== snapshot.key; 
        }); 
        if (typeof renderVideos === 'function') renderVideos(); 
    });
}

function setupNotifListener() { 
    if (notifListener) { 
        notifListener.off(); 
        notifListener = null; 
    } 
    if (!S.username) return; 
    notifListener = firebase.database().ref('notifications/' + S.username).orderByChild('time').limitToLast(50); 
    notifListener.on('child_added', function(snapshot) { 
        var notif = snapshot.val(); 
        if (!notif) return; 
        notif.id = snapshot.key; 
        if (!S.notifications.find(function(n) { return n.id === notif.id; })) { 
            S.notifications.unshift(notif); 
            updateNotifBadge(); 
        } 
    }); 
}

function setupGroupsListener() {
    firebase.database().ref('groups').on('child_added', function(snapshot) { 
        var group = snapshot.val(); 
        group.id = snapshot.key; 
        if (group.members && group.members.indexOf(S.username) > -1) { 
            if (!S.groups.find(function(g) { return g.id === group.id; })) { 
                S.groups.push(group); 
                if (typeof renderGroups === 'function') renderGroups(); 
                if (typeof renderChatList === 'function') renderChatList(); 
            } 
        } 
    });
    firebase.database().ref('groups').on('child_changed', function(snapshot) { 
        var group = snapshot.val(); 
        group.id = snapshot.key; 
        if (group.members && group.members.indexOf(S.username) > -1) { 
            var idx = S.groups.findIndex(function(g) { return g.id === group.id; }); 
            if (idx > -1) S.groups[idx] = group; 
            else S.groups.push(group); 
        } else { 
            S.groups = S.groups.filter(function(g) { return g.id !== group.id; }); 
        } 
        if (typeof renderGroups === 'function') renderGroups(); 
        if (typeof renderChatList === 'function') renderChatList(); 
    });
    firebase.database().ref('groups').on('child_removed', function(snapshot) { 
        S.groups = S.groups.filter(function(g) { return g.id !== snapshot.key; }); 
        if (typeof renderGroups === 'function') renderGroups(); 
        if (typeof renderChatList === 'function') renderChatList(); 
    });
}

function updateNotifBadge() {
    var unreadCount = (S.notifications || []).filter(function(n) { 
        return !n.read; 
    }).length;
    var badges = ['notifBadge', 'profileNotifBadge'];
    badges.forEach(function(id) { 
        var badge = document.getElementById(id); 
        if (badge) { 
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount; 
            badge.style.display = unreadCount > 0 ? 'flex' : 'none'; 
        } 
    });
    document.title = unreadCount > 0 ? '(' + unreadCount + ') Winchu · Nexus' : 'Winchu · Nexus';
}

function markAllNotifsRead() {
    if (!S.username) return;
    var unread = S.notifications.filter(function(n) { return !n.read; });
    if (unread.length === 0) { 
        toast('All read'); 
        return; 
    }
    unread.forEach(function(n) { 
        n.read = true; 
        updateData('notifications/' + S.username + '/' + n.id + '/read', true); 
    });
    updateNotifBadge(); 
    if (typeof renderNotifications === 'function') renderNotifications(); 
    toast('✓ All read');
}

function addNotification(to, message, type, refId) { 
    if (!S.username || !to || to === S.username) return; 
    pushData('notifications/' + to, { 
        from: S.username, 
        to: to, 
        message: message, 
        type: type || 'general', 
        refId: refId || '', 
        time: new Date().toISOString(), 
        read: false 
    }); 
}

// ============================================================
// FORCE SYNC USER DATA
// ============================================================
function forceSyncUserData() {
    if (!S.username) {
        debugLog('⚠️ No user logged in to sync');
        return;
    }
    
    debugLog('🔄 Force syncing user data...');
    
    firebase.database().ref('users/' + S.username).once('value')
        .then(function(snapshot) {
            if (snapshot.exists()) {
                var data = snapshot.val();
                S.friends = data.friends || [];
                S.name = data.name || S.name;
                S.bio = data.bio || S.bio;
                S.avatar = data.avatar || S.avatar;
                S.wallpaper = data.wallpaper || S.wallpaper;
                S.bookmarks = data.bookmarks || [];
                S.selectedAuras = data.selected_auras || [];
                S.completedTasks = data.completedTasks || [];
                S.streakData = data.streakData || {};
                saveState();
                
                if (typeof renderProfile === 'function') renderProfile();
                if (typeof renderUsers === 'function') renderUsers();
                if (typeof renderChatList === 'function') renderChatList();
                if (typeof renderSocial === 'function') renderSocial();
                if (typeof renderHome === 'function') renderHome();
                if (typeof renderNotifications === 'function') renderNotifications();
                if (typeof renderGroups === 'function') renderGroups();
                
                debugLog('✅ User data force synced successfully');
                return true;
            } else {
                debugLog('⚠️ User not found in Firebase');
                return false;
            }
        })
        .catch(function(error) {
            debugLog('❌ Force sync error: ' + error.message);
            toast('Error syncing data. Please refresh.');
            return false;
        });
}

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() { 
    debugLog('📄 DOM Ready, initializing app...');
    setTimeout(initApp, 500); 
});

document.addEventListener('keydown', function(e) { 
    if (e.ctrlKey && e.key === 'k') { 
        e.preventDefault(); 
        navigate('users'); 
    } 
    if (e.key === 'Escape') { 
        closeDialog(); 
        closePostDetail(); 
    } 
});

window.addEventListener('online', function() { 
    if (S.username) { 
        setupPresence(); 
        updateData('users/' + S.username, { online: true }); 
        toast('📶 Online'); 
        debugLog('📶 Online'); 
    } 
});

window.addEventListener('offline', function() { 
    if (S.username) 
        updateData('users/' + S.username, { online: false }); 
    toast('⚠️ Offline'); 
    debugLog('⚠️ Offline'); 
});

if ('serviceWorker' in navigator) { 
    window.addEventListener('load', function() { 
        navigator.serviceWorker.register('/service-worker.js').then(function(r) { 
            debugLog('✅ SW registered'); 
        }).catch(function() { 
            debugLog('⚠️ SW registration failed'); 
        }); 
    }); 
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.initApp = initApp;
window.initAppData = initAppData;
window.updateNotifBadge = updateNotifBadge;
window.markAllNotifsRead = markAllNotifsRead;
window.addNotification = addNotification;
window.forceSyncUserData = forceSyncUserData;

debugLog('⚡ App Core Loaded');
debugLog('📌 handleSignup type: ' + typeof window.handleSignup);
debugLog('📌 handleLogin type: ' + typeof window.handleLogin);