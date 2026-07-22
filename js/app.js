// App Initialization - Fixed to load all data properly

function initAll() {
    console.log('=== INITIALIZING ALL FEATURES ===');
    
    // Show loading toast
    toast('Loading data...');
    
    // Load all data from Firebase
    loadAllPosts();
    loadAllVideos();
    loadAllGroups();
    
    // Setup listeners
    setupPostsListener();
    setupNotifListener();
    
    // Initialize wallpapers
    initWallpapers();
    
    // Render all UI
    renderChatList();
    renderProfile();
    renderHome();
    renderSocial();
    renderDiary();
    renderRoutines();
    renderGroups();
    renderVideos();
    
    // Update online status periodically
    setInterval(function() {
        if (S && S.username) {
            setData('users/' + S.username + '/last_seen', new Date().toISOString());
        }
    }, 30000);
    
    console.log('✅ All features initialized');
}

// Load ALL posts from Firebase
function loadAllPosts() {
    console.log('Loading all posts from Firebase...');
    
    getRef('posts').once('value').then(function(snapshot) {
        const data = snapshot.val();
        S.socialPosts = [];
        
        if (data) {
            const keys = Object.keys(data);
            console.log('Found ' + keys.length + ' posts in database');
            
            keys.forEach(function(key) {
                const post = data[key];
                if (post && post.author) {
                    post.id = key;
                    S.socialPosts.push(post);
                }
            });
            
            // Sort newest first
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
}

// Load ALL videos from Firebase
function loadAllVideos() {
    console.log('Loading all videos from Firebase...');
    
    getRef('videos').once('value').then(function(snapshot) {
        const data = snapshot.val();
        S.videoData = [];
        
        if (data) {
            const keys = Object.keys(data);
            console.log('Found ' + keys.length + ' videos in database');
            
            keys.forEach(function(key) {
                const video = data[key];
                if (video && video.author) {
                    video.id = key;
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
    
    // Setup video listener
    if (videosListener) videosListener.off();
    videosListener = getRef('videos');
    videosListener.on('child_added', function(snapshot) {
        const video = snapshot.val();
        if (!video || !video.author) return;
        video.id = snapshot.key;
        
        if (!S.videoData.find(function(v) { return v.id === video.id; })) {
            S.videoData.unshift(video);
            if (typeof renderVideos === 'function') renderVideos();
        }
    });
}

// Load ALL groups
function loadAllGroups() {
    console.log('Loading groups...');
    
    getRef('groups').once('value').then(function(snapshot) {
        const data = snapshot.val();
        S.groups = [];
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                const group = data[key];
                group.id = key;
                if (group.members && group.members.includes(S.username)) {
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
}

function initApp() {
    console.log('Starting app...');
    
    const auth = localStorage.getItem('winchu_auth');
    
    if (auth) {
        try {
            const data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                loadState();
                
                if (S.username === data.username) {
                    console.log('Restoring session for:', S.username);
                    
                    setupPresence();
                    loadUserData(data.username);
                    
                    // Apply wallpaper
                    if (S.wallpaper) {
                        document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundPosition = 'center';
                        document.body.style.backgroundAttachment = 'fixed';
                    }
                    
                    // Show UI
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
    console.log('👋 Welcome to Winchu · Nexus');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initApp, 500);
});

console.log('⚡ App core loaded');