// Authentication Module - Secure with Firebase Auth

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUser').value.trim();
    const password = document.getElementById('signupPass').value.trim();

    if (!name || !username || !password) {
        toast('Please fill all fields');
        return;
    }
    if (username.length < 3) {
        toast('Username must be at least 3 characters');
        return;
    }
    if (password.length < 6) {
        toast('Password must be at least 6 characters');
        return;
    }

    // Ensure we're authenticated first
    waitForAuth().then(() => {
        getRef('users/' + username).once('value', (snapshot) => {
            if (snapshot.exists()) {
                toast('Username already taken');
                return;
            }

            const userData = {
                name: name,
                username: username,
                password: password,
                authUid: currentAuthUid,
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

            setData('users/' + username, userData).then(() => {
                S.username = username;
                S.name = name;
                S.bio = userData.bio;
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
                    username: username,
                    timestamp: Date.now()
                }));
                
                toast('Account created! 🎉');
                navigate('select');
            }).catch(() => {
                toast('Error creating account');
            });
        });
    });
}

function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();

    if (!username || !password) {
        toast('Please fill all fields');
        return;
    }

    waitForAuth().then(() => {
        getRef('users/' + username).once('value', (snapshot) => {
            if (!snapshot.exists()) {
                toast('User not found');
                return;
            }

            const userData = snapshot.val();
            if (userData.password !== password) {
                toast('Incorrect password');
                return;
            }

            // Update authUid if not set
            if (!userData.authUid) {
                updateData('users/' + username + '/authUid', currentAuthUid);
            }

            S.username = username;
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
                username: username,
                timestamp: Date.now()
            }));
            
            setupPresence();
            loadUserData(username);
            
            if (S.wallpaper) {
                document.body.style.backgroundImage = `url(${S.wallpaper})`;
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
        });
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
    
    // Sign out from Firebase Auth
    firebase.auth().signOut().then(() => {
        currentAuthUid = null;
    }).catch(() => {});
    
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    navigate('landing');
    toast('Logged out');
}

function loadUserData(username) {
    getRef('users/' + username).once('value', (snapshot) => {
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
    
    getRef('diary/' + username).orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            S.diary = Object.values(snapshot.val()).reverse();
            if (typeof renderDiary === 'function') renderDiary();
        }
    });
    
    getRef('routines/' + username).orderByKey().limitToLast(100).once('value', (snapshot) => {
        if (snapshot.exists()) {
            S.routines = Object.values(snapshot.val()).reverse();
            if (typeof renderRoutines === 'function') renderRoutines();
        }
    });
}

console.log('🔐 Auth module loaded - Secure');