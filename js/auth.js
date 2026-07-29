// ============================================================
// AUTH MODULE - COMPLETE FIX
// ============================================================

console.log('🔐 Auth module loading...');

// ============================================================
// SIMPLE TOAST FALLBACK
// ============================================================
if (typeof toast === 'undefined') {
    window.toast = function(message) {
        console.log('📢 TOAST:', message);
        alert(message);
    };
}

// ============================================================
// SIMPLE NAVIGATE FALLBACK
// ============================================================
if (typeof navigate === 'undefined') {
    window.navigate = function(page) {
        console.log('🧭 Navigate to:', page);
        var pages = document.querySelectorAll('.page');
        pages.forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById('page-' + page);
        if (target) target.classList.add('active');
    };
}

// ============================================================
// SIGNUP FUNCTION - DIRECT FIREBASE
// ============================================================
function handleSignup() {
    console.log('=== SIGNUP BUTTON CLICKED ===');
    
    try {
        var nameEl = document.getElementById('signupName');
        var usernameEl = document.getElementById('signupUser');
        var passwordEl = document.getElementById('signupPass');
        
        if (!nameEl || !usernameEl || !passwordEl) {
            toast('Form error. Please refresh.');
            return;
        }
        
        var nameVal = nameEl.value.trim();
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
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
        
        // Direct Firebase access
        var db = firebase.database();
        
        toast('Checking username...');
        
        db.ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (snapshot.exists()) {
                    toast('Username already taken');
                    return Promise.reject('Username taken');
                }
                
                console.log('✅ Creating account for:', usernameVal);
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
                
                return db.ref('users/' + usernameVal).set(userData);
            })
            .then(function() {
                console.log('✅ Account created for:', usernameVal);
                
                // Save session
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
                
                toast('Account created! 🎉');
                
                setTimeout(function() { navigate('select'); }, 500);
            })
            .catch(function(error) {
                if (error !== 'Username taken') {
                    console.error('❌ Signup error:', error);
                    toast('Error: ' + error.message);
                }
            });
            
    } catch (error) {
        console.error('❌ Signup error:', error);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGIN FUNCTION - DIRECT FIREBASE
// ============================================================
function handleLogin() {
    console.log('=== LOGIN BUTTON CLICKED ===');
    
    try {
        var usernameEl = document.getElementById('loginUser');
        var passwordEl = document.getElementById('loginPass');
        
        if (!usernameEl || !passwordEl) {
            toast('Form error. Please refresh.');
            return;
        }
        
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        if (!usernameVal || !passwordVal) {
            toast('Please fill all fields');
            return;
        }
        
        var db = firebase.database();
        
        toast('Logging in...');
        
        db.ref('users/' + usernameVal).once('value')
            .then(function(snapshot) {
                if (!snapshot.exists()) {
                    toast('User not found');
                    return;
                }
                
                var userData = snapshot.val();
                console.log('✅ User found');
                
                if (!userData.password) {
                    toast('Account data corrupted. Please create a new account.');
                    return;
                }
                
                if (userData.password !== passwordVal) {
                    toast('Incorrect password');
                    return;
                }
                
                console.log('✅ Login successful:', usernameVal);
                
                S.username = usernameVal;
                S.name = userData.name || '';
                S.bio = userData.bio || 'Building my energy. One aura at a time. ⚡';
                S.selectedAuras = userData.selected_auras || [];
                S.avatar = userData.avatar || null;
                S.wallpaper = userData.wallpaper || null;
                S.friends = userData.friends || [];
                S.bookmarks = userData.bookmarks || [];
                S.completedTasks = userData.completedTasks || [];
                S.streakData = userData.streakData || {};
                
                if (typeof saveState === 'function') saveState();
                localStorage.setItem('wa', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
                
                if (typeof setupPresence === 'function') setupPresence();
                
                usernameEl.value = '';
                passwordEl.value = '';
                
                if (S.wallpaper) {
                    document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
                }
                
                db.ref('users/' + usernameVal).update({ online: true, last_seen: new Date().toISOString() });
                
                toast('Welcome back, ' + (S.name || S.username) + '! ✨');
                
                if (S.selectedAuras.length === 0) {
                    setTimeout(function() { navigate('select'); }, 500);
                } else {
                    setTimeout(function() { 
                        navigate('social');
                        if (typeof initAppData === 'function') initAppData();
                    }, 500);
                }
            })
            .catch(function(error) {
                console.error('❌ Login error:', error);
                toast('Error: ' + error.message);
            });
            
    } catch (error) {
        console.error('❌ Login error:', error);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    console.log('=== LOGOUT ===');
    
    if (S.username) {
        firebase.database().ref('users/' + S.username).update({ online: false });
    }
    
    S = {
        username: null, name: '', bio: 'Building my energy. One aura at a time. ⚡',
        wallpaper: null, selectedAuras: [], avatar: null, friends: [],
        completedTasks: [], streakData: {}, socialPosts: [], diary: [],
        routines: [], videoData: [], bookmarks: [], notifications: [], groups: []
    };
    
    localStorage.removeItem('ws');
    localStorage.removeItem('wa');
    
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    
    var wpFab = document.getElementById('wpFab');
    var bottomNav = document.getElementById('bottomNav');
    if (wpFab) wpFab.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    
    navigate('landing');
    toast('Logged out');
}

// ============================================================
// CONFIRM AURAS
// ============================================================
function confirmSelection() {
    console.log('=== CONFIRMING AURAS ===');
    
    if (S.selectedAuras.length === 0) {
        toast('Select at least one aura');
        return;
    }
    
    if (S.username) {
        firebase.database().ref('users/' + S.username + '/selected_auras').set(S.selectedAuras);
    }
    
    if (typeof saveState === 'function') saveState();
    
    toast('Auras activated! ✨');
    setTimeout(function() { navigate('social'); }, 500);
}

// ============================================================
// RESET PASSWORD
// ============================================================
function resetPassword() {
    // Simple implementation
    var username = prompt('Enter your username to reset password:');
    if (!username) return;
    
    var newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        toast('Password must be at least 6 characters');
        return;
    }
    
    firebase.database().ref('users/' + username).once('value')
        .then(function(snapshot) {
            if (!snapshot.exists()) {
                toast('User not found');
                return;
            }
            return firebase.database().ref('users/' + username + '/password').set(newPassword);
        })
        .then(function() {
            toast('Password reset! Please login.');
        })
        .catch(function(error) {
            toast('Error: ' + error.message);
        });
}

// ============================================================
// EXPOSE
// ============================================================
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmSelection = confirmSelection;
window.resetPassword = resetPassword;

console.log('🔐 Auth module loaded');