// Auth Module - Complete (Navigates to social, NOT diary)

// ============================================================
// HANDLE SIGNUP
// ============================================================
function handleSignup() {
    console.log('=== SIGNUP STARTED ===');
    
    var nameEl = document.getElementById('signupName');
    var usernameEl = document.getElementById('signupUser');
    var passwordEl = document.getElementById('signupPass');
    
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
    
    toast('Checking username...');
    
    firebase.database().ref('users/' + usernameVal).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            toast('Username already taken. Please choose another.');
            throw new Error('Username taken');
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
        
    }).then(function() {
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
        
        saveState();
        localStorage.setItem('wa', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
        
        setupPresence();
        
        nameEl.value = '';
        usernameEl.value = '';
        passwordEl.value = '';
        
        toast('Account created successfully! 🎉');
        
        setTimeout(function() { navigate('select'); }, 500);
        
    }).catch(function(error) {
        if (error.message !== 'Username taken') {
            console.error('Signup error:', error);
            toast('Error creating account. Please try again.');
        }
    });
}

// ============================================================
// HANDLE LOGIN - Goes to SOCIAL, not diary
// ============================================================
function handleLogin() {
    console.log('=== LOGIN STARTED ===');
    
    var usernameEl = document.getElementById('loginUser');
    var passwordEl = document.getElementById('loginPass');
    
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
    
    toast('Logging in...');
    
    firebase.database().ref('users/' + usernameVal).once('value').then(function(snapshot) {
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
        
        saveState();
        localStorage.setItem('wa', JSON.stringify({ username: usernameVal, timestamp: Date.now() }));
        
        setupPresence();
        
        usernameEl.value = '';
        passwordEl.value = '';
        
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
        
        firebase.database().ref('users/' + usernameVal).update({ online: true, last_seen: new Date().toISOString() });
        
        loadUserDataFromFirebase(usernameVal);
        
        var displayName = S.name || S.username;
        toast('Welcome back, ' + displayName + '! ✨');
        
        // NAVIGATE TO SOCIAL - NOT DIARY
        if (S.selectedAuras.length === 0) {
            setTimeout(function() { navigate('select'); }, 500);
        } else {
            setTimeout(function() { navigate('social'); initAppData(); }, 500);
        }
        
    }).catch(function(error) {
        console.error('Login error:', error);
        toast('Connection error. Please check your internet and try again.');
    });
}

// ============================================================
// HANDLE LOGOUT
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
    
    currentChat = null;
    chatMessages = [];
    viewingProfile = null;
    
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
    
    // GO TO SOCIAL AFTER AURA SELECTION
    setTimeout(function() { navigate('social'); initAppData(); }, 500);
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
            if (!snapshot.exists()) { toast('User not found. Please check your username.'); return; }
            
            showDialog({
                emoji: '🔐', title: 'New Password', subtitle: 'Enter your new password (minimum 6 characters)',
                placeholder: 'New password...', confirmText: 'Save Password'
            }).then(function(newPassword) {
                if (!newPassword || !newPassword.trim()) return;
                var passwordVal = newPassword.trim();
                if (passwordVal.length < 6) { toast('Password must be at least 6 characters'); return; }
                
                firebase.database().ref('users/' + usernameVal + '/password').set(passwordVal).then(function() {
                    toast('Password reset successfully! Please log in with your new password.');
                    setTimeout(function() { navigate('login'); }, 1000);
                }).catch(function(error) { console.error('Reset error:', error); toast('Error resetting password.'); });
            });
        }).catch(function(error) { console.error('Reset error:', error); toast('Error. Please check your connection.'); });
    });
}

// ============================================================
// DELETE ACCOUNT
// ============================================================
function deleteAccount() {
    showDialog({
        emoji: '⚠️', title: 'Delete Account', subtitle: 'This action cannot be undone. All your data will be permanently deleted.',
        confirmText: 'Delete My Account', danger: true, cancelText: 'Cancel'
    }).then(function(result) {
        if (result === null) return;
        
        showDialog({
            emoji: '🔐', title: 'Confirm Password', subtitle: 'Enter your password to confirm deletion',
            placeholder: 'Your password...', confirmText: 'Confirm Delete', danger: true
        }).then(function(password) {
            if (!password) return;
            
            firebase.database().ref('users/' + S.username).once('value').then(function(snapshot) {
                var userData = snapshot.val();
                if (userData.password !== password) { toast('Incorrect password'); return; }
                
                toast('Deleting account...');
                firebase.database().ref('users/' + S.username).remove();
                firebase.database().ref('diary/' + S.username).remove();
                firebase.database().ref('routines/' + S.username).remove();
                firebase.database().ref('notifications/' + S.username).remove();
                
                firebase.database().ref('posts').once('value').then(function(postSnapshot) {
                    var posts = postSnapshot.val();
                    if (posts) { Object.keys(posts).forEach(function(key) { if (posts[key].author === S.username) firebase.database().ref('posts/' + key).remove(); }); }
                });
                
                firebase.database().ref('videos').once('value').then(function(videoSnapshot) {
                    var videos = videoSnapshot.val();
                    if (videos) { Object.keys(videos).forEach(function(key) { if (videos[key].author === S.username) firebase.database().ref('videos/' + key).remove(); }); }
                });
                
                toast('Account deleted. Goodbye! 👋');
                setTimeout(function() { logout(); }, 1500);
            }).catch(function(error) { console.error('Delete error:', error); toast('Error deleting account.'); });
        });
    });
}

// ============================================================
// LOAD USER DATA FROM FIREBASE
// ============================================================
function loadUserDataFromFirebase(username) {
    if (!username) return;
    firebase.database().ref('users/' + username).once('value').then(function(snapshot) {
        if (snapshot.exists()) { var data = snapshot.val(); S.name = data.name || ''; S.bio = data.bio || S.bio; S.avatar = data.avatar || null; S.wallpaper = data.wallpaper || null; S.friends = data.friends || []; S.bookmarks = data.bookmarks || []; saveState(); }
    }).catch(function(error) { console.error('Load user error:', error); });
}

// ============================================================
// CHANGE PASSWORD
// ============================================================
function changePassword() {
    showDialog({ emoji: '🔐', title: 'Change Password', subtitle: 'Enter your current password', placeholder: 'Current password...', confirmText: 'Next →' }).then(function(currentPass) {
        if (!currentPass) return;
        firebase.database().ref('users/' + S.username).once('value').then(function(snapshot) {
            var userData = snapshot.val();
            if (userData.password !== currentPass) { toast('Incorrect current password'); return; }
            showDialog({ emoji: '🔑', title: 'New Password', subtitle: 'Enter new password (6+ characters)', placeholder: 'New password...', confirmText: 'Save' }).then(function(newPass) {
                if (!newPass || newPass.trim().length < 6) { toast('Password must be at least 6 characters'); return; }
                firebase.database().ref('users/' + S.username + '/password').set(newPass.trim()).then(function() { toast('Password changed! 🔐'); });
            });
        });
    });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmSelection = confirmSelection;
window.resetPassword = resetPassword;
window.deleteAccount = deleteAccount;
window.changePassword = changePassword;
window.loadUserDataFromFirebase = loadUserDataFromFirebase;

console.log('🔐 Auth module loaded - Navigates to SOCIAL');