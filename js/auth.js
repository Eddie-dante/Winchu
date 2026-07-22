// Authentication Module - Complete with signup, login, logout, password reset, and account deletion

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
    
    // Validation
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
    
    // Only allow letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(usernameVal)) {
        toast('Username can only contain letters, numbers, and underscores');
        return;
    }
    
    // Check if username already exists
    toast('Checking username availability...');
    
    db.ref('users/' + usernameVal).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            toast('Username already taken. Please choose another.');
            throw new Error('Username taken');
        }
        
        console.log('Username available. Creating account...');
        toast('Creating account...');
        
        // Create user data object
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
        
        // Save to Firebase
        return db.ref('users/' + usernameVal).set(userData);
        
    }).then(function() {
        console.log('Account created successfully for:', usernameVal);
        
        // Set session state
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
        
        // Save state to localStorage
        saveState();
        localStorage.setItem('wa', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        // Setup online presence
        setupPresence();
        
        // Clear form fields
        nameEl.value = '';
        usernameEl.value = '';
        passwordEl.value = '';
        
        // Show success
        toast('Account created successfully! 🎉');
        
        // Navigate to aura selection
        setTimeout(function() {
            navigate('select');
        }, 500);
        
    }).catch(function(error) {
        if (error.message !== 'Username taken') {
            console.error('Signup error:', error);
            toast('Error creating account. Please try again.');
        }
    });
}

// ============================================================
// HANDLE LOGIN
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
    
    db.ref('users/' + usernameVal).once('value').then(function(snapshot) {
        if (!snapshot.exists()) {
            console.log('User not found:', usernameVal);
            toast('User not found. Please check your username or create an account.');
            return;
        }
        
        var userData = snapshot.val();
        console.log('User found, checking password...');
        
        // Verify password
        if (userData.password !== passwordVal) {
            console.log('Password incorrect for:', usernameVal);
            toast('Incorrect password. Please try again.');
            return;
        }
        
        console.log('Login successful for:', usernameVal);
        
        // Set session state
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
        
        // Save state
        saveState();
        localStorage.setItem('wa', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        // Setup presence
        setupPresence();
        
        // Clear form
        usernameEl.value = '';
        passwordEl.value = '';
        
        // Apply wallpaper if set
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
        
        // Update online status
        db.ref('users/' + usernameVal).update({
            online: true,
            last_seen: new Date().toISOString()
        });
        
        // Load user data from Firebase
        loadUserDataFromFirebase(usernameVal);
        
        // Show welcome toast
        var displayName = S.name || S.username;
        toast('Welcome back, ' + displayName + '! ✨');
        
        // Navigate to appropriate page
        if (S.selectedAuras.length === 0) {
            setTimeout(function() {
                navigate('select');
            }, 500);
        } else {
            setTimeout(function() {
                navigate('social');
                initAppData();
            }, 500);
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
    
    // Update online status in Firebase
    if (S.username && db) {
        db.ref('users/' + S.username).update({
            online: false,
            last_seen: new Date().toISOString()
        }).catch(function(err) {
            console.error('Error updating status:', err);
        });
    }
    
    // Clear all state
    S = {
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
    
    currentChat = null;
    chatMessages = [];
    viewingProfile = null;
    
    // Clear localStorage
    localStorage.removeItem('ws');
    localStorage.removeItem('wa');
    
    // Remove all Firebase listeners
    if (chatListener) {
        chatListener.off();
        chatListener = null;
    }
    if (postsListener) {
        postsListener.off();
        postsListener = null;
    }
    if (videosListener) {
        videosListener.off();
        videosListener = null;
    }
    if (notifListener) {
        notifListener.off();
        notifListener = null;
    }
    
    // Reset background to default
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    
    // Hide UI elements
    var wpFab = document.getElementById('wpFab');
    var bottomNav = document.getElementById('bottomNav');
    if (wpFab) wpFab.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    
    // Navigate to landing
    navigate('landing');
    
    toast('Logged out successfully');
    console.log('✅ Logout complete');
}

// ============================================================
// CONFIRM AURA SELECTION
// ============================================================
function confirmSelection() {
    console.log('=== CONFIRMING AURA SELECTION ===');
    
    if (S.selectedAuras.length === 0) {
        toast('Please select at least one aura to continue.');
        return;
    }
    
    // Save auras to Firebase
    if (S.username) {
        db.ref('users/' + S.username + '/selected_auras').set(S.selectedAuras).then(function() {
            console.log('Auras saved to Firebase');
        }).catch(function(err) {
            console.error('Error saving auras:', err);
        });
    }
    
    // Save to local state
    saveState();
    
    // Show confirmation
    var auraNames = S.selectedAuras.map(function(k) {
        return AURAS[k] ? AURAS[k].emoji + ' ' + AURAS[k].name : k;
    }).join(', ');
    
    toast('Auras activated: ' + auraNames + ' ✨');
    
    // Navigate to social feed
    setTimeout(function() {
        navigate('social');
        initAppData();
    }, 500);
}

// ============================================================
// RESET PASSWORD
// ============================================================
function resetPassword() {
    console.log('=== PASSWORD RESET STARTED ===');
    
    showDialog({
        emoji: '🔑',
        title: 'Reset Password',
        subtitle: 'Enter your username to reset your password',
        placeholder: 'Your username...',
        confirmText: 'Next →'
    }).then(function(username) {
        if (!username || !username.trim()) return;
        
        var usernameVal = username.trim();
        
        db.ref('users/' + usernameVal).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                toast('User not found. Please check your username.');
                return;
            }
            
            showDialog({
                emoji: '🔐',
                title: 'New Password',
                subtitle: 'Enter your new password (minimum 6 characters)',
                placeholder: 'New password...',
                confirmText: 'Save Password'
            }).then(function(newPassword) {
                if (!newPassword || !newPassword.trim()) return;
                
                var passwordVal = newPassword.trim();
                
                if (passwordVal.length < 6) {
                    toast('Password must be at least 6 characters');
                    return;
                }
                
                db.ref('users/' + usernameVal + '/password').set(passwordVal).then(function() {
                    toast('Password reset successfully! Please log in with your new password.');
                    setTimeout(function() {
                        navigate('login');
                    }, 1000);
                }).catch(function(error) {
                    console.error('Reset error:', error);
                    toast('Error resetting password. Please try again.');
                });
            });
        }).catch(function(error) {
            console.error('Reset error:', error);
            toast('Error. Please check your connection.');
        });
    });
}

// ============================================================
// DELETE ACCOUNT
// ============================================================
function deleteAccount() {
    console.log('=== ACCOUNT DELETION STARTED ===');
    
    showDialog({
        emoji: '⚠️',
        title: 'Delete Account',
        subtitle: 'This action cannot be undone. All your data including posts, videos, diary entries, and routines will be permanently deleted.',
        confirmText: 'Delete My Account',
        danger: true,
        cancelText: 'Cancel'
    }).then(function(result) {
        if (result === null) return;
        
        showDialog({
            emoji: '🔐',
            title: 'Confirm Password',
            subtitle: 'Enter your password to confirm account deletion',
            placeholder: 'Your password...',
            confirmText: 'Confirm Delete',
            danger: true
        }).then(function(password) {
            if (!password) return;
            
            db.ref('users/' + S.username).once('value').then(function(snapshot) {
                var userData = snapshot.val();
                
                if (userData.password !== password) {
                    toast('Incorrect password');
                    return;
                }
                
                toast('Deleting account...');
                
                // Delete user profile
                db.ref('users/' + S.username).remove();
                
                // Delete diary entries
                db.ref('diary/' + S.username).remove();
                
                // Delete routines
                db.ref('routines/' + S.username).remove();
                
                // Delete notifications
                db.ref('notifications/' + S.username).remove();
                
                // Delete user's posts
                db.ref('posts').once('value').then(function(postSnapshot) {
                    var posts = postSnapshot.val();
                    if (posts) {
                        Object.keys(posts).forEach(function(key) {
                            if (posts[key].author === S.username) {
                                db.ref('posts/' + key).remove();
                            }
                        });
                    }
                });
                
                // Delete user's videos
                db.ref('videos').once('value').then(function(videoSnapshot) {
                    var videos = videoSnapshot.val();
                    if (videos) {
                        Object.keys(videos).forEach(function(key) {
                            if (videos[key].author === S.username) {
                                db.ref('videos/' + key).remove();
                            }
                        });
                    }
                });
                
                // Remove from friends lists
                db.ref('users').once('value').then(function(usersSnapshot) {
                    var users = usersSnapshot.val();
                    if (users) {
                        Object.keys(users).forEach(function(key) {
                            var userFriends = users[key].friends || [];
                            var updatedFriends = userFriends.filter(function(f) {
                                return f !== S.username;
                            });
                            if (updatedFriends.length !== userFriends.length) {
                                db.ref('users/' + key + '/friends').set(updatedFriends);
                            }
                        });
                    }
                });
                
                // Remove friend requests
                db.ref('friendRequests').once('value').then(function(reqSnapshot) {
                    var requests = reqSnapshot.val();
                    if (requests) {
                        Object.keys(requests).forEach(function(key) {
                            var filtered = (requests[key] || []).filter(function(r) {
                                return r !== S.username;
                            });
                            if (filtered.length === 0) {
                                db.ref('friendRequests/' + key).remove();
                            } else {
                                db.ref('friendRequests/' + key).set(filtered);
                            }
                        });
                    }
                });
                
                toast('Account deleted. Goodbye! 👋');
                setTimeout(function() {
                    logout();
                }, 1500);
                
            }).catch(function(error) {
                console.error('Delete error:', error);
                toast('Error deleting account. Please try again.');
            });
        });
    });
}

// ============================================================
// LOAD USER DATA FROM FIREBASE
// ============================================================
function loadUserDataFromFirebase(username) {
    if (!username) return;
    
    db.ref('users/' + username).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            var data = snapshot.val();
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
    
    // Load diary entries
    db.ref('diary/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.diary = Object.values(snapshot.val()).reverse();
        }
    });
    
    // Load routines
    db.ref('routines/' + username).orderByKey().limitToLast(100).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            S.routines = Object.values(snapshot.val()).reverse();
        }
    });
}

// ============================================================
// CHANGE PASSWORD (when logged in)
// ============================================================
function changePassword() {
    showDialog({
        emoji: '🔐',
        title: 'Change Password',
        subtitle: 'Enter your current password',
        placeholder: 'Current password...',
        confirmText: 'Next →'
    }).then(function(currentPass) {
        if (!currentPass) return;
        
        db.ref('users/' + S.username).once('value').then(function(snapshot) {
            var userData = snapshot.val();
            
            if (userData.password !== currentPass) {
                toast('Incorrect current password');
                return;
            }
            
            showDialog({
                emoji: '🔑',
                title: 'New Password',
                subtitle: 'Enter your new password (6+ characters)',
                placeholder: 'New password...',
                confirmText: 'Save'
            }).then(function(newPass) {
                if (!newPass || newPass.trim().length < 6) {
                    toast('Password must be at least 6 characters');
                    return;
                }
                
                db.ref('users/' + S.username + '/password').set(newPass.trim()).then(function() {
                    toast('Password changed successfully! 🔐');
                });
            });
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
window.deleteAccount = deleteAccount;
window.changePassword = changePassword;
window.loadUserDataFromFirebase = loadUserDataFromFirebase;

console.log('🔐 Auth module loaded successfully');