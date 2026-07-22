// Authentication Module - Fixed to load data for new users

function handleSignup() {
    console.log('Signup function called');
    
    // Check connection first
    checkConnection().then(function(connected) {
        if (!connected) {
            toast('No internet connection. Please check your network and try again.');
            return;
        }
        
        const nameEl = document.getElementById('signupName');
        const usernameEl = document.getElementById('signupUser');
        const passwordEl = document.getElementById('signupPass');
        
        if (!nameEl || !usernameEl || !passwordEl) {
            toast('Form not found. Please refresh the page.');
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
            toast('Username must be at least 3 characters');
            return;
        }
        
        if (passwordVal.length < 6) {
            toast('Password must be at least 6 characters');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(usernameVal)) {
            toast('Username can only contain letters, numbers, and underscores');
            return;
        }
        
        console.log('Checking if username exists:', usernameVal);
        
        getRef('users/' + usernameVal).once('value').then(function(snapshot) {
            if (snapshot.exists()) {
                toast('Username already taken');
                throw new Error('Username taken');
            }
            
            console.log('Creating account for:', usernameVal);
            
            const userData = {
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
            };
            
            return setData('users/' + usernameVal, userData);
        }).then(function() {
            console.log('Account created successfully');
            
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
            
            // Clear form
            nameEl.value = '';
            usernameEl.value = '';
            passwordEl.value = '';
            
            toast('Account created! 🎉');
            navigate('select');
        }).catch(function(error) {
            if (error.message !== 'Username taken') {
                console.error('Signup error:', error);
                toast('Error creating account. Please try again.');
            }
        });
    });
}

function handleLogin() {
    console.log('Login function called');
    
    // Check connection first
    checkConnection().then(function(connected) {
        if (!connected) {
            toast('No internet connection. Please check your network and try again.');
            return;
        }
        
        const usernameEl = document.getElementById('loginUser');
        const passwordEl = document.getElementById('loginPass');
        
        if (!usernameEl || !passwordEl) {
            toast('Form not found. Please refresh the page.');
            return;
        }
        
        const usernameVal = usernameEl.value.trim();
        const passwordVal = passwordEl.value.trim();
        
        console.log('Login attempt for:', usernameVal);
        
        if (!usernameVal || !passwordVal) {
            toast('Please fill all fields');
            return;
        }
        
        getRef('users/' + usernameVal).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                console.log('User not found:', usernameVal);
                toast('User not found. Please check your username.');
                return;
            }
            
            const userData = snapshot.val();
            
            if (userData.password !== passwordVal) {
                console.log('Password incorrect for:', usernameVal);
                toast('Incorrect password. Please try again.');
                return;
            }
            
            console.log('Login successful for:', usernameVal);
            
            // Clear old state first
            S = {
                username: usernameVal,
                name: userData.name || '',
                bio: userData.bio || 'Building my energy. ⚡',
                wallpaper: userData.wallpaper || null,
                selectedAuras: userData.selected_auras || [],
                avatar: userData.avatar || null,
                friends: userData.friends || [],
                bookmarks: userData.bookmarks || [],
                completedTasks: [],
                streakData: {},
                socialPosts: [],
                diary: [],
                routines: [],
                videoData: [],
                notifications: [],
                groups: []
            };
            
            saveState();
            localStorage.setItem('winchu_auth', JSON.stringify({
                username: usernameVal,
                timestamp: Date.now()
            }));
            
            setupPresence();
            loadUserData(usernameVal);
            
            // Clear form
            usernameEl.value = '';
            passwordEl.value = '';
            
            // Apply wallpaper
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
                // Initialize all features - THIS LOADS POSTS AND VIDEOS
                initAll();
            }
        }).catch(function(error) {
            console.error('Login error:', error);
            toast('Error logging in. Please check your connection.');
        });
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
    // Initialize all features after aura selection
    initAll();
    toast('Auras activated! ✨');
}

function logout() {
    console.log('Logging out...');
    
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

function resetPassword() {
    showDialog({
        emoji: '🔑',
        title: 'Reset Password',
        subtitle: 'Enter your username',
        placeholder: 'Username...',
        confirmText: 'Next'
    }).then(function(username) {
        if (username && username.trim()) {
            getRef('users/' + username.trim()).once('value').then(function(snapshot) {
                if (!snapshot.exists()) {
                    toast('User not found');
                    return;
                }
                showDialog({
                    emoji: '🔐',
                    title: 'New Password',
                    subtitle: 'Enter new password (6+ characters)',
                    placeholder: 'New password...',
                    confirmText: 'Save'
                }).then(function(newPass) {
                    if (newPass && newPass.trim().length >= 6) {
                        updateData('users/' + username.trim() + '/password', newPass.trim()).then(function() {
                            toast('Password reset! Please log in.');
                            navigate('login');
                        });
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
    }).catch(function(error) {
        console.error('Load user error:', error);
    });
}

// Expose functions
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.resetPassword = resetPassword;
window.confirmSelection = confirmSelection;

console.log('🔐 Auth module loaded');