function handleSignup() {
    var n = document.getElementById('signupName').value.trim();
    var u = document.getElementById('signupUser').value.trim();
    var p = document.getElementById('signupPass').value.trim();
    
    if (!n || !u || !p) { toast('Fill all fields'); return; }
    if (u.length < 3) { toast('Username: 3+ chars'); return; }
    if (p.length < 6) { toast('Password: 6+ chars'); return; }
    
    db.ref('users/' + u).once('value').then(function(snap) {
        if (snap.exists()) { toast('Username taken'); return; }
        
        return db.ref('users/' + u).set({
            name: n, username: u, password: p,
            bio: 'Building my energy.', selected_auras: [],
            avatar: null, wallpaper: null, friends: [], bookmarks: [],
            created_at: new Date().toISOString(), online: true
        });
    }).then(function() {
        S.username = u; S.name = n; S.bio = 'Building my energy.';
        S.selectedAuras = []; S.friends = []; S.socialPosts = [];
        S.videoData = []; S.bookmarks = []; S.notifications = [];
        S.groups = []; S.diary = []; S.routines = [];
        
        saveState();
        localStorage.setItem('wa', JSON.stringify({ username: u, timestamp: Date.now() }));
        setupPresence();
        toast('Account created!');
        navigate('select');
    }).catch(function(e) {
        console.error(e);
        toast('Error. Try again.');
    });
}

function handleLogin() {
    var u = document.getElementById('loginUser').value.trim();
    var p = document.getElementById('loginPass').value.trim();
    
    if (!u || !p) { toast('Fill all fields'); return; }
    
    db.ref('users/' + u).once('value').then(function(snap) {
        if (!snap.exists()) { toast('User not found'); return; }
        
        var d = snap.val();
        if (d.password !== p) { toast('Wrong password'); return; }
        
        S.username = u; S.name = d.name || ''; S.bio = d.bio || 'Building my energy.';
        S.selectedAuras = d.selected_auras || []; S.avatar = d.avatar || null;
        S.wallpaper = d.wallpaper || null; S.friends = d.friends || [];
        S.bookmarks = d.bookmarks || []; S.socialPosts = [];
        S.videoData = []; S.notifications = []; S.groups = [];
        S.diary = []; S.routines = [];
        
        saveState();
        localStorage.setItem('wa', JSON.stringify({ username: u, timestamp: Date.now() }));
        setupPresence();
        
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
        }
        
        toast('Welcome!');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            initAppData();
        }
    }).catch(function(e) {
        console.error(e);
        toast('Connection error');
    });
}

function confirmSelection() {
    if (S.selectedAuras.length === 0) { toast('Select at least one'); return; }
    db.ref('users/' + S.username + '/selected_auras').set(S.selectedAuras);
    saveState();
    navigate('social');
    initAppData();
    toast('Done!');
}

function logout() {
    if (S.username) db.ref('users/' + S.username).update({ online: false });
    S.username = null;
    localStorage.removeItem('ws');
    localStorage.removeItem('wa');
    if (chatListener) { chatListener.off(); chatListener = null; }
    if (postsListener) { postsListener.off(); postsListener = null; }
    if (videosListener) { videosListener.off(); videosListener = null; }
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    navigate('landing');
    toast('Logged out');
}

window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmSelection = confirmSelection;