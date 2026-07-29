// App Initialization - Optimized

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
    var auth = localStorage.getItem('wa');
    if (auth) {
        try {
            var data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 86400000)) {
                loadState();
                if (S.username === data.username) {
                    console.log('Restoring session for:', S.username);
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
                        navigate('select'); 
                    } else { 
                        navigate('social'); 
                        setTimeout(initAppData, 300);
                    }
                    console.log('✅ Winchu ready');
                    return;
                }
            }
        } catch(e) { 
            console.error('Init error:', e); 
        }
    }
    navigate('landing');
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
        saveState();
    });
    
    // Load videos (limit to 20)
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
        updateNotifBadge();
    });
    
    firebase.database().ref('users/' + S.username + '/bookmarks').once('value').then(function(snapshot) { 
        S.bookmarks = snapshot.val() || []; 
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
    
    console.log('✅ All app data initialized');
}

// ============================================================
// LISTENER SETUP - OPTIMIZED
// ============================================================
function setupPostsListener() {
    if (postsListener) { 
        postsListener.off(); 
        postsListener = null; 
    }
    postsListener = firebase.database().ref('posts').orderByChild('time').limitToLast(50);
    postsListener.on('child_added', function(snapshot) { 
        var post = snapshot.val(); 
        if (!post || !post.author) return; 
        post.id = snapshot.key; 
        if (!post.likes) post.likes = []; 
        if (!post.comments) post.comments = []; 
        if (!S.socialPosts.find(function(p) { return p.id === post.id; })) { 
            S.socialPosts.unshift(post); 
            if (S.socialPosts.length > 100) S.socialPosts.pop(); 
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
    videosListener = firebase.database().ref('videos').orderByChild('time').limitToLast(20);
    videosListener.on('child_added', function(snapshot) { 
        var video = snapshot.val(); 
        if (!video || !video.author) return; 
        video.id = snapshot.key; 
        if (!video.likes) video.likes = []; 
        if (!video.comments) video.comments = []; 
        if (!S.videoData.find(function(v) { return v.id === video.id; })) { 
            S.videoData.unshift(video); 
            if (S.videoData.length > 50) S.videoData.pop(); 
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

// ============================================================
// RENDER OPTIMIZATIONS
// ============================================================
var renderTimeout = null;

function scheduleRender(renderFunc) {
    if (renderTimeout) {
        clearTimeout(renderTimeout);
    }
    renderTimeout = setTimeout(function() {
        renderFunc();
        renderTimeout = null;
    }, 100);
}

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() { 
    setTimeout(initApp, 300); 
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
    } 
});

window.addEventListener('offline', function() { 
    if (S.username) 
        updateData('users/' + S.username, { online: false }); 
    toast('⚠️ Offline'); 
});

// ============================================================
// EXPOSE
// ============================================================
window.initApp = initApp;
window.initAppData = initAppData;
window.updateNotifBadge = updateNotifBadge;
window.markAllNotifsRead = markAllNotifsRead;
window.addNotification = addNotification;
window.debounce = debounce;

console.log('⚡ App Core Loaded (Optimized)');