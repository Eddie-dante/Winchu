// ============================================================
// AUTH MODULE - COMPLETE WITH DEBUG
// ============================================================

debugLog('🔐 AUTH MODULE LOADING...');

// ============================================================
// MAKE SURE S OBJECT EXISTS
// ============================================================
if (typeof S === 'undefined') {
    window.S = {
        username: null,
        name: '',
        bio: 'Building my energy. One aura at a time. ⚡',
        wallpaper: null,
        selectedAuras: [],
        avatar: null,
        friends: [],
        completedTasks: [],
        streakData: {},
        socialPosts: [],
        diary: [],
        routines: [],
        videoData: [],
        bookmarks: [],
        notifications: [],
        groups: []
    };
    debugLog('⚠️ S object created by auth.js');
}

// ============================================================
// MAKE SURE TOAST EXISTS
// ============================================================
if (typeof toast === 'undefined') {
    window.toast = function(message) {
        debugLog('📢 TOAST: ' + message);
        alert(message);
    };
    debugLog('⚠️ Toast fallback created');
}

// ============================================================
// MAKE SURE NAVIGATE EXISTS
// ============================================================
if (typeof navigate === 'undefined') {
    window.navigate = function(page) {
        debugLog('🧭 Navigate to: ' + page);
        var pages = document.querySelectorAll('.page');
        pages.forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');
    };
    debugLog('⚠️ Navigate fallback created');
}

// ============================================================
// SIGNUP FUNCTION - COMPLETE
// ============================================================
function handleSignup() {
    debugLog('=== SIGNUP BUTTON CLICKED ===');
    
    try {
        var nameEl = document.getElementById('signupName');
        var usernameEl = document.getElementById('signupUser');
        var passwordEl = document.getElementById('signupPass');
        
        debugLog('Elements found: name=' + !!nameEl + ', username=' + !!usernameEl + ', password=' + !!passwordEl);
        
        if (!nameEl || !usernameEl || !passwordEl) {
            toast('Form error. Please refresh the page.');
            debugLog('❌ Missing form elements');
            return;
        }
        
        var nameVal = nameEl.value.trim();
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        debugLog('Signup values: name=' + nameVal + ', username=' + usernameVal + ', password=***');
        
        if (!nameVal || !usernameVal || !passwordVal) {
            toast('Please fill all fields');
            debugLog('❌ Missing fields: name=' + !!nameVal + ', username=' + !!usernameVal + ', password=' + !!passwordVal);
            return;
        }
        
        if (usernameVal.length < 3) {
            toast('Username must be at least 3 characters');
            debugLog('❌ Username too short: ' + usernameVal.length);
            return;
        }
        
        if (passwordVal.length < 6) {
            toast('Password must be at least 6 characters');
            debugLog('❌ Password too short: ' + passwordVal.length);
            return;
        }
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.database) {
            toast('Firebase not loaded. Please check your connection.');
            debugLog('❌ Firebase not available');
            return;
        }
        
        debugLog('✅ Firebase available, checking username...');
        toast('Checking username...');
        
        firebase.database().ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (snapshot.exists()) {
                    toast('Username already taken. Please choose another.');
                    debugLog('❌ Username taken: ' + usernameVal);
                    return Promise.reject('Username taken');
                }
                
                debugLog('✅ Username available. Creating account...');
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
                debugLog('✅ Account created successfully for: ' + usernameVal);
                
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
                debugLog('✅ Account creation complete');
                
                setTimeout(function() { 
                    if (typeof navigate === 'function') {
                        debugLog('🧭 Navigating to select page');
                        navigate('select');
                    } else {
                        debugLog('⚠️ Navigate not available, using hash');
                        window.location.hash = '#select';
                    }
                }, 500);
            })
            .catch(function(error) {
                if (error !== 'Username taken') {
                    debugLog('❌ Signup error: ' + error.message);
                    toast('Error creating account. Please try again.');
                }
            });
            
    } catch (error) {
        debugLog('❌ Signup function error: ' + error.message);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGIN FUNCTION - COMPLETE
// ============================================================
function handleLogin() {
    debugLog('=== LOGIN BUTTON CLICKED ===');
    
    try {
        var usernameEl = document.getElementById('loginUser');
        var passwordEl = document.getElementById('loginPass');
        
        debugLog('Elements found: username=' + !!usernameEl + ', password=' + !!passwordEl);
        
        if (!usernameEl || !passwordEl) {
            toast('Form error. Please refresh the page.');
            debugLog('❌ Missing form elements');
            return;
        }
        
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        debugLog('Login attempt for: ' + usernameVal);
        
        if (!usernameVal || !passwordVal) {
            toast('Please fill all fields');
            debugLog('❌ Missing fields: username=' + !!usernameVal + ', password=' + !!passwordVal);
            return;
        }
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.database) {
            toast('Firebase not loaded. Please check your connection.');
            debugLog('❌ Firebase not available');
            return;
        }
        
        debugLog('✅ Firebase available, logging in...');
        toast('Logging in...');
        
        firebase.database().ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (!snapshot.exists()) {
                    debugLog('❌ User not found: ' + usernameVal);
                    toast('User not found. Please check your username or create an account.');
                    return;
                }
                
                var userData = snapshot.val();
                debugLog('✅ User found, checking password...');
                
                if (userData.password !== passwordVal) {
                    debugLog('❌ Password incorrect for: ' + usernameVal);
                    toast('Incorrect password. Please try again.');
                    return;
                }
                
                debugLog('✅ Login successful for: ' + usernameVal);
                
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
                debugLog('✅ Login complete for: ' + displayName);
                
                if (S.selectedAuras.length === 0) {
                    setTimeout(function() { 
                        if (typeof navigate === 'function') {
                            debugLog('🧭 Navigating to select page');
                            navigate('select');
                        } else {
                            window.location.hash = '#select';
                        }
                    }, 500);
                } else {
                    setTimeout(function() { 
                        if (typeof navigate === 'function') {
                            debugLog('🧭 Navigating to social page');
                            navigate('social');
                            if (typeof initAppData === 'function') initAppData();
                        } else {
                            window.location.hash = '#social';
                        }
                    }, 500);
                }
            })
            .catch(function(error) {
                debugLog('❌ Login error: ' + error.message);
                toast('Connection error. Please check your internet and try again.');
            });
            
    } catch (error) {
        debugLog('❌ Login function error: ' + error.message);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGOUT FUNCTION
// ============================================================
function logout() {
    debugLog('=== LOGOUT STARTED ===');
    
    if (S.username) {
        firebase.database().ref('users/' + S.username).update({ online: false, last_seen: new Date().toISOString() }).catch(function(err) {
            debugLog('❌ Error updating status: ' + err.message);
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
    debugLog('✅ Logout complete');
}

// ============================================================
// CONFIRM AURA SELECTION
// ============================================================
function confirmSelection() {
    debugLog('=== CONFIRMING AURAS ===');
    
    if (S.selectedAuras.length === 0) {
        toast('Please select at least one aura to continue.');
        debugLog('❌ No auras selected');
        return;
    }
    
    if (S.username) {
        firebase.database().ref('users/' + S.username + '/selected_auras').set(S.selectedAuras).then(function() {
            debugLog('✅ Auras saved to Firebase');
        }).catch(function(err) {
            debugLog('❌ Error saving auras: ' + err.message);
        });
    }
    
    saveState();
    
    var auraNames = S.selectedAuras.map(function(k) {
        return AURAS[k] ? AURAS[k].emoji + ' ' + AURAS[k].name : k;
    }).join(', ');
    
    toast('Auras activated: ' + auraNames + ' ✨');
    debugLog('✅ Auras activated: ' + auraNames);
    
    setTimeout(function() { 
        navigate('social'); 
        initAppData(); 
    }, 500);
}

// ============================================================
// RESET PASSWORD
// ============================================================
function resetPassword() {
    debugLog('=== PASSWORD RESET ===');
    
    showDialog({
        emoji: '🔑', title: 'Reset Password', subtitle: 'Enter your username to reset your password',
        placeholder: 'Your username...', confirmText: 'Next →'
    }).then(function(username) {
        if (!username || !username.trim()) {
            debugLog('❌ No username entered');
            return;
        }
        
        var usernameVal = username.trim();
        debugLog('Resetting password for: ' + usernameVal);
        
        firebase.database().ref('users/' + usernameVal).once('value').then(function(snapshot) {
            if (!snapshot.exists()) { 
                toast('User not found. Please check your username.'); 
                debugLog('❌ User not found: ' + usernameVal);
                return; 
            }
            
            showDialog({
                emoji: '🔐', title: 'New Password', subtitle: 'Enter your new password (minimum 6 characters)',
                placeholder: 'New password...', confirmText: 'Save Password'
            }).then(function(newPassword) {
                if (!newPassword || !newPassword.trim()) {
                    debugLog('❌ No new password entered');
                    return;
                }
                var passwordVal = newPassword.trim();
                if (passwordVal.length < 6) { 
                    toast('Password must be at least 6 characters'); 
                    debugLog('❌ Password too short: ' + passwordVal.length);
                    return; 
                }
                
                firebase.database().ref('users/' + usernameVal + '/password').set(passwordVal).then(function() {
                    toast('Password reset successfully! Please log in with your new password.');
                    debugLog('✅ Password reset for: ' + usernameVal);
                    setTimeout(function() { navigate('login'); }, 1000);
                }).catch(function(error) { 
                    debugLog('❌ Reset error: ' + error.message);
                    toast('Error resetting password.'); 
                });
            });
        }).catch(function(error) { 
            debugLog('❌ Reset error: ' + error.message);
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

debugLog('✅ Auth module loaded successfully');
debugLog('📌 handleSignup type: ' + typeof window.handleSignup);
debugLog('📌 handleLogin type: ' + typeof window.handleLogin);