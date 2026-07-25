// App Initialization - Complete

// ============================================================
// INITIALIZE ALL APP DATA
// ============================================================
function initAppData() {
    console.log('=== INITIALIZING APP DATA ===');
    
    // Show loading indicator
    toast('Loading your feed...');
    
    // Load all posts from Firebase
    getRef('posts').orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
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
        
        console.log('Loaded ' + S.socialPosts.length + ' posts');
        if (typeof renderSocial === 'function') renderSocial();
        if (typeof renderProfile === 'function') renderProfile();
        if (typeof renderStories === 'function') renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Load all videos from Firebase
    getRef('videos').orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' videos in database');
            
            keys.forEach(function(key) {
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
        
        console.log('Loaded ' + S.videoData.length + ' videos');
        if (typeof renderVideos === 'function') renderVideos();
    }).catch(function(error) {
        console.error('Error loading videos:', error);
    });
    
    // Load groups
    getRef('groups').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.groups = [];
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var group = data[key];
                group.id = key;
                if (group.members && group.members.indexOf(S.username) > -1) {
                    S.groups.push(group);
                }
            });
        }
        
        console.log('Loaded ' + S.groups.length + ' groups');
        if (typeof renderGroups === 'function') renderGroups();
        if (typeof renderChatList === 'function') renderChatList();
    }).catch(function(error) {
        console.error('Error loading groups:', error);
    });
    
    // Load diary entries
    getRef('diary/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.diary = [];
        if (data) {
            S.diary = Object.values(data).reverse();
        }
        if (typeof renderDiary === 'function') renderDiary();
    });
    
    // Load routines
    getRef('routines/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.routines = [];
        if (data) {
            S.routines = Object.values(data).reverse();
        }
        if (typeof renderRoutines === 'function') renderRoutines();
    });
    
    // Load notifications
    getRef('notifications/' + S.username).orderByChild('time').limitToLast(50).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.notifications = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var notif = data[key];
                if (notif) { notif.id = key; S.notifications.push(notif); }
            });
            S.notifications.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        updateNotifBadge();
    });
    
    // Load bookmarks
    getRef('users/' + S.username + '/bookmarks').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.bookmarks = data || [];
    });
    
    // Setup real-time listeners
    setupPostsListener();
    setupVideosListener();
    setupNotifListener();
    setupGroupsListener();
    
    // Initialize wallpapers
    if (typeof initWallpapers === 'function') initWallpapers();
    
    // Setup presence
    setupPresence();
    
    // Periodic online status update
    setInterval(function() {
        if (S && S.username) {
            updateData('users/' + S.username, {
                last_seen: new Date().toISOString(),
                online: true
            });
        }
    }, 60000);
    
    console.log('✅ All app data initialized');
}

// ============================================================
// SETUP POSTS REAL-TIME LISTENER
// ============================================================
function setupPostsListener() {
    if (postsListener) { postsListener.off(); postsListener = null; }
    
    postsListener = getRef('posts');
    
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        var existing = S.socialPosts.find(function(p) { return p.id === post.id; });
        if (!existing) {
            console.log('New post detected:', post.id, 'by', post.author);
            S.socialPosts.unshift(post);
            if (S.socialPosts.length > 200) S.socialPosts = S.socialPosts.slice(0, 200);
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
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
        if (idx > -1) { S.socialPosts[idx] = post; if (typeof renderSocial === 'function') renderSocial(); }
    });
    
    postsListener.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        if (typeof renderSocial === 'function') renderSocial();
        if (typeof renderProfile === 'function') renderProfile();
    });
    
    console.log('📱 Posts listener active');
}

// ============================================================
// SETUP VIDEOS REAL-TIME LISTENER
// ============================================================
function setupVideosListener() {
    if (videosListener) { videosListener.off(); videosListener = null; }
    
    videosListener = getRef('videos');
    
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
        if (idx > -1) { S.videoData[idx] = video; if (typeof renderVideos === 'function') renderVideos(); }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; });
        if (typeof renderVideos === 'function') renderVideos();
    });
    
    console.log('🎬 Videos listener active');
}

// ============================================================
// SETUP NOTIFICATIONS REAL-TIME LISTENER
// ============================================================
function setupNotifListener() {
    if (notifListener) { notifListener.off(); notifListener = null; }
    if (!S.username) return;
    
    notifListener = getRef('notifications/' + S.username).orderByChild('time').limitToLast(50);
    
    notifListener.on('child_added', function(snapshot) {
        var notif = snapshot.val();
        if (!notif) return;
        notif.id = snapshot.key;
        
        if (!S.notifications.find(function(n) { return n.id === notif.id; })) {
            S.notifications.unshift(notif);
            updateNotifBadge();
        }
    });
    
    console.log('🔔 Notifications listener active');
}

// ============================================================
// SETUP GROUPS REAL-TIME LISTENER
// ============================================================
function setupGroupsListener() {
    getRef('groups').on('child_added', function(snapshot) {
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
    
    getRef('groups').on('child_changed', function(snapshot) {
        var group = snapshot.val();
        group.id = snapshot.key;
        if (group.members && group.members.indexOf(S.username) > -1) {
            var idx = S.groups.findIndex(function(g) { return g.id === group.id; });
            if (idx > -1) { S.groups[idx] = group; }
            else { S.groups.push(group); }
        } else {
            S.groups = S.groups.filter(function(g) { return g.id !== group.id; });
        }
        if (typeof renderGroups === 'function') renderGroups();
        if (typeof renderChatList === 'function') renderChatList();
    });
    
    getRef('groups').on('child_removed', function(snapshot) {
        S.groups = S.groups.filter(function(g) { return g.id !== snapshot.key; });
        if (typeof renderGroups === 'function') renderGroups();
        if (typeof renderChatList === 'function') renderChatList();
    });
    
    console.log('👥 Groups listener active');
}

// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================
function updateNotifBadge() {
    var unreadCount = (S.notifications || []).filter(function(n) { return !n.read; }).length;
    
    var badges = ['notifBadge', 'profileNotifBadge'];
    badges.forEach(function(id) {
        var badge = document.getElementById(id);
        if (badge) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
    
    if (unreadCount > 0) {
        document.title = '(' + unreadCount + ') Winchu · Nexus';
    } else {
        document.title = 'Winchu · Nexus';
    }
}

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================
function markAllNotifsRead() {
    if (!S.username) return;
    
    var unreadNotifs = S.notifications.filter(function(n) { return !n.read; });
    
    if (unreadNotifs.length === 0) {
        toast('All notifications are already read');
        return;
    }
    
    unreadNotifs.forEach(function(notif) {
        notif.read = true;
        updateData('notifications/' + S.username + '/' + notif.id + '/read', true);
    });
    
    updateNotifBadge();
    if (typeof renderNotifications === 'function') renderNotifications();
    toast('All notifications marked as read ✓');
}

// ============================================================
// ADD NOTIFICATION
// ============================================================
function addNotification(to, message, type, refId) {
    if (!S.username || !to) return;
    if (to === S.username) return;
    
    var notification = {
        from: S.username,
        to: to,
        message: message,
        type: type || 'general',
        refId: refId || '',
        time: new Date().toISOString(),
        read: false
    };
    
    pushData('notifications/' + to, notification).then(function() {
        console.log('Notification sent to:', to);
    }).catch(function(error) {
        console.error('Error sending notification:', error);
    });
}

// ============================================================
// INITIALIZE APP
// ============================================================
function initApp() {
    console.log('=== INITIALIZING APP ===');
    
    var auth = localStorage.getItem('wa');
    
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                loadState();
                
                if (S.username === data.username) {
                    console.log('Restoring session for:', S.username);
                    
                    setupPresence();
                    
                    // Load user data from Firebase
                    getRef('users/' + S.username).once('value').then(function(snapshot) {
                        if (snapshot.exists()) {
                            var userData = snapshot.val();
                            S.name = userData.name || '';
                            S.bio = userData.bio || 'Building my energy. One aura at a time. ⚡';
                            S.avatar = userData.avatar || null;
                            S.wallpaper = userData.wallpaper || null;
                            S.friends = userData.friends || [];
                            S.bookmarks = userData.bookmarks || [];
                            S.selectedAuras = userData.selected_auras || [];
                            saveState();
                        }
                    });
                    
                    // Apply wallpaper
                    if (S.wallpaper) {
                        document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundPosition = 'center';
                        document.body.style.backgroundAttachment = 'fixed';
                    }
                    
                    // Show UI
                    var wpFab = document.getElementById('wpFab');
                    var bottomNav = document.getElementById('bottomNav');
                    if (wpFab) wpFab.style.display = 'flex';
                    if (bottomNav) bottomNav.style.display = 'flex';
                    
                    // Navigate
                    if (S.selectedAuras.length === 0) {
                        navigate('select');
                    } else {
                        navigate('social');
                        initAppData();
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
    console.log('👋 Welcome to Winchu · Nexus');
}

// ============================================================
// START APP WHEN DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initApp, 500);
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
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

// ============================================================
// WINDOW RESIZE HANDLER
// ============================================================
var resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        var activePage = document.querySelector('.page.active');
        if (activePage) {
            var pageId = activePage.id.replace('page-', '');
            if (pageId === 'videos') renderVideos();
            if (pageId === 'wallpapers') renderWallpapers();
        }
    }, 250);
});

// ============================================================
// ONLINE/OFFLINE HANDLERS
// ============================================================
window.addEventListener('online', function() {
    console.log('📶 Back online');
    if (S.username) {
        setupPresence();
        updateData('users/' + S.username, { online: true });
        toast('📶 Back online');
    }
});

window.addEventListener('offline', function() {
    console.log('📶 Went offline');
    if (S.username) {
        updateData('users/' + S.username, { online: false });
    }
    toast('⚠️ You are offline. Some features may not work.');
});

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
            console.log('ServiceWorker registered:', registration.scope);
        }).catch(function(error) {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.initApp = initApp;
window.initAppData = initAppData;
window.setupPostsListener = setupPostsListener;
window.setupVideosListener = setupVideosListener;
window.setupNotifListener = setupNotifListener;
window.setupGroupsListener = setupGroupsListener;
window.updateNotifBadge = updateNotifBadge;
window.markAllNotifsRead = markAllNotifsRead;
window.addNotification = addNotification;

console.log('⚡ Winchu · Nexus Core Loaded - Version 2.0');