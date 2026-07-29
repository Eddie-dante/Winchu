// Auth Module - Complete with debugging

console.log('🔐 Auth module loading...');

// ============================================================
// HANDLE SIGNUP
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
            console.error('Missing form elements');
            return;
        }
        
        var nameVal = nameEl.value.trim();
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        console.log('Signup attempt for:', usernameVal);
        
        if (!nameVal || !usernameVal || !passwordVal) {
            toast('Please fill all fields');
            console.log('Missing fields:', { name: !!nameVal, username: !!usernameVal, password: !!passwordVal });
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
    } catch (error) {
        console.error('Signup function error:', error);
        toast('An error occurred. Please try again.');
    }
}

// ============================================================
// HANDLE LOGIN
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
            console.error('Missing form elements');
            return;
        }
        
        var usernameVal = usernameEl.value.trim();
        var passwordVal = passwordEl.value.trim();
        
        console.log('Login attempt for:', usernameVal);
        
        if (!usernameVal || !passwordVal) {
            toast('Please fill all fields');
            console.log('Missing fields:', { username: !!usernameVal, password: !!passwordVal });
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
            
            if (S.selectedAuras.length === 0) {
                setTimeout(function() { navigate('select'); }, 500);
            } else {
                setTimeout(function() { navigate('social'); initAppData(); }, 500);
            }
            
        }).catch(function(error) {
            console.error('Login error:', error);
            toast('Connection error. Please check your internet and try again.');
        });
    } catch (error) {
        console.error('Login function error:', error);
        toast('An error occurred. Please try again.');
    }
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

console.log('🔐 Auth module loaded successfully');