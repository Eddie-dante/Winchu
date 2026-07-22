// App Initialization - Complete

function initAppData() {
    console.log('=== INITIALIZING APP DATA ===');
    
    // Show loading indicator
    toast('Loading your feed...');
    
    // Load all posts from Firebase
    db.ref('posts').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                var post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
            // Sort by newest first
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.socialPosts.length + ' posts');
        renderSocial();
        renderProfile();
        renderStories();
        saveState();
    }).catch(function(error) {
        console.error('Error loading posts:', error);
    });
    
    // Load all videos from Firebase
    db.ref('videos').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.videoData = [];
        
        if (data) {
            var keys = Object.keys(data);
            console.log('Found ' + keys.length + ' videos in database');
            
            keys.forEach(function(key) {
                var video = data[key];
                if (video && video.author) {
                    video.id = key;
                    S.videoData.push(video);
                }
            });
            
            // Sort by newest first
            S.videoData.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.videoData.length + ' videos');
        renderVideos();
    }).catch(function(error) {
        console.error('Error loading videos:', error);
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
        
        console.log('Loaded ' + S.groups.length + ' groups');
        renderGroups();
        renderChatList();
    }).catch(function(error) {
        console.error('Error loading groups:', error);
    });
    
    // Load diary entries
    db.ref('diary/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.diary = [];
        if (data) {
            S.diary = Object.values(data).reverse();
        }
        renderDiary();
    });
    
    // Load routines
    db.ref('routines/' + S.username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.routines = [];
        if (data) {
            S.routines = Object.values(data).reverse();
        }
        renderRoutines();
    });
    
    // Load notifications
    db.ref('notifications/' + S.username).orderByChild('time').limitToLast(50).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.notifications = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var notif = data[key];
                notif.id = key;
                S.notifications.push(notif);
            });
            S.notifications.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        updateNotifBadge();
    });
    
    // Load bookmarks from user data
    db.ref('users/' + S.username + '/bookmarks').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.bookmarks = data || [];
    });
    
    // Setup real-time listeners
    setupPostsListener();
    setupVideosListener();
    setupNotifListener();
    setupGroupsListener();
    
    // Initialize wallpapers
    initWallpapers();
    
    // Update presence and online status
    setupPresence();
    
    // Periodic online status update
    setInterval(function() {
        if (S && S.username) {
            db.ref('users/' + S.username).update({
                last_seen: new Date().toISOString(),
                online: true
            });
        }
    }, 60000);
    
    console.log('✅ All app data initialized');
}

// Setup posts real-time listener
function setupPostsListener() {
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    
    postsListener = db.ref('posts');
    
    // Listen for new posts
    postsListener.on('child_added', function(snapshot) {
        var post = snapshot.val();
        if (!post || !post.author) return;
        
        post.id = snapshot.key;
        
        // Check if already in array
        var existing = S.socialPosts.find(function(p) {
            return p.id === post.id;
        });
        
        if (!existing) {
            console.log('New post detected via listener:', post.id, 'by', post.author);
            S.socialPosts.unshift(post);
            
            // Keep array manageable
            if (S.socialPosts.length > 200) {
                S.socialPosts = S.socialPosts.slice(0, 200);
            }
            
            // Re-sort
            S.socialPosts.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            renderSocial();
            renderProfile();
            renderStories();
            saveState();
        }
    });
    
    // Listen for post updates (likes, comments)
    postsListener.on('child_changed', function(snapshot) {
        var post = snapshot.val();
        if (!post) return;
        post.id = snapshot.key;
        
        var idx = S.socialPosts.findIndex(function(p) {
            return p.id === post.id;
        });
        
        if (idx > -1) {
            S.socialPosts[idx] = post;
            renderSocial();
        }
    });
    
    // Listen for post deletions
    postsListener.on('child_removed', function(snapshot) {
        console.log('Post removed:', snapshot.key);
        S.socialPosts = S.socialPosts.filter(function(p) {
            return p.id !== snapshot.key;
        });
        renderSocial();
        renderProfile();
    });
    
    console.log('📱 Posts listener active');
}

// Setup videos real-time listener
function setupVideosListener() {
    if (videosListener) {
        videosListener.off();
        videosListener = null;
    }
    
    videosListener = db.ref('videos');
    
    videosListener.on('child_added', function(snapshot) {
        var video = snapshot.val();
        if (!video || !video.author) return;
        
        video.id = snapshot.key;
        
        var existing = S.videoData.find(function(v) {
            return v.id === video.id;
        });
        
        if (!existing) {
            console.log('New video detected:', video.id);
            S.videoData.unshift(video);
            
            if (S.videoData.length > 100) {
                S.videoData = S.videoData.slice(0, 100);
            }
            
            renderVideos();
        }
    });
    
    videosListener.on('child_changed', function(snapshot) {
        var video = snapshot.val();
        if (!video) return;
        video.id = snapshot.key;
        
        var idx = S.videoData.findIndex(function(v) {
            return v.id === video.id;
        });
        
        if (idx > -1) {
            S.videoData[idx] = video;
            renderVideos();
        }
    });
    
    videosListener.on('child_removed', function(snapshot) {
        S.videoData = S.videoData.filter(function(v) {
            return v.id !== snapshot.key;
        });
        renderVideos();
    });
    
    console.log('🎬 Videos listener active');
}

// Setup notifications real-time listener
function setupNotifListener() {
    if (notifListener) {
        notifListener.off();
        notifListener = null;
    }
    
    if (!S.username) return;
    
    notifListener = db.ref('notifications/' + S.username).orderByChild('time').limitToLast(50);
    
    notifListener.on('child_added', function(snapshot) {
        var notif = snapshot.val();
        if (!notif) return;
        notif.id = snapshot.key;
        
        var existing = S.notifications.find(function(n) {
            return n.id === notif.id;
        });
        
        if (!existing) {
            S.notifications.unshift(notif);
            updateNotifBadge();
        }
    });
    
    console.log('🔔 Notifications listener active');
}

// Setup groups real-time listener
function setupGroupsListener() {
    db.ref('groups').on('child_added', function(snapshot) {
        var group = snapshot.val();
        group.id = snapshot.key;
        
        if (group.members && group.members.indexOf(S.username) > -1) {
            if (!S.groups.find(function(g) { return g.id === group.id; })) {
                S.groups.push(group);
                renderGroups();
                renderChatList();
            }
        }
    });
    
    db.ref('groups').on('child_changed', function(snapshot) {
        var group = snapshot.val();
        group.id = snapshot.key;
        
        if (group.members && group.members.indexOf(S.username) > -1) {
            var idx = S.groups.findIndex(function(g) { return g.id === group.id; });
            if (idx > -1) {
                S.groups[idx] = group;
            } else {
                S.groups.push(group);
            }
        } else {
            S.groups = S.groups.filter(function(g) { return g.id !== group.id; });
        }
        renderGroups();
        renderChatList();
    });
    
    db.ref('groups').on('child_removed', function(snapshot) {
        S.groups = S.groups.filter(function(g) { return g.id !== snapshot.key; });
        renderGroups();
        renderChatList();
    });
    
    console.log('👥 Groups listener active');
}

// Update notification badge count
function updateNotifBadge() {
    var unreadCount = (S.notifications || []).filter(function(n) {
        return !n.read;
    }).length;
    
    var badges = ['notifBadge', 'profileNotifBadge'];
    badges.forEach(function(id) {
        var badge = document.getElementById(id);
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
}

// Mark all notifications as read
function markAllNotifsRead() {
    if (!S.username) return;
    
    S.notifications.forEach(function(n) {
        if (!n.read) {
            n.read = true;
            db.ref('notifications/' + S.username + '/' + n.id + '/read').set(true);
        }
    });
    
    updateNotifBadge();
    if (typeof renderNotifications === 'function') {
        renderNotifications();
    }
    toast('All notifications marked as read');
}

// Add notification
function addNotification(to, message, type, refId) {
    if (to === S.username) return;
    
    var notification = {
        from: S.username,
        to: to,
        message: message,
        type: type,
        refId: refId,
        time: new Date().toISOString(),
        read: false
    };
    
    db.ref('notifications/' + to).push(notification);
}

// Initialize app
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
                    db.ref('users/' + S.username).once('value').then(function(snapshot) {
                        if (snapshot.exists()) {
                            var userData = snapshot.val();
                            S.name = userData.name || '';
                            S.bio = userData.bio || 'Building my energy.';
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
                    
                    // Show UI elements
                    var wpFab = document.getElementById('wpFab');
                    var bottomNav = document.getElementById('bottomNav');
                    if (wpFab) wpFab.style.display = 'flex';
                    if (bottomNav) bottomNav.style.display = 'flex';
                    
                    // Navigate to appropriate page
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
    
    // No valid session - show landing
    navigate('landing');
    console.log('👋 Welcome to Winchu · Nexus');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initApp, 500);
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+K for search/find friends
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

// Handle online/offline status
window.addEventListener('online', function() {
    console.log('📶 Back online');
    if (S.username) {
        setupPresence();
        initAppData();
    }
});

window.addEventListener('offline', function() {
    console.log('📶 Went offline');
    toast('⚠️ You are offline. Some features may not work.');
});

// Expose functions globally
window.initApp = initApp;
window.initAppData = initAppData;
window.markAllNotifsRead = markAllNotifsRead;
window.addNotification = addNotification;
window.updateNotifBadge = updateNotifBadge;
window.setupPostsListener = setupPostsListener;
window.setupVideosListener = setupVideosListener;
window.setupNotifListener = setupNotifListener;

console.log('⚡ Winchu · Nexus Core Loaded - Version 2.0');