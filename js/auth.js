// Authentication Module - Complete with password reset

function handleSignup() {
    console.log('Signup function called');
    
    const nameEl = document.getElementById('signupName');
    const usernameEl = document.getElementById('signupUser');
    const passwordEl = document.getElementById('signupPass');
    
    if (!nameEl || !usernameEl || !passwordEl) {
        toast('Form not found. Please refresh.');
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
    
    // Check if username contains only allowed characters
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
        
        console.log('Username available, creating account...');
        
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
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        
        // Clear form fields
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
}

function handleLogin() {
    console.log('Login function called');
    
    const usernameEl = document.getElementById('loginUser');
    const passwordEl = document.getElementById('loginPass');
    
    if (!usernameEl || !passwordEl) {
        toast('Form not found. Please refresh.');
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
        
        // Check password
        if (userData.password !== passwordVal) {
            console.log('Password incorrect for:', usernameVal);
            toast('Incorrect password. Please try again.');
            return;
        }
        
        console.log('Login successful for:', usernameVal);
        
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
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        loadUserData(usernameVal);
        
        // Apply wallpaper if set
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
        
        // Clear form fields
        usernameEl.value = '';
        passwordEl.value = '';
        
        toast('Welcome back! ✨');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            initAll();
        }
    }).catch(function(error) {
        console.error('Login error:', error);
        toast('Error logging in. Please check your connection.');
    });
}

function logout() {
    console.log('Logging out...');
    
    if (S.username) {
        updateData('users/' + S.username, {
            online: false,
            last_seen: new Date().toISOString()
        });
    }
    
    // Reset state
    S = {
        username: null,
        name: '',
        bio: 'Building my energy. ⚡',
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
    
    currentChat = null;
    chatMessages = [];
    viewingProfile = null;
    
    localStorage.removeItem('winchu_state');
    localStorage.removeItem('winchu_auth');
    
    // Remove Firebase listeners
    if (chatListener) { chatListener.off(); chatListener = null; }
    if (postsListener) { postsListener.off(); postsListener = null; }
    if (videosListener) { videosListener.off(); videosListener = null; }
    if (notifListener) { notifListener.off(); notifListener = null; }
    
    // Reset background
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    
    navigate('landing');
    toast('Logged out successfully');
}

function resetPassword() {
    showDialog({
        emoji: '🔑',
        title: 'Reset Password',
        subtitle: 'Enter your username to reset your password',
        placeholder: 'Your username...',
        confirmText: 'Next →'
    }).then(function(username) {
        if (!username || !username.trim()) return;
        
        const usernameVal = username.trim();
        
        getRef('users/' + usernameVal).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                toast('User not found');
                return;
            }
            
            showDialog({
                emoji: '🔐',
                title: 'New Password',
                subtitle: 'Enter your new password (6+ characters)',
                placeholder: 'New password...',
                confirmText: 'Save'
            }).then(function(newPassword) {
                if (!newPassword || !newPassword.trim()) return;
                
                const passwordVal = newPassword.trim();
                
                if (passwordVal.length < 6) {
                    toast('Password must be at least 6 characters');
                    return;
                }
                
                updateData('users/' + usernameVal + '/password', passwordVal).then(function() {
                    toast('Password reset successfully! Please log in.');
                    navigate('login');
                }).catch(function(error) {
                    console.error('Reset error:', error);
                    toast('Error resetting password');
                });
            });
        }).catch(function(error) {
            console.error('Reset error:', error);
            toast('Error finding user');
        });
    });
}

function deleteAccount() {
    showDialog({
        emoji: '⚠️',
        title: 'Delete Account',
        subtitle: 'This action cannot be undone. All your data will be permanently deleted.',
        confirmText: 'Delete My Account',
        danger: true,
        cancelText: 'Cancel'
    }).then(function(result) {
        if (result !== null) {
            showDialog({
                emoji: '🔐',
                title: 'Confirm Password',
                subtitle: 'Enter your password to confirm deletion',
                placeholder: 'Your password...',
                confirmText: 'Confirm Delete',
                danger: true
            }).then(function(password) {
                if (!password) return;
                
                getRef('users/' + S.username).once('value').then(function(snapshot) {
                    const userData = snapshot.val();
                    
                    if (userData.password !== password) {
                        toast('Incorrect password');
                        return;
                    }
                    
                    // Delete user data
                    removeData('users/' + S.username);
                    removeData('diary/' + S.username);
                    removeData('routines/' + S.username);
                    
                    // Delete user's posts
                    getRef('posts').once('value').then(function(postSnapshot) {
                        const posts = postSnapshot.val();
                        if (posts) {
                            Object.keys(posts).forEach(function(key) {
                                if (posts[key].author === S.username) {
                                    removeData('posts/' + key);
                                }
                            });
                        }
                    });
                    
                    // Delete user's videos
                    getRef('videos').once('value').then(function(videoSnapshot) {
                        const videos = videoSnapshot.val();
                        if (videos) {
                            Object.keys(videos).forEach(function(key) {
                                if (videos[key].author === S.username) {
                                    removeData('videos/' + key);
                                }
                            });
                        }
                    });
                    
                    toast('Account deleted. Goodbye! 👋');
                    logout();
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
        console.error('Load user data error:', error);
    });
    
    getRef('diary/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.diary = Object.values(snapshot.val()).reverse();
            if (typeof renderDiary === 'function') renderDiary();
        }
    }).catch(function(error) {
        console.error('Load diary error:', error);
    });
    
    getRef('routines/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.routines = Object.values(snapshot.val()).reverse();
            if (typeof renderRoutines === 'function') renderRoutines();
        }
    }).catch(function(error) {
        console.error('Load routines error:', error);
    });
}

// Expose all functions globally
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.resetPassword = resetPassword;
window.deleteAccount = deleteAccount;

console.log('🔐 Auth module loaded successfully');