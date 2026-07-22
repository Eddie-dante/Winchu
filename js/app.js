// App Initialization - Fixed to load all data properly

function initAppData() {
    console.log('=== INITIALIZING APP DATA ===');
    
    // Load ALL posts from Firebase
    db.ref('posts').orderByChild('time').limitToLast(200).once('value').then(function(snapshot) {
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
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Loaded ' + S.socialPosts.length + ' posts');
        renderSocial();
        renderProfile();
        renderStories();
    });
    
    // Load ALL videos from Firebase
    db.ref('videos').orderByChild('time').limitToLast(100).once('value').then(function(snapshot) {
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
            S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Loaded ' + S.videoData.length + ' videos');
        renderVideos();
    });
    
    // Load groups
    db.ref('groups').once('value').then(function(snapshot) {
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
        renderGroups();
        renderChatList();
    });
    
    // Setup real-time listeners
    setupPostsListener();
    setupVideosListener();
    setupNotifListener();
    
    // Initialize wallpapers
    initWallpapers();
    
    // Setup presence
    setupPresence();
    
    console.log('✅ All app data initialized');
}

function setupPostsListener() {
    if (postsListener) { postsListener.off(); postsListener = null; }
    
    postsListener = db.ref('posts');
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        post.id = snapshot.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        
        if (!S.socialPosts.find(function(p) { return p.id === post.id; })) {
            S.socialPosts.unshift(post);
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            renderSocial();
            renderProfile();
            renderStories();
        }
    });
    
    postsListener.on('child_changed', function(snapshot) {
        var post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        if (!post.likes) post.likes = [];
        if (!post.comments) post.comments = [];
        var idx = S.socialPosts.findIndex(function(p) { return p.id === post.id; });
        if (idx > -1) { S.socialPosts[idx] = post; renderSocial(); }
    });
    
    postsListener.on('child_removed', function(snapshot) {
        S.socialPosts = S.socialPosts.filter(function(p) { return p.id !== snapshot.key; });
        renderSocial();
        renderProfile();
    });
}

function setupVideosListener() {
    if (videosListener) { videosListener.off(); videosListener = null; }
    
    videosListener = db.ref('videos');
    videosListener.on('child_added', function(snapshot) {
        var video = snapshot.val();
        if (!video || !video.author) return;
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        
        if (!S.videoData.find(function(v) { return v.id === video.id; })) {
            S.videoData.unshift(video);
            renderVideos();
        }
    });
    
    videosListener.on('child_changed', function(snapshot) {
        var video = snapshot.val();
        if (!video) return;
        video.id = snapshot.key;
        if (!video.likes) video.likes = [];
        if (!video.comments) video.comments = [];
        var idx = S.videoData.findIndex(function(v) { return v.id === video.id; });
        if (idx > -1) { S.videoData[idx] = video; renderVideos(); }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) { return v.id !== snapshot.key; });
        renderVideos();
    });
}

function setupNotifListener() {
    if (notifListener) { notifListener.off(); notifListener = null; }
    if (!S.username) return;
    
    notifListener = db.ref('notifications/' + S.username).orderByChild('time').limitToLast(50);
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

function updateNotifBadge() {
    var unread = (S.notifications || []).filter(function(n) { return !n.read; }).length;
    var badges = ['notifBadge', 'profileNotifBadge'];
    badges.forEach(function(id) {
        var badge = document.getElementById(id);
        if (badge) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
    });
}

function initApp() {
    var auth = localStorage.getItem('wa');
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 86400000)) {
                loadState();
                if (S.username === data.username) {
                    setupPresence();
                    db.ref('users/' + S.username).once('value').then(function(snapshot) {
                        if (snapshot.exists()) {
                            var d = snapshot.val();
                            S.name = d.name || ''; S.bio = d.bio || ''; S.avatar = d.avatar; S.wallpaper = d.wallpaper;
                            S.friends = d.friends || []; S.bookmarks = d.bookmarks || []; S.selectedAuras = d.selected_auras || [];
                            saveState();
                        }
                    });
                    if (S.wallpaper) { document.body.style.backgroundImage = 'url(' + S.wallpaper + ')'; document.body.style.backgroundSize = 'cover'; }
                    document.getElementById('wpFab').style.display = 'flex';
                    document.getElementById('bottomNav').style.display = 'flex';
                    if (S.selectedAuras.length === 0) { navigate('select'); }
                    else { navigate('social'); initAppData(); }
                    return;
                }
            }
        } catch(e) {}
    }
    navigate('landing');
}

document.addEventListener('DOMContentLoaded', function() { setTimeout(initApp, 500); });

window.initApp = initApp;
window.initAppData = initAppData;
window.updateNotifBadge = updateNotifBadge;

console.log('⚡ App core loaded');