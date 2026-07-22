// Authentication Module - No connection check

function handleSignup() {
    var nameEl = document.getElementById('signupName');
    var usernameEl = document.getElementById('signupUser');
    var passwordEl = document.getElementById('signupPass');
    
    if (!nameEl || !usernameEl || !passwordEl) {
        toast('Please refresh the page');
        return;
    }
    
    var nameVal = nameEl.value.trim();
    var usernameVal = usernameEl.value.trim();
    var passwordVal = passwordEl.value.trim();
    
    if (!nameVal || !usernameVal || !passwordVal) {
        toast('Fill all fields');
        return;
    }
    if (usernameVal.length < 3) {
        toast('Username: 3+ characters');
        return;
    }
    if (passwordVal.length < 6) {
        toast('Password: 6+ characters');
        return;
    }
    
    toast('Creating account...');
    
    database.ref('users/' + usernameVal).once('value').then(function(snap) {
        if (snap.exists()) {
            toast('Username taken');
            return;
        }
        
        return database.ref('users/' + usernameVal).set({
            name: nameVal,
            username: usernameVal,
            password: passwordVal,
            bio: 'Building my energy.',
            selected_auras: [],
            avatar: null,
            wallpaper: null,
            friends: [],
            bookmarks: [],
            created_at: new Date().toISOString(),
            online: true
        });
    }).then(function() {
        S.username = usernameVal;
        S.name = nameVal;
        S.bio = 'Building my energy.';
        S.selectedAuras = [];
        S.friends = [];
        S.socialPosts = [];
        S.videoData = [];
        S.bookmarks = [];
        S.notifications = [];
        S.groups = [];
        S.diary = [];
        S.routines = [];
        S.completedTasks = [];
        S.streakData = {};
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
        
        setupPresence();
        
        nameEl.value = '';
        usernameEl.value = '';
        passwordEl.value = '';
        
        toast('Account created!');
        navigate('select');
    }).catch(function(err) {
        console.error(err);
        toast('Error. Check internet.');
    });
}

function handleLogin() {
    var usernameEl = document.getElementById('loginUser');
    var passwordEl = document.getElementById('loginPass');
    
    if (!usernameEl || !passwordEl) {
        toast('Please refresh the page');
        return;
    }
    
    var usernameVal = usernameEl.value.trim();
    var passwordVal = passwordEl.value.trim();
    
    if (!usernameVal || !passwordVal) {
        toast('Fill all fields');
        return;
    }
    
    toast('Logging in...');
    
    database.ref('users/' + usernameVal).once('value').then(function(snap) {
        if (!snap.exists()) {
            toast('User not found');
            return;
        }
        
        var data = snap.val();
        
        if (data.password !== passwordVal) {
            toast('Wrong password');
            return;
        }
        
        S.username = usernameVal;
        S.name = data.name || '';
        S.bio = data.bio || 'Building my energy.';
        S.selectedAuras = data.selected_auras || [];
        S.avatar = data.avatar || null;
        S.wallpaper = data.wallpaper || null;
        S.friends = data.friends || [];
        S.bookmarks = data.bookmarks || [];
        S.socialPosts = [];
        S.videoData = [];
        S.notifications = [];
        S.groups = [];
        S.diary = [];
        S.routines = [];
        S.completedTasks = [];
        S.streakData = {};
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
        
        setupPresence();
        
        usernameEl.value = '';
        passwordEl.value = '';
        
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
        }
        
        toast('Welcome!');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            initAll();
        }
    }).catch(function(err) {
        console.error(err);
        toast('Check your internet connection');
    });
}

function confirmSelection() {
    if (S.selectedAuras.length === 0) {
        toast('Select at least one');
        return;
    }
    database.ref('users/' + S.username + '/selected_auras').set(S.selectedAuras);
    saveState();
    navigate('social');
    initAll();
    toast('Done!');
}

function logout() {
    if (S.username) {
        database.ref('users/' + S.username).update({ online: false });
    }
    
    S.username = null;
    localStorage.removeItem('winchu_state');
    localStorage.removeItem('winchu_auth');
    
    if (chatListener) { chatListener.off(); chatListener = null; }
    if (postsListener) { postsListener.off(); postsListener = null; }
    
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    navigate('landing');
    toast('Logged out');
}

function loadUserData(username) {
    database.ref('users/' + username).once('value').then(function(snap) {
        if (snap.exists()) {
            var data = snap.val();
            S.name = data.name || '';
            S.bio = data.bio || '';
            S.avatar = data.avatar || null;
            S.wallpaper = data.wallpaper || null;
            S.friends = data.friends || [];
            S.bookmarks = data.bookmarks || [];
            saveState();
        }
    });
}

window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmSelection = confirmSelection;