function initAppData() {
    console.log('Loading app data...');
    
    // Load posts
    db.ref('posts').once('value').then(function(snap) {
        var d = snap.val();
        S.socialPosts = [];
        if (d) {
            Object.keys(d).forEach(function(k) {
                var p = d[k];
                if (p && p.author) { p.id = k; S.socialPosts.push(p); }
            });
            S.socialPosts.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Posts:', S.socialPosts.length);
        renderSocial();
    });
    
    // Load videos
    db.ref('videos').once('value').then(function(snap) {
        var d = snap.val();
        S.videoData = [];
        if (d) {
            Object.keys(d).forEach(function(k) {
                var v = d[k];
                if (v && v.author) { v.id = k; S.videoData.push(v); }
            });
            S.videoData.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        }
        console.log('Videos:', S.videoData.length);
        renderVideos();
    });
    
    // Load groups
    db.ref('groups').once('value').then(function(snap) {
        var d = snap.val();
        S.groups = [];
        if (d) {
            Object.keys(d).forEach(function(k) {
                var g = d[k]; g.id = k;
                if (g.members && g.members.indexOf(S.username) > -1) S.groups.push(g);
            });
        }
        renderGroups();
        renderChatList();
    });
    
    // Listen for new posts
    if (postsListener) postsListener.off();
    postsListener = db.ref('posts');
    postsListener.on('child_added', function(snap) {
        var p = snap.val();
        if (!p || !p.author) return;
        p.id = snap.key;
        if (!S.socialPosts.find(function(x) { return x.id === p.id; })) {
            S.socialPosts.unshift(p);
            renderSocial();
            renderProfile();
        }
    });
    
    // Listen for new videos
    if (videosListener) videosListener.off();
    videosListener = db.ref('videos');
    videosListener.on('child_added', function(snap) {
        var v = snap.val();
        if (!v || !v.author) return;
        v.id = snap.key;
        if (!S.videoData.find(function(x) { return x.id === v.id; })) {
            S.videoData.unshift(v);
            renderVideos();
        }
    });
    
    renderChatList();
    renderProfile();
    renderHome();
    renderDiary();
    renderRoutines();
    initWallpapers();
}

function initApp() {
    var a = localStorage.getItem('wa');
    if (a) {
        try {
            var d = JSON.parse(a);
            if (d.username && (Date.now() - d.timestamp < 7*86400000)) {
                loadState();
                if (S.username === d.username) {
                    setupPresence();
                    if (S.wallpaper) document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
                    document.getElementById('wpFab').style.display = 'flex';
                    document.getElementById('bottomNav').style.display = 'flex';
                    if (S.selectedAuras.length === 0) navigate('select');
                    else { navigate('social'); initAppData(); }
                    return;
                }
            }
        } catch(e) {}
    }
    navigate('landing');
}

setTimeout(initApp, 500);