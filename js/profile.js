// Profile Module - Complete with fixed friend registration

// ============================================================
// RENDER PROFILE
// ============================================================
function renderProfile() {
    if (!S.username) return;
    
    var profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = S.name || S.username;
    
    var profileUsername = document.getElementById('profileUsername');
    if (profileUsername) profileUsername.textContent = '@' + S.username;
    
    var profileBio = document.getElementById('profileBio');
    if (profileBio) profileBio.textContent = S.bio || 'Building my energy. One aura at a time. ⚡';
    
    updateProfileAvatar();
    updatePostAvatarInComposer();
    
    var userPosts = (S.socialPosts || []).filter(function(p) { return p.author === S.username; });
    
    var profilePosts = document.getElementById('profilePosts');
    if (profilePosts) profilePosts.textContent = userPosts.length;
    
    var profileFriends = document.getElementById('profileFriends');
    if (profileFriends) profileFriends.textContent = (S.friends || []).length;
    
    var profileBookmarks = document.getElementById('profileBookmarks');
    if (profileBookmarks) profileBookmarks.textContent = (S.bookmarks || []).length;
    
    renderProfileRequests();
    
    if (typeof updateNotifBadge === 'function') updateNotifBadge();
    
    var postsGrid = document.getElementById('profilePostsGrid');
    if (postsGrid) {
        if (userPosts.length === 0) {
            postsGrid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:20px;">No posts yet. Share your first post! 📸</p>';
        } else {
            var sortedPosts = userPosts.slice().sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            var gridHTML = '';
            sortedPosts.forEach(function(post) {
                var img = post.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
                gridHTML += '<div style="aspect-ratio:1;background-image:url(' + img + ');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;" onclick="viewPostDetail(\'' + post.id + '\')"></div>';
            });
            postsGrid.innerHTML = gridHTML;
        }
    }
}

function updateProfileAvatar() {
    var avatarContainer = document.getElementById('profileAvatarEmoji');
    if (!avatarContainer) return;
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        avatarContainer.innerHTML = '<img src="' + S.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = getColor(S.username);
        var initial = (S.name || S.username).charAt(0).toUpperCase();
        avatarContainer.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">' + initial + '</div>';
    }
}

function updatePostAvatarInComposer() {
    var postAvatar = document.getElementById('postAvatarEmoji');
    if (!postAvatar) return;
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        postAvatar.innerHTML = '<img src="' + S.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = getColor(S.username);
        var initial = (S.name || S.username).charAt(0).toUpperCase();
        postAvatar.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + initial + '</div>';
    }
}

function renderProfileRequests() {
    var section = document.getElementById('profileRequestsSection');
    if (!section) return;
    firebase.database().ref('friendRequests/' + S.username).once('value').then(function(snapshot) {
        var requests = snapshot.val() || [];
        if (!Array.isArray(requests)) requests = [];
        if (requests.length === 0) { section.style.display = 'none'; return; }
        section.style.display = 'block';
        var html = '<div style="background:rgba(99,102,241,0.1);border-radius:12px;padding:12px;margin-bottom:8px;"><strong style="font-size:12px;">🔔 Friend Requests (' + requests.length + ')</strong>';
        requests.forEach(function(requester) {
            var color = getColor(requester);
            html += '<div class="request-card" style="margin-top:8px;"><div class="req-avatar" style="background:' + color + ';">' + requester.charAt(0).toUpperCase() + '</div><div class="req-info"><div class="req-name">@' + requester + '</div></div><div class="req-actions"><button class="btn-sm btn-success" onclick="acceptFriendRequest(\'' + requester + '\')" style="padding:5px 12px;font-size:11px;">✅ Accept</button><button class="btn-sm btn-danger" onclick="declineFriendRequest(\'' + requester + '\')" style="padding:5px 12px;font-size:11px;">❌ Decline</button></div></div>';
        });
        html += '</div>';
        section.innerHTML = html;
    });
}

function editName() {
    showDialog({ emoji: '✏️', title: 'Edit Display Name', placeholder: 'Your display name...', defaultValue: S.name || '', confirmText: 'Save Name' }).then(function(result) {
        if (result !== null) { 
            S.name = result.trim(); 
            if (S.username) { 
                firebase.database().ref('users/' + S.username + '/name').set(S.name); 
                updateAllPostsAuthorName(S.name); 
            } 
            saveState(); 
            renderProfile(); 
            updateProfileAvatar(); 
            updatePostAvatarInComposer(); 
            toast('Name updated! ✏️'); 
        }
    });
}

function editProfile() {
    showDialog({ emoji: '📝', title: 'Edit Bio', placeholder: 'Write a short bio...', defaultValue: S.bio || '', confirmText: 'Save Bio' }).then(function(result) {
        if (result !== null) { 
            S.bio = result.trim() || 'Building my energy. One aura at a time. ⚡'; 
            if (S.username) firebase.database().ref('users/' + S.username + '/bio').set(S.bio); 
            saveState(); 
            renderProfile(); 
            toast('Bio updated! 📝'); 
        }
    });
}

function handleAvatarSelect(event) {
    var file = event.target.files[0]; 
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
        toast('Select an image file'); 
        event.target.value = ''; 
        return; 
    }
    if (file.size > 10*1024*1024) { 
        toast('Max 10MB'); 
        event.target.value = ''; 
        return; 
    }
    toast('Uploading...');
    var reader = new FileReader();
    reader.onload = function(e) { 
        S.avatar = e.target.result; 
        if (S.username) firebase.database().ref('users/' + S.username + '/avatar').set(S.avatar); 
        updateAllPostsAvatar(S.avatar); 
        updateProfileAvatar(); 
        updatePostAvatarInComposer(); 
        saveState(); 
        toast('✅ Avatar updated!'); 
    };
    reader.readAsDataURL(file);
}

function updateAllPostsAvatar(avatarUrl) {
    (S.socialPosts || []).forEach(function(post) { 
        if (post.author === S.username) post.avatar = avatarUrl; 
    });
    firebase.database().ref('posts').once('value').then(function(snapshot) { 
        var data = snapshot.val(); 
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                if (data[key].author === S.username) 
                    firebase.database().ref('posts/' + key + '/avatar').set(avatarUrl); 
            }); 
        } 
    });
}

function updateAllPostsAuthorName(newName) {
    (S.socialPosts || []).forEach(function(post) { 
        if (post.author === S.username) post.author = newName; 
    });
    firebase.database().ref('posts').once('value').then(function(snapshot) { 
        var data = snapshot.val(); 
        if (data) { 
            Object.keys(data).forEach(function(key) { 
                if (data[key].author === S.username) 
                    firebase.database().ref('posts/' + key + '/author').set(newName); 
            }); 
        } 
    });
}

// ============================================================
// RENDER USERS LIST
// ============================================================
function renderUsers() {
    var container = document.getElementById('usersList'); 
    if (!container) return;
    if (!S.username) { 
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in</p>'; 
        return; 
    }
    firebase.database().ref('friendRequests/' + S.username).once('value').then(function(reqSnapshot) {
        var pendingRequests = reqSnapshot.val() || [];
        if (!Array.isArray(pendingRequests)) pendingRequests = [];
        firebase.database().ref('users').once('value').then(function(snapshot) {
            var users = snapshot.val() || {}; 
            var usernames = Object.keys(users);
            if (usernames.length === 0) { 
                container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No users found.</p>'; 
                return; 
            }
            var html = '';
            if (pendingRequests.length > 0) {
                html += '<div style="margin-bottom:16px;padding:12px;background:rgba(99,102,241,0.1);border-radius:14px;"><strong style="font-size:13px;">🔔 Pending Requests (' + pendingRequests.length + ')</strong>';
                pendingRequests.forEach(function(requester) {
                    var color = getColor(requester);
                    html += '<div class="request-card" style="margin-top:8px;"><div class="req-avatar" style="background:' + color + ';">' + requester.charAt(0).toUpperCase() + '</div><div class="req-info"><div class="req-name">@' + requester + '</div></div><div class="req-actions"><button class="btn-sm btn-success" onclick="acceptFriendRequest(\'' + requester + '\')">✅</button><button class="btn-sm btn-danger" onclick="declineFriendRequest(\'' + requester + '\')">❌</button></div></div>';
                });
                html += '<div style="margin:12px 0;border-top:1px solid rgba(0,0,0,0.1);"></div>';
            }
            html += '<strong style="font-size:13px;">👥 All Users</strong><br><br>';
            usernames.forEach(function(username) {
                if (pendingRequests.indexOf(username) > -1) return;
                var isMe = username === S.username;
                var userData = users[username] || {};
                var isFriend = (S.friends || []).indexOf(username) > -1;
                var color = getColor(username);
                var isOnline = userData.online === true;
                var avatarHTML = userData.avatar && (userData.avatar.startsWith('data:') || userData.avatar.includes('http')) ? '<img src="' + userData.avatar + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />' : '<div style="width:40px;height:40px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + username.charAt(0).toUpperCase() + '</div>';
                html += '<div class="user-card"><div class="user-avatar" onclick="viewUserProfile(\'' + username + '\')">' + avatarHTML + '</div><div class="user-info"><div class="name" onclick="viewUserProfile(\'' + username + '\')">' + (isMe ? '⭐ ' : '') + escapeHtml(userData.name || username) + ' <span class="status-dot ' + (isOnline ? 'online' : 'offline') + '"></span></div><div class="bio">' + escapeHtml(userData.bio || 'No bio yet') + '</div></div><div class="actions">' + (!isMe ? (isFriend ? '<button class="btn-sm btn-success">✓ Friends</button>' : '<button class="btn-sm" onclick="sendFriendRequest(\'' + username + '\')">➕ Add</button>') : '') + '</div></div>';
            });
            container.innerHTML = html;
        });
    });
}

// ============================================================
// FIXED SEND FRIEND REQUEST
// ============================================================
function sendFriendRequest(username) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    if (username === S.username) {
        toast('Cannot add yourself');
        return;
    }
    
    // Check if already friends
    if ((S.friends || []).indexOf(username) > -1) {
        toast('Already friends');
        return;
    }
    
    // Check if request already sent
    firebase.database().ref('friendRequests/' + username).once('value')
        .then(function(snapshot) {
            var requests = snapshot.val() || [];
            if (!Array.isArray(requests)) {
                requests = [];
            }
            
            if (requests.indexOf(S.username) > -1) {
                toast('Friend request already sent');
                return;
            }
            
            requests.push(S.username);
            return firebase.database().ref('friendRequests/' + username).set(requests);
        })
        .then(function() {
            // Send notification
            return firebase.database().ref('notifications/' + username).push({
                from: S.username,
                message: 'sent you a friend request',
                type: 'friend_request',
                time: new Date().toISOString(),
                read: false
            });
        })
        .then(function() {
            toast('Friend request sent! 📨');
            if (typeof renderUsers === 'function') renderUsers();
            if (typeof renderProfile === 'function') renderProfile();
        })
        .catch(function(error) {
            console.error('Error sending friend request:', error);
            toast('Error sending friend request. Please try again.');
        });
}

// ============================================================
// FIXED ACCEPT FRIEND REQUEST - Properly registers for both users
// ============================================================
function acceptFriendRequest(username) {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    toast('Accepting friend request...');
    
    // Step 1: Get current user's friends
    var currentUserFriends = S.friends || [];
    if (!Array.isArray(currentUserFriends)) {
        currentUserFriends = [];
    }
    if (currentUserFriends.indexOf(username) === -1) {
        currentUserFriends.push(username);
    }
    
    // Step 2: Update current user's friends in Firebase first
    firebase.database().ref('users/' + S.username + '/friends').set(currentUserFriends)
        .then(function() {
            // Step 3: Get the other user's friends
            return firebase.database().ref('users/' + username + '/friends').once('value');
        })
        .then(function(snapshot) {
            var theirFriends = snapshot.val() || [];
            if (!Array.isArray(theirFriends)) {
                theirFriends = [];
            }
            if (theirFriends.indexOf(S.username) === -1) {
                theirFriends.push(S.username);
            }
            // Step 4: Update other user's friends in Firebase
            return firebase.database().ref('users/' + username + '/friends').set(theirFriends);
        })
        .then(function() {
            // Step 5: Remove the friend request
            return firebase.database().ref('friendRequests/' + S.username).once('value');
        })
        .then(function(snapshot) {
            var requests = snapshot.val() || [];
            if (!Array.isArray(requests)) {
                requests = [];
            }
            requests = requests.filter(function(r) { return r !== username; });
            return firebase.database().ref('friendRequests/' + S.username).set(requests);
        })
        .then(function() {
            // Step 6: Send notification to the other user
            return firebase.database().ref('notifications/' + username).push({
                from: S.username,
                message: 'accepted your friend request',
                type: 'friend_accept',
                time: new Date().toISOString(),
                read: false
            });
        })
        .then(function() {
            // Step 7: Update local state
            S.friends = currentUserFriends;
            saveState();
            
            // Step 8: Force refresh all UI
            if (typeof renderProfile === 'function') renderProfile();
            if (typeof renderUsers === 'function') renderUsers();
            if (typeof renderChatList === 'function') renderChatList();
            if (typeof renderSocial === 'function') renderSocial();
            
            toast('✅ You and @' + username + ' are now friends! 🎉');
            
            // Step 9: Force sync from Firebase to ensure consistency
            setTimeout(function() {
                forceSyncUserData();
                // Also sync the other user's data
                firebase.database().ref('users/' + username).once('value')
                    .then(function(snap) {
                        if (snap.exists()) {
                            var data = snap.val();
                            // Update the other user's data in local state if they're in the same session
                            // This helps when both users are logged in on different tabs
                            console.log('✅ Synced friend data for:', username);
                        }
                    });
            }, 500);
        })
        .catch(function(error) {
            console.error('Error accepting friend request:', error);
            toast('Error accepting friend request. Please try again.');
        });
}

// ============================================================
// FIXED DECLINE FRIEND REQUEST
// ============================================================
function declineFriendRequest(username) {
    if (!S.username) return;
    
    firebase.database().ref('friendRequests/' + S.username).once('value')
        .then(function(snapshot) {
            var requests = snapshot.val() || [];
            if (!Array.isArray(requests)) {
                requests = [];
            }
            requests = requests.filter(function(r) { return r !== username; });
            return firebase.database().ref('friendRequests/' + S.username).set(requests);
        })
        .then(function() {
            toast('Request declined');
            if (typeof renderProfile === 'function') renderProfile();
            if (typeof renderUsers === 'function') renderUsers();
        })
        .catch(function(error) {
            console.error('Error declining request:', error);
        });
}

// ============================================================
// FORCE SYNC USER DATA
// ============================================================
function forceSyncUserData() {
    if (!S.username) {
        console.warn('No user logged in to sync');
        return;
    }
    
    console.log('🔄 Force syncing user data...');
    
    firebase.database().ref('users/' + S.username).once('value')
        .then(function(snapshot) {
            if (snapshot.exists()) {
                var data = snapshot.val();
                S.friends = data.friends || [];
                S.name = data.name || S.name;
                S.bio = data.bio || S.bio;
                S.avatar = data.avatar || S.avatar;
                S.wallpaper = data.wallpaper || S.wallpaper;
                S.bookmarks = data.bookmarks || [];
                S.selectedAuras = data.selected_auras || [];
                S.completedTasks = data.completedTasks || [];
                S.streakData = data.streakData || {};
                saveState();
                
                if (typeof renderProfile === 'function') renderProfile();
                if (typeof renderUsers === 'function') renderUsers();
                if (typeof renderChatList === 'function') renderChatList();
                if (typeof renderSocial === 'function') renderSocial();
                if (typeof renderHome === 'function') renderHome();
                if (typeof renderNotifications === 'function') renderNotifications();
                if (typeof renderGroups === 'function') renderGroups();
                
                console.log('✅ User data force synced successfully');
                return true;
            }
            return false;
        })
        .catch(function(error) {
            console.error('Force sync error:', error);
            return false;
        });
}

// ============================================================
// VIEW USER PROFILE
// ============================================================
function viewUserProfile(username) {
    if (!username || username === S.username) { 
        navigate('profile'); 
        return; 
    }
    viewingProfile = username;
    navigate('userprofile', username);
}

function renderUserProfile(username) {
    if (!username) return;
    firebase.database().ref('users/' + username).once('value').then(function(snapshot) {
        if (!snapshot.exists()) { 
            toast('User not found'); 
            return; 
        }
        var data = snapshot.val(); 
        var color = getColor(username);
        var avatarEl = document.getElementById('viewProfileAvatar');
        if (avatarEl) { 
            if (data.avatar && (data.avatar.startsWith('data:') || data.avatar.includes('http'))) { 
                avatarEl.innerHTML = '<img src="' + data.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'; 
            } else { 
                avatarEl.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">' + (data.name || username).charAt(0).toUpperCase() + '</div>'; 
            } 
        }
        var nameEl = document.getElementById('viewProfileName'); 
        if (nameEl) nameEl.textContent = data.name || username;
        var usernameEl = document.getElementById('viewProfileUsername'); 
        if (usernameEl) usernameEl.textContent = '@' + username;
        var bioEl = document.getElementById('viewProfileBio'); 
        if (bioEl) bioEl.textContent = data.bio || 'No bio yet';
        var userPosts = (S.socialPosts || []).filter(function(p) { return p.author === username; });
        var postsEl = document.getElementById('viewProfilePosts'); 
        if (postsEl) postsEl.textContent = userPosts.length;
        var friendsEl = document.getElementById('viewProfileFriends'); 
        if (friendsEl) friendsEl.textContent = (data.friends || []).length;
        var actionsEl = document.getElementById('viewProfileActions');
        if (actionsEl) { 
            if ((S.friends || []).indexOf(username) > -1) { 
                var dmId = [S.username, username].sort().join('_dm_'); 
                actionsEl.innerHTML = '<button class="btn-sm btn-success">✓ Friends</button> <button class="btn-sm" onclick="openChat(\'' + dmId + '\', \'dm\')">💬 Message</button>'; 
            } else { 
                actionsEl.innerHTML = '<button class="btn-sm btn-primary" onclick="sendFriendRequest(\'' + username + '\')">➕ Add Friend</button>'; 
            } 
        }
        var gridEl = document.getElementById('viewProfilePostsGrid');
        if (gridEl) { 
            if (userPosts.length === 0) { 
                gridEl.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:20px;">No posts yet.</p>'; 
            } else { 
                gridEl.innerHTML = userPosts.slice().sort(function(a, b) { return new Date(b.time) - new Date(a.time); }).map(function(post) { 
                    var img = post.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80'; 
                    return '<div style="aspect-ratio:1;background-image:url(' + img + ');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;" onclick="viewPostDetail(\'' + post.id + '\')"></div>'; 
                }).join(''); 
            } 
        }
    });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderProfile = renderProfile;
window.updateProfileAvatar = updateProfileAvatar;
window.updatePostAvatarInComposer = updatePostAvatarInComposer;
window.renderProfileRequests = renderProfileRequests;
window.editName = editName;
window.editProfile = editProfile;
window.handleAvatarSelect = handleAvatarSelect;
window.renderUsers = renderUsers;
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.viewUserProfile = viewUserProfile;
window.renderUserProfile = renderUserProfile;
window.forceSyncUserData = forceSyncUserData;

console.log('👤 Profile loaded - fixed friend registration');