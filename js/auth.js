// Authentication Module

function handleSignup() {
    console.log('Signup function called');
    
    const name = document.getElementById('signupName');
    const username = document.getElementById('signupUser');
    const password = document.getElementById('signupPass');
    
    if (!name || !username || !password) {
        toast('Please fill all fields');
        return;
    }
    
    const nameVal = name.value.trim();
    const usernameVal = username.value.trim();
    const passwordVal = password.value.trim();
    
    if (!nameVal || !usernameVal || !passwordVal) {
        toast('Please fill all fields');
        return;
    }
    if (usernameVal.length < 3) {
        toast('Username must be at least 3 characters');
        return;
    }
    if (passwordVal.length < 6) {
        toast('Password must be at least 6 characters');
        return;
    }
    
    // Simple password encoding
    const hashedPassword = btoa(passwordVal);
    
    // Check if username exists
    getRef('users/' + usernameVal).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            toast('Username already taken');
            return;
        }
        
        const userData = {
            name: nameVal,
            username: usernameVal,
            password: hashedPassword,
            bio: 'Building my energy. ⚡',
            selected_auras: [],
            avatar: null,
            wallpaper: null,
            friends: [],
            bookmarks: [],
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            online: true
        };
        
        return setData('users/' + usernameVal, userData);
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
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        toast('Account created! 🎉');
        navigate('select');
    }).catch(function(error) {
        console.error('Signup error:', error);
        toast('Error creating account. Please try again.');
    });
}

function handleLogin() {
    console.log('Login function called');
    
    const username = document.getElementById('loginUser');
    const password = document.getElementById('loginPass');
    
    if (!username || !password) {
        toast('Please fill all fields');
        return;
    }
    
    const usernameVal = username.value.trim();
    const passwordVal = password.value.trim();
    
    if (!usernameVal || !passwordVal) {
        toast('Please fill all fields');
        return;
    }
    
    const hashedPassword = btoa(passwordVal);
    
    getRef('users/' + usernameVal).once('value').then(function(snapshot) {
        if (!snapshot.exists()) {
            toast('User not found');
            return;
        }
        
        const userData = snapshot.val();
        
        if (userData.password !== hashedPassword) {
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
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        loadUserData(usernameVal);
        
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
        
        toast('Welcome back! ✨');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            initAll();
        }
    }).catch(function(error) {
        console.error('Login error:', error);
        toast('Error logging in. Please try again.');
    });
}

function logout() {
    if (S.username) {
        updateData('users/' + S.username, {
            online: false,
            last_seen: new Date().toISOString()
        });
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

function loadUserData(username) {
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
    
    getRef('diary/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.diary = Object.values(snapshot.val()).reverse();
            if (typeof renderDiary === 'function') renderDiary();
        }
    });
    
    getRef('routines/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.routines = Object.values(snapshot.val()).reverse();
            if (typeof renderRoutines === 'function') renderRoutines();
        }
    });
}

// Expose functions globally
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;

console.log('🔐 Auth module loaded');