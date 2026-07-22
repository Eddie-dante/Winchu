// App Initialization - Complete and Working

var postsListener = null;
var videosListener = null;
var notifListener = null;

// ============================================================
// INITIALIZE ALL APP DATA
// ============================================================
function initAppData() {
    console.log('=== LOADING ALL DATA ===');
    
    // Load posts
    firebase.database().ref('posts').orderByChild('time').limitToLast(200).once('value').then(function(snap) {
        var data = snap.val();
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
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Posts loaded:', S.socialPosts.length);
        if (typeof renderSocial === 'function') renderSocial();
        if (typeof renderProfile === 'function') renderProfile();
        if (typeof renderStories === 'function') renderStories();
    });
    
    // Load videos
    firebase.database().ref('videos').orderByChild('time').limitToLast(100).once('value').then(function(snap) {
        var data = snap.val();
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
            S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Videos loaded:', S.videoData.length);
        if (typeof renderVideos === 'function') renderVideos();
    });
    
    // Load groups
    firebase.database().ref('groups').once('value').then(function(snap) {
        var data = snap.val();
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
        if (typeof renderGroups === 'function') renderGroups();
        if (typeof renderChatList === 'function') renderChatList();
    });
    
    // Load notifications
    firebase.database().ref('notifications/' + S.username).orderByChild('time').limitToLast(50).once('value').then(function(snap) {
        var data = snap.val();
        S.notifications = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var n = data[key];
                if (n) { n.id = key; S.notifications.push(n); }
            });
            S.notifications.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        updateNotifBadge();
    });
    
    // Setup real-time listeners
    setupRealtimeListeners();
    
    // Init wallpapers
    if (typeof initWallpapers === 'function') initWallpapers();
    
    // Setup presence
    setupPresence();
    
    console.log('✅ All data loaded');
}

// ============================================================
// SETUP REAL-TIME LISTENERS
// ============================================================
function setupRealtimeListeners() {
    // Posts listener
    if (postsListener) postsListener.off();
    postsListener = firebase.database().ref('posts');
    postsListener.on('child_added', function(snap) {
        var post = snap.val();
        if (!post || !post.author) return;
        post.id = snap.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        if (!S.socialPosts.find(function(p) { return p.id === post.id; })) {
            S.socialPosts.unshift(post);
            if (typeof renderSocial === 'function') renderSocial();
        }
    });
    postsListener.on('child_changed', function(snap) {
        var post = snap.val(); if (!post) return; post.id = snap.key;
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) { S.socialPosts[idx] = post; if (typeof renderSocial === 'function') renderSocial(); }
    });
    
    // Videos listener
    if (videosListener) videosListener.off();
    videosListener = firebase.database().ref('videos');
    videosListener.on('child_added', function(snap) {
        var video = snap.val();
        if (!video || !video.author) return;
        video.id = snap.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        if (!S.videoData.find(function(v) { return v.id === video.id; })) {
            S.videoData.unshift(video);
            if (typeof renderVideos === 'function') renderVideos();
        }
    });
    videosListener.on('child_changed', function(snap) {
        var video = snap.val(); if (!video) return; video.id = snap.key;
        var idx = S.videoData.findIndex(function(v) { return v.id === video.id; });
        if (idx > -1) { S.videoData[idx] = video; if (typeof renderVideos === 'function') renderVideos(); }
    });
    
    // Notifications listener
    if (notifListener) notifListener.off();
    if (S.username) {
        notifListener = firebase.database().ref('notifications/' + S.username).orderByChild('time').limitToLast(50);
        notifListener.on('child_added', function(snap) {
            var n = snap.val(); if (!n) return; n.id = snap.key;
            if (!S.notifications.find(function(x) { return x.id === n.id; })) {
                S.notifications.unshift(n);
                updateNotifBadge();
            }
        });
    }
}

// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================
function updateNotifBadge() {
    var unread = (S.notifications || []).filter(function(n) { return !n.read; }).length;
    var badges = ['notifBadge', 'profileNotifBadge'];
    badges.forEach(function(id) {
        var b = document.getElementById(id);
        if (b) { b.textContent = unread > 99 ? '99+' : unread; b.style.display = unread > 0 ? 'flex' : 'none'; }
    });
}

// ============================================================
// INITIALIZE APP
// ============================================================
function initApp() {
    console.log('=== STARTING APP ===');
    
    var auth = localStorage.getItem('wa');
    
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                loadState();
                
                if (S.username === data.username) {
                    console.log('Session found for:', S.username);
                    
                    setupPresence();
                    
                    // Load user data
                    firebase.database().ref('users/' + S.username).once('value').then(function(snap) {
                        if (snap.exists()) {
                            var d = snap.val();
                            S.name = d.name || '';
                            S.bio = d.bio || 'Building my energy.';
                            S.avatar = d.avatar || null;
                            S.wallpaper = d.wallpaper || null;
                            S.friends = d.friends || [];
                            S.bookmarks = d.bookmarks || [];
                            S.selectedAuras = d.selected_auras || [];
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
                    var fab = document.getElementById('wpFab');
                    var nav = document.getElementById('bottomNav');
                    if (fab) fab.style.display = 'flex';
                    if (nav) nav.style.display = 'flex';
                    
                    // Navigate
                    if (S.selectedAuras.length === 0) {
                        navigate('select');
                    } else {
                        navigate('social');
                        initAppData();
                    }
                    
                    console.log('✅ App ready');
                    return;
                }
            }
        } catch(e) {
            console.error('Init error:', e);
        }
    }
    
    navigate('landing');
}

// Start
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initApp, 500);
});

// Expose
window.initApp = initApp;
window.initAppData = initAppData;
window.updateNotifBadge = updateNotifBadge;

console.log('⚡ App core loaded');