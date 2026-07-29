// Auth Module - Complete

console.log('🔐 Auth module loading...');

// ============================================================
// SIGNUP FUNCTION
// ============================================================
function handleSignup() {
    console.log('=== SIGNUP BUTTON CLICKED ===');
    
    try {
        var nameEl = document.getElementById('signupName');
        var usernameEl = document.getElementById('signupUser');
        var passwordEl = document.getElementById('signupPass');
        
        console.log('Elements found:', {
            name: !!nameEl,
            username: !!usernameEl,
            password: !!passwordEl
        });
        
        if (!nameEl || !usernameEl || !passwordEl) {
            toast('Form error. Please refresh the page.');
            return;
        }
        
        var nameVal = nameEl.value.trim();
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        console.log('Signup attempt for:', usernameVal);
        
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
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.database) {
            toast('Firebase not loaded. Please check your connection.');
            console.error('Firebase not available');
            return;
        }
        
        toast('Checking username...');
        
        firebase.database().ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (snapshot.exists()) {
                    toast('Username already taken. Please choose another.');
                    return Promise.reject('Username taken');
                }
                
                console.log('Username available. Creating account...');
                toast('Creating account...');
                
                var userData = {
                    name: nameVal,
                    username: usernameVal,
                    password: passwordVal,
                    bio: 'Building my energy. One aura at a time. ⚡',
                    selected_auras: [],
                    avatar: null,
                    wallpaper: null,
                    friends: [],
                    bookmarks: [],
                    created_at: new Date().toISOString(),
                    last_seen: new Date().toISOString(),
                    online: true
                };
                
                return firebase.database().ref('users/' + usernameVal).set(userData);
            })
            .then(function() {
                console.log('Account created successfully for:', usernameVal);
                
                S.username = usernameVal;
                S.name = nameVal;
                S.bio = 'Building my energy. One aura at a time. ⚡';
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
                
                if (typeof saveState === 'function') saveState();
                localStorage.setItem('wa', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
                
                if (typeof setupPresence === 'function') setupPresence();
                
                nameEl.value = '';
                usernameEl.value = '';
                passwordEl.value = '';
                
                toast('Account created successfully! 🎉');
                
                setTimeout(function() { 
                    if (typeof navigate === 'function') {
                        navigate('select');
                    } else {
                        window.location.hash = '#select';
                    }
                }, 500);
            })
            .catch(function(error) {
                if (error !== 'Username taken') {
                    console.error('Signup error:', error);
                    toast('Error creating account. Please try again.');
                }
            });
            
    } catch (error) {
        console.error('Signup function error:', error);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGIN FUNCTION
// ============================================================
function handleLogin() {
    console.log('=== LOGIN BUTTON CLICKED ===');
    
    try {
        var usernameEl = document.getElementById('loginUser');
        var passwordEl = document.getElementById('loginPass');
        
        console.log('Elements found:', {
            username: !!usernameEl,
            password: !!passwordEl
        });
        
        if (!usernameEl || !passwordEl) {
            toast('Form error. Please refresh the page.');
            return;
        }
        
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        console.log('Login attempt for:', usernameVal);
        
        if (!usernameVal || !passwordVal) {
            toast('Please fill all fields');
            return;
        }
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.database) {
            toast('Firebase not loaded. Please check your connection.');
            console.error('Firebase not available');
            return;
        }
        
        toast('Logging in...');
        
        firebase.database().ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (!snapshot.exists()) {
                    console.log('User not found:', usernameVal);
                    toast('User not found. Please check your username or create an account.');
                    return;
                }
                
                var userData = snapshot.val();
                console.log('User found, checking password...');
                
                if (userData.password !== passwordVal) {
                    console.log('Password incorrect for:', usernameVal);
                    toast('Incorrect password. Please try again.');
                    return;
                }
                
                console.log('Login successful for:', usernameVal);
                
                S.username = usernameVal;
                S.name = userData.name || '';
                S.bio = userData.bio || 'Building my energy. One aura at a time. ⚡';
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
                
                if (typeof saveState === 'function') saveState();
                localStorage.setItem('wa', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
                
                if (typeof setupPresence === 'function') setupPresence();
                
                usernameEl.value = '';
                passwordEl.value = '';
                
                if (S.wallpaper) {
                    document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundAttachment = 'fixed';
                }
                
                firebase.database().ref('users/' + usernameVal).update({ 
                    online: true, 
                    last_seen: new Date().toISOString() 
                });
                
                var displayName = S.name || S.username;
                toast('Welcome back, ' + displayName + '! ✨');
                
                if (S.selectedAuras.length === 0) {
                    setTimeout(function() { 
                        if (typeof navigate === 'function') {
                            navigate('select');
                        } else {
                            window.location.hash = '#select';
                        }
                    }, 500);
                } else {
                    setTimeout(function() { 
                        if (typeof navigate === 'function') {
                            navigate('social');
                            if (typeof initAppData === 'function') initAppData();
                        } else {
                            window.location.hash = '#social';
                        }
                    }, 500);
                }
            })
            .catch(function(error) {
                console.error('Login error:', error);
                toast('Connection error. Please check your internet and try again.');
            });
            
    } catch (error) {
        console.error('Login function error:', error);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGOUT FUNCTION
// ============================================================
function logout() {
    console.log('=== LOGOUT STARTED ===');
    
    if (S.username) {
        firebase.database().ref('users/' + S.username).update({ online: false, last_seen: new Date().toISOString() }).catch(function(err) {
            console.error('Error updating status:', err);
        });
    }
    
    S = {
        username: null, name: '', bio: 'Building my energy. One aura at a time. ⚡',
        wallpaper: null, selectedAuras: [], avatar: null, friends: [],
        completedTasks: [], streakData: {}, socialPosts: [], diary: [],
        routines: [], videoData: [], bookmarks: [], notifications: [], groups: []
    };
    
    localStorage.removeItem('ws');
    localStorage.removeItem('wa');
    
    if (chatListener) { chatListener.off(); chatListener = null; }
    if (postsListener) { postsListener.off(); postsListener = null; }
    if (videosListener) { videosListener.off(); videosListener = null; }
    if (notifListener) { notifListener.off(); notifListener = null; }
    
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    
    var wpFab = document.getElementById('wpFab');
    var bottomNav = document.getElementById('bottomNav');
    if (wpFab) wpFab.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    
    navigate('landing');
    toast('Logged out successfully');
    console.log('✅ Logout complete');
}

// ============================================================
// CONFIRM AURA SELECTION
// ============================================================
function confirmSelection() {
    console.log('=== CONFIRMING AURAS ===');
    
    if (S.selectedAuras.length === 0) {
        toast('Please select at least one aura to continue.');
        return;
    }
    
    if (S.username) {
        firebase.database().ref('users/' + S.username + '/selected_auras').set(S.selectedAuras).then(function() {
            console.log('Auras saved to Firebase');
        }).catch(function(err) {
            console.error('Error saving auras:', err);
        });
    }
    
    saveState();
    
    var auraNames = S.selectedAuras.map(function(k) {
        return AURAS[k] ? AURAS[k].emoji + ' ' + AURAS[k].name : k;
    }).join(', ');
    
    toast('Auras activated: ' + auraNames + ' ✨');
    
    setTimeout(function() { 
        if (typeof navigate === 'function') {
            navigate('social'); 
            if (typeof initAppData === 'function') initAppData();
        } else {
            window.location.hash = '#social';
        }
    }, 500);
}

// ============================================================
// RESET PASSWORD
// ============================================================
function resetPassword() {
    console.log('=== PASSWORD RESET ===');
    
    showDialog({
        emoji: '🔑', title: 'Reset Password', subtitle: 'Enter your username to reset your password',
        placeholder: 'Your username...', confirmText: 'Next →'
    }).then(function(username) {
        if (!username || !username.trim()) return;
        
        var usernameVal = username.trim();
        
        firebase.database().ref('users/' + usernameVal).once('value').then(function(snapshot) {
            if (!snapshot.exists()) { 
                toast('User not found. Please check your username.'); 
                return; 
            }
            
            showDialog({
                emoji: '🔐', title: 'New Password', subtitle: 'Enter your new password (minimum 6 characters)',
                placeholder: 'New password...', confirmText: 'Save Password'
            }).then(function(newPassword) {
                if (!newPassword || !newPassword.trim()) return;
                var passwordVal = newPassword.trim();
                if (passwordVal.length < 6) { 
                    toast('Password must be at least 6 characters'); 
                    return; 
                }
                
                firebase.database().ref('users/' + usernameVal + '/password').set(passwordVal).then(function() {
                    toast('Password reset successfully! Please log in with your new password.');
                    setTimeout(function() { navigate('login'); }, 1000);
                }).catch(function(error) { 
                    console.error('Reset error:', error); 
                    toast('Error resetting password.'); 
                });
            });
        }).catch(function(error) { 
            console.error('Reset error:', error); 
            toast('Error. Please check your connection.'); 
        });
    });
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmSelection = confirmSelection;
window.resetPassword = resetPassword;

console.log('🔐 Auth module loaded successfully');
console.log('📌 handleSignup type:', typeof window.handleSignup);
console.log('📌 handleLogin type:', typeof window.handleLogin);