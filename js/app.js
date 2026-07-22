// Authentication Module - No blocking connection check

function handleSignup() {
    console.log('Signup started');
    
    const nameEl = document.getElementById('signupName');
    const usernameEl = document.getElementById('signupUser');
    const passwordEl = document.getElementById('signupPass');
    
    if (!nameEl || !usernameEl || !passwordEl) {
        toast('Form error. Please refresh.');
        return;
    }
    
    const nameVal = nameEl.value.trim();
    const usernameVal = usernameEl.value.trim();
    const passwordVal = passwordEl.value.trim();
    
    if (!nameVal || !usernameVal || !passwordVal) {
        toast('Please fill all fields');
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
    if (!/^[a-zA-Z0-9_]+$/.test(usernameVal)) {
        toast('Username: letters, numbers, underscores only');
        return;
    }
    
    toast('Creating account...');
    
    getRef('users/' + usernameVal).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            toast('Username already taken');
            throw new Error('taken');
        }
        
        return setData('users/' + usernameVal, {
            name: nameVal,
            username: usernameVal,
            password: passwordVal,
            bio: 'Building my energy. ⚡',
            selected_auras: [],
            avatar: null,
            wallpaper: null,
            friends: [],
            bookmarks: [],
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            online: true
        });
    }).then(function() {
        S.username = usernameVal;
        S.name = nameVal;
        S.bio = 'Building my energy. ⚡';
        S.selectedAuras = [];
        S.avatar = null;
        S.wallpaper = null;
        S.friends = [];
        S.completedTasks = [];
        S.streakData = {};
        S.diary = [];
        S.routines = [];
        S.bookmarks = [];
        S.notifications = [];
        S.groups = [];
        S.videoData = [];
        S.socialPosts = [];
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        
        nameEl.value = '';
        usernameEl.value = '';
        passwordEl.value = '';
        
        toast('Account created! 🎉');
        navigate('select');
    }).catch(function(error) {
        if (error.message !== 'taken') {
            console.error('Signup error:', error);
            toast('Error. Try again.');
        }
    });
}

function handleLogin() {
    console.log('Login started');
    
    const usernameEl = document.getElementById('loginUser');
    const passwordEl = document.getElementById('loginPass');
    
    if (!usernameEl || !passwordEl) {
        toast('Form error. Please refresh.');
        return;
    }
    
    const usernameVal = usernameEl.value.trim();
    const passwordVal = passwordEl.value.trim();
    
    if (!usernameVal || !passwordVal) {
        toast('Please fill all fields');
        return;
    }
    
    toast('Logging in...');
    
    getRef('users/' + usernameVal).once('value').then(function(snapshot) {
        if (!snapshot.exists()) {
            toast('User not found');
            return;
        }
        
        const userData = snapshot.val();
        
        if (userData.password !== passwordVal) {
            toast('Incorrect password');
            return;
        }
        
        S.username = usernameVal;
        S.name = userData.name || '';
        S.bio = userData.bio || 'Building my energy. ⚡';
        S.selectedAuras = userData.selected_auras || [];
        S.avatar = userData.avatar || null;
        S.wallpaper = userData.wallpaper || null;
        S.friends = userData.friends || [];
        S.bookmarks = userData.bookmarks || [];
        S.completedTasks = [];
        S.streakData = {};
        S.diary = [];
        S.routines = [];
        S.notifications = [];
        S.groups = [];
        S.videoData = [];
        S.socialPosts = [];
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        loadUserData(usernameVal);
        
        usernameEl.value = '';
        passwordEl.value = '';
        
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
        }
        
        toast('Welcome! ✨');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            initAll();
        }
    }).catch(function(error) {
        console.error('Login error:', error);
        toast('Connection error. Check your internet and try again.');
    });
}

function confirmSelection() {
    if (S.selectedAuras.length === 0) {
        toast('Select at least one aura');
        return;
    }
    if (S.username) {
        setData('users/' + S.username + '/selected_auras', S.selectedAuras);
    }
    saveState();
    navigate('social');
    initAll();
    toast('Auras activated! ✨');
}

function logout() {
    if (S.username) {
        updateData('users/' + S.username, { online: false, last_seen: new Date().toISOString() });
    }
    
    S = {
        username: null, name: '', bio: 'Building my energy. ⚡', wallpaper: null,
        selectedAuras: [], avatar: null, friends: [], completedTasks: [],
        streakData: {}, socialPosts: [], diary: [], routines: [],
        videoData: [], bookmarks: [], notifications: [], groups: []
    };
    
    currentChat = null;
    chatMessages = [];
    viewingProfile = null;
    
    localStorage.removeItem('winchu_state');
    localStorage.removeItem('winchu_auth');
    
    if (chatListener) { chatListener.off(); chatListener = null; }
    if (postsListener) { postsListener.off(); postsListener = null; }
    if (videosListener) { videosListener.off(); videosListener = null; }
    if (notifListener) { notifListener.off(); notifListener = null; }
    
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    navigate('landing');
    toast('Logged out');
}

function resetPassword() {
    showDialog({
        emoji: '🔑', title: 'Reset Password', placeholder: 'Username...', confirmText: 'Next'
    }).then(function(username) {
        if (username && username.trim()) {
            getRef('users/' + username.trim()).once('value').then(function(snapshot) {
                if (!snapshot.exists()) { toast('User not found'); return; }
                showDialog({
                    emoji: '🔐', title: 'New Password', placeholder: 'New password (6+)...', confirmText: 'Save'
                }).then(function(pass) {
                    if (pass && pass.trim().length >= 6) {
                        updateData('users/' + username.trim() + '/password', pass.trim());
                        toast('Password reset! Log in.');
                        navigate('login');
                    }
                });
            });
        }
    });
}

function loadUserData(username) {
    if (!username) return;
    getRef('users/' + username).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            const data = snapshot.val();
            S.name = data.name || '';
            S.bio = data.bio || S.bio;
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
window.resetPassword = resetPassword;
window.confirmSelection = confirmSelection;

console.log('🔐 Auth ready');