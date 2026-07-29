// App Initialization - Optimized with Video Loading Fix

console.log('⚡ App Core Loading...');

// ============================================================
// DEBOUNCE HELPER
// ============================================================
function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================
// APP INITIALIZATION
// ============================================================
function initApp() {
    console.log('=== INITIALIZING APP ===');
    console.log('S object exists:', typeof S !== 'undefined');
    
    if (typeof S === 'undefined') {
        console.error('❌ S is not defined! Please check state.js');
        // Try to reload state
        if (typeof loadState === 'function') {
            loadState();
        }
        if (typeof S === 'undefined') {
            // Create S if still missing
            window.S = {
                username: null,
                name: '',
                bio: 'Building my energy. One aura at a time. ⚡',
                wallpaper: null,
                selectedAuras: [],
                avatar: null,
                friends: [],
                completedTasks: [],
                streakData: {},
                socialPosts: [],
                diary: [],
                routines: [],
                videoData: [],
                bookmarks: [],
                notifications: [],
                groups: []
            };
            console.log('⚠️ S was recreated');
        }
    }
    
    var auth = localStorage.getItem('wa');
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 86400000)) {
                if (typeof loadState === 'function') {
                    loadState();
                }
                if (S && S.username === data.username) {
                    console.log('Restoring session for:', S.username);
                    if (typeof setupPresence === 'function') setupPresence();
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
                            if (typeof saveState === 'function') saveState(); 
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
                    
                    if (S.selectedAuras && S.selectedAuras.length === 0) { 
                        if (typeof navigate === 'function') navigate('select'); 
                    } else { 
                        if (typeof navigate === 'function') {
                            navigate('social'); 
                            setTimeout(initAppData, 300);
                        }
                    }
                    console.log('✅ Winchu ready');
                    return;
                }
            }
        } catch(e) { 
            console.error('Init error:', e); 
        }
    }
    if (typeof navigate === 'function') {
        navigate('landing');
    } else {
        console.error('❌ navigate not available');
    }
}

// ============================================================
// INIT APP DATA - OPTIMIZED
// ============================================================
function initAppData() {
    console.log('=== INITIALIZING APP DATA ===');
    
    // Load posts (limit to 50 for performance)
    firebase.database().ref('posts').orderByChild('time').limitToLast(50).once('value').then(function(snapshot) {
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
        if (typeof saveState === 'function') saveState();
    });
    
    // Load videos - FIXED: Call loadVideos directly
    if (typeof loadVideos === 'function') {
        setTimeout(function() {
            loadVideos();
            console.log('🎬 Videos loaded via initAppData');
        }, 200);
    } else {
        console.warn('⚠️ loadVideos function not available');
        firebase.database().ref('videos').orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
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
        });
    }
    
    // Load groups
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
    });
    
    // Load diary (limit to 20)
    firebase.database().ref('diary/' + S.username).orderByKey().limitToLast(20).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.diary = [];
        if (data) S.diary = Object.values(data).reverse();
        var diaryCount = document.getElementById('diaryCount');
        if (diaryCount) diaryCount.textContent = S.diary.length;
    });
    
    // Load routines
    firebase.database().ref('routines/' + S.username).orderByKey().limitToLast(20).once('value').then(function(snapshot) {
        var data = snapshot.val(); 
        S.routines = [];
        if (data) S.routines = Object.values(data).reverse();
    });
    
    // Load notifications (limit to 20)
    firebase.database().ref('notifications/' + S.username).orderByChild('time').limitToLast(20).once('value').then(function(snapshot) {
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
        if (typeof updateNotifBadge === 'function') updateNotifBadge();
    });
    
    firebase.database().ref('users/' + S.username + '/bookmarks').once('value').then(function(snapshot) { 
        S.bookmarks = snapshot.val() || []; 
    });
    
    if (typeof setupPostsListener === 'function') setupPostsListener();
    if (typeof setupVideosListener === 'function') setupVideosListener();
    if (typeof setupNotifListener === 'function') setupNotifListener();
    if (typeof setupGroupsListener === 'function') setupGroupsListener();
    if (typeof initWallpapers === 'function') initWallpapers();
    if (typeof setupPresence === 'function') setupPresence();
    
    if (typeof initAI === 'function') {
        setTimeout(initAI, 1500);
    }
    
    setInterval(function() { 
        if (S && S.username && typeof updateData === 'function') 
            updateData('users/' + S.username, { 
                last_seen: new Date().toISOString(), 
                online: true 
            }); 
    }, 60000);
    
    console.log('✅ All app data initialized');
}

// ============================================================
// NOTIFICATION BADGE
// ============================================================
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

// ============================================================
// MARK ALL NOTIFICATIONS READ
// ============================================================
function markAllNotifsRead() {
    if (!S.username) return;
    var unread = S.notifications.filter(function(n) { return !n.read; });
    if (unread.length === 0) { 
        toast('All read'); 
        return; 
    }
    unread.forEach(function(n) { 
        n.read = true; 
        if (typeof updateData === 'function') 
            updateData('notifications/' + S.username + '/' + n.id + '/read', true); 
    });
    updateNotifBadge(); 
    if (typeof renderNotifications === 'function') renderNotifications(); 
    toast('✓ All read');
}

// ============================================================
// ADD NOTIFICATION
// ============================================================
function addNotification(to, message, type, refId) { 
    if (!S.username || !to || to === S.username) return; 
    if (typeof pushData === 'function') {
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
}

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() { 
    console.log('📄 DOM Ready');
    setTimeout(initApp, 300); 
});

document.addEventListener('keydown', function(e) { 
    if (e.ctrlKey && e.key === 'k') { 
        e.preventDefault(); 
        if (typeof navigate === 'function') navigate('users'); 
    } 
    if (e.key === 'Escape') { 
        if (typeof closeDialog === 'function') closeDialog(); 
        if (typeof closePostDetail === 'function') closePostDetail(); 
    } 
});

window.addEventListener('online', function() { 
    if (S && S.username) { 
        if (typeof setupPresence === 'function') setupPresence(); 
        if (typeof updateData === 'function') 
            updateData('users/' + S.username, { online: true }); 
        toast('📶 Online'); 
        console.log('📶 Online'); 
    } 
});

window.addEventListener('offline', function() { 
    if (S && S.username) {
        if (typeof updateData === 'function') 
            updateData('users/' + S.username, { online: false }); 
    }
    toast('⚠️ Offline'); 
    console.log('⚠️ Offline'); 
});

// Service Worker
if ('serviceWorker' in navigator) { 
    window.addEventListener('load', function() { 
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(r) { 
                console.log('✅ Service Worker registered'); 
            })
            .catch(function() { 
                console.log('⚠️ Service Worker registration failed'); 
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
window.debounce = debounce;

console.log('⚡ App Core Loaded (Optimized)');
console.log('📌 S object exists:', typeof S !== 'undefined');
console.log('📌 handleSignup type:', typeof handleSignup);
console.log('📌 handleLogin type:', typeof handleLogin);