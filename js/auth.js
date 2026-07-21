// Authentication Module
window.auth = {
    login: null,
    signup: null,
    logout: null,
    checkAuth: null
};

// Sign Up Function
window.handleSignup = function() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUser').value.trim();
    const password = document.getElementById('signupPass').value.trim();

    if (!name || !username || !password) {
        window.toast('Please fill all fields');
        return;
    }

    if (username.length < 3) {
        window.toast('Username must be at least 3 characters');
        return;
    }

    if (password.length < 6) {
        window.toast('Password must be at least 6 characters');
        return;
    }

    // Check if username exists
    const userRef = getRef('users/' + username);
    userRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            window.toast('Username already taken');
            return;
        }

        // Create user
        const userData = {
            name: name,
            username: username,
            password: password, // In production, hash this!
            bio: 'Building my energy. One aura at a time. ⚡',
            selected_auras: [],
            avatar: null,
            wallpaper: null,
            friends: [],
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            online: true
        };

        userRef.set(userData)
            .then(() => {
                window.S.username = username;
                window.S.bio = userData.bio;
                window.S.selectedAuras = [];
                window.S.avatar = null;
                window.S.wallpaper = null;
                window.S.friends = [];
                window.S.completedTasks = [];
                window.S.streakData = {};
                window.S.diary = [];
                window.S.routines = [];
                
                saveUserState();
                saveAuthState();
                setupPresence();
                
                window.toast('Account created! 🎉');
                window.navigate('select');
            })
            .catch((error) => {
                window.toast('Error creating account');
                console.error(error);
            });
    });
};

// Login Function
window.handleLogin = function() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();

    if (!username || !password) {
        window.toast('Please fill all fields');
        return;
    }

    const userRef = getRef('users/' + username);
    userRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            window.toast('User not found');
            return;
        }

        const userData = snapshot.val();
        if (userData.password !== password) {
            window.toast('Incorrect password');
            return;
        }

        // Login successful
        window.S.username = username;
        window.S.bio = userData.bio || 'Building my energy. One aura at a time. ⚡';
        window.S.selectedAuras = userData.selected_auras || [];
        window.S.avatar = userData.avatar || null;
        window.S.wallpaper = userData.wallpaper || null;
        window.S.friends = userData.friends || [];
        window.S.completedTasks = [];
        window.S.streakData = {};
        window.S.diary = [];
        window.S.routines = [];
        
        saveUserState();
        saveAuthState();
        setupPresence();
        
        // Load user data from Firebase
        loadUserData(username);
        
        window.toast('Welcome back! ✨');
        
        if (window.S.selectedAuras.length === 0) {
            window.navigate('select');
        } else {
            window.navigate('social');
            initAllFeatures();
        }
    });
};

// Logout Function
window.logout = function() {
    if (window.S.username) {
        getRef('users/' + window.S.username).update({
            online: false,
            last_seen: new Date().toISOString()
        });
    }
    
    window.S.username = null;
    window.S.bio = 'Building my energy. One aura at a time. ⚡';
    window.S.selectedAuras = [];
    window.S.avatar = null;
    window.S.wallpaper = null;
    window.S.friends = [];
    window.S.completedTasks = [];
    window.S.streakData = {};
    window.S.diary = [];
    window.S.routines = [];
    window.S.socialPosts = [];
    window.currentChat = null;
    window.chatMessages = [];
    window.videoData = [];
    
    localStorage.removeItem('winchu_user_state');
    localStorage.removeItem('winchu_auth');
    
    if (window.chatListener) {
        window.chatListener.off();
        window.chatListener = null;
    }
    if (window.postsListener) {
        window.postsListener.off();
        window.postsListener = null;
    }
    
    window.navigate('landing');
    window.toast('Logged out');
};

// Save auth state
function saveAuthState() {
    localStorage.setItem('winchu_auth', JSON.stringify({
        username: window.S.username,
        timestamp: Date.now()
    }));
}

// Load auth state
function loadAuthState() {
    const auth = localStorage.getItem('winchu_auth');
    if (auth) {
        try {
            const data = JSON.parse(auth);
            if (data.username && (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                return data.username;
            }
        } catch (e) {}
    }
    return null;
}

// Load user data from Firebase
function loadUserData(username) {
    const userRef = getRef('users/' + username);
    userRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            window.S.bio = data.bio || window.S.bio;
            window.S.selectedAuras = data.selected_auras || [];
            window.S.avatar = data.avatar || null;
            window.S.wallpaper = data.wallpaper || null;
            window.S.friends = data.friends || [];
            saveUserState();
        }
    });
    
    // Load diary
    const diaryRef = getRef('diary/' + username);
    diaryRef.orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            window.S.diary = Object.values(data).reverse();
            if (window.renderDiary) window.renderDiary();
        }
    });
    
    // Load routines
    const routinesRef = getRef('routines/' + username);
    routinesRef.orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            window.S.routines = Object.values(data).reverse();
            if (window.renderRoutines) window.renderRoutines();
        }
    });
    
    // Set wallpaper
    if (window.S.wallpaper) {
        window.setBg(window.S.wallpaper);
    }
}

console.log('🔐 Auth module loaded');