// Profile Module - Complete with avatar management, friend system, user profiles

// ============================================================
// RENDER PROFILE
// ============================================================
function renderProfile() {
    if (!S.username) return;
    
    console.log('Rendering profile for:', S.username);
    
    // Update profile name
    var profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = S.name || S.username;
    
    // Update username
    var profileUsername = document.getElementById('profileUsername');
    if (profileUsername) profileUsername.textContent = '@' + S.username;
    
    // Update bio
    var profileBio = document.getElementById('profileBio');
    if (profileBio) profileBio.textContent = S.bio || 'Building my energy. One aura at a time. ⚡';
    
    // Update avatar
    updateProfileAvatar();
    updatePostAvatarInComposer();
    
    // Update stats
    var userPosts = (S.socialPosts || []).filter(function(p) {
        return p.author === S.username;
    });
    
    var profilePosts = document.getElementById('profilePosts');
    if (profilePosts) profilePosts.textContent = userPosts.length;
    
    var profileFriends = document.getElementById('profileFriends');
    if (profileFriends) profileFriends.textContent = (S.friends || []).length;
    
    var profileBookmarks = document.getElementById('profileBookmarks');
    if (profileBookmarks) profileBookmarks.textContent = (S.bookmarks || []).length;
    
    // Render friend requests section
    renderProfileRequests();
    
    // Update notification badge
    if (typeof updateNotifBadge === 'function') {
        updateNotifBadge();
    }
    
    // Render posts grid
    var postsGrid = document.getElementById('profilePostsGrid');
    if (postsGrid) {
        if (userPosts.length === 0) {
            postsGrid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:20px;">No posts yet. Share your first post! 📸</p>';
        } else {
            var gridHTML = '';
            var sortedPosts = userPosts.slice().sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            
            sortedPosts.forEach(function(post) {
                var img = post.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
                gridHTML += '<div style="aspect-ratio:1;background-image:url(' + img + ');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;transition:transform 0.2s;" onclick="viewPostDetail(\'' + post.id + '\')" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'"></div>';
            });
            postsGrid.innerHTML = gridHTML;
        }
    }
}

// ============================================================
// UPDATE PROFILE AVATAR
// ============================================================
function updateProfileAvatar() {
    var avatarContainer = document.getElementById('profileAvatarEmoji');
    if (!avatarContainer) return;
    
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        avatarContainer.innerHTML = '<img src="' + S.avatar + '" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div style=&quot;width:100%;height:100%;border-radius:50%;background:\' + getColor(S.username) + \';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;&quot;>\' + (S.name || S.username).charAt(0).toUpperCase() + \'</div>\';" />';
    } else {
        var color = getColor(S.username);
        var initial = (S.name || S.username).charAt(0).toUpperCase();
        avatarContainer.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">' + initial + '</div>';
    }
}

// ============================================================
// UPDATE POST AVATAR IN COMPOSER
// ============================================================
function updatePostAvatarInComposer() {
    var postAvatar = document.getElementById('postAvatarEmoji');
    if (!postAvatar) return;
    
    if (S.avatar && (S.avatar.startsWith('data:') || S.avatar.includes('http'))) {
        postAvatar.innerHTML = '<img src="' + S.avatar + '" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    } else {
        var color = getColor(S.username);
        var initial = (S.name || S.username).charAt(0).toUpperCase();
        postAvatar.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + initial + '</div>';
    }
}

// ============================================================
// RENDER FRIEND REQUESTS IN PROFILE
// ============================================================
function renderProfileRequests() {
    var section = document.getElementById('profileRequestsSection');
    if (!section) return;
    
    firebase.database().ref('friendRequests/' + S.username).once('value').then(function(snapshot) {
        var requests = snapshot.val() || [];
        
        if (requests.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        var html = '<div style="background:rgba(99,102,241,0.1);border-radius:12px;padding:12px;margin-bottom:8px;">';
        html += '<strong style="font-size:12px;">🔔 Friend Requests (' + requests.length + ')</strong>';
        
        requests.forEach(function(requester) {
            var color = getColor(requester);
            html += '<div class="request-card" style="margin-top:8px;">';
            html += '<div class="req-avatar" style="background:' + color + ';">' + requester.charAt(0).toUpperCase() + '</div>';
            html += '<div class="req-info">';
            html += '<div class="req-name">@' + requester + '</div>';
            html += '</div>';
            html += '<div class="req-actions">';
            html += '<button class="btn-sm btn-success" onclick="acceptFriendRequest(\'' + requester + '\')" style="padding:5px 12px;font-size:11px;">✅ Accept</button>';
            html += '<button class="btn-sm btn-danger" onclick="declineFriendRequest(\'' + requester + '\')" style="padding:5px 12px;font-size:11px;">❌ Decline</button>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        section.innerHTML = html;
    });
}

// ============================================================
// EDIT NAME
// ============================================================
function editName() {
    showDialog({
        emoji: '✏️',
        title: 'Edit Display Name',
        subtitle: 'Change how others see your name',
        placeholder: 'Your display name...',
        defaultValue: S.name || '',
        confirmText: 'Save Name'
    }).then(function(result) {
        if (result !== null) {
            var newName = result.trim();
            if (!newName) { toast('Name cannot be empty'); return; }
            
            S.name = newName;
            
            if (S.username) {
                firebase.database().ref('users/' + S.username + '/name').set(newName);
                updateAllPostsAuthorName(newName);
            }
            
            saveState();
            renderProfile();
            updateProfileAvatar();
            updatePostAvatarInComposer();
            toast('Display name updated! ✏️');
        }
    });
}

// ============================================================
// EDIT BIO
// ============================================================
function editProfile() {
    showDialog({
        emoji: '📝',
        title: 'Edit Bio',
        subtitle: 'Tell the world about yourself',
        placeholder: 'Write a short bio...',
        defaultValue: S.bio || '',
        confirmText: 'Save Bio'
    }).then(function(result) {
        if (result !== null) {
            S.bio = result.trim() || 'Building my energy. One aura at a time. ⚡';
            
            if (S.username) {
                firebase.database().ref('users/' + S.username + '/bio').set(S.bio);
            }
            
            saveState();
            renderProfile();
            toast('Bio updated! 📝');
        }
    });
}

// ============================================================
// HANDLE AVATAR SELECTION
// ============================================================
function handleAvatarSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        toast('Please select an image file (JPEG, PNG, GIF, WebP)');
        event.target.value = '';
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        toast('Image is too large. Maximum size is 10MB.');
        event.target.value = '';
        return;
    }
    
    toast('Uploading avatar...');
    
    var reader = new FileReader();
    
    reader.onload = function(e) {
        var imageData = e.target.result;
        
        if (imageData.length > 500000) {
            compressImage(imageData, function(compressedData) {
                saveAvatar(compressedData);
            });
        } else {
            saveAvatar(imageData);
        }
    };
    
    reader.onerror = function() {
        toast('Error reading file. Please try again.');
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

// ============================================================
// COMPRESS IMAGE
// ============================================================
function compressImage(dataUrl, callback) {
    var img = new Image();
    img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxSize = 400;
        var width = img.width;
        var height = img.height;
        
        if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        var compressedData = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedData);
    };
    img.src = dataUrl;
}

// ============================================================
// SAVE AVATAR
// ============================================================
function saveAvatar(imageData) {
    S.avatar = imageData;
    
    if (S.username) {
        firebase.database().ref('users/' + S.username + '/avatar').set(imageData).then(function() {
            console.log('Avatar saved to Firebase');
        });
    }
    
    updateAllPostsAvatar(imageData);
    updateProfileAvatar();
    updatePostAvatarInComposer();
    saveState();
    toast('✅ Avatar updated!');
}

// ============================================================
// UPDATE ALL POSTS AVATAR
// ============================================================
function updateAllPostsAvatar(avatarUrl) {
    (S.socialPosts || []).forEach(function(post) {
        if (post.author === S.username) post.avatar = avatarUrl;
    });
    
    firebase.database().ref('posts').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                if (data[key].author === S.username) {
                    firebase.database().ref('posts/' + key + '/avatar').set(avatarUrl);
                }
            });
        }
    });
    
    firebase.database().ref('videos').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                if (data[key].author === S.username) {
                    firebase.database().ref('videos/' + key + '/avatar').set(avatarUrl);
                }
            });
        }
    });
}

// ============================================================
// UPDATE ALL POSTS AUTHOR NAME
// ============================================================
function updateAllPostsAuthorName(newName) {
    (S.socialPosts || []).forEach(function(post) {
        if (post.author === S.username) post.author = newName;
    });
    
    firebase.database().ref('posts').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                if (data[key].author === S.username) {
                    firebase.database().ref('posts/' + key + '/author').set(newName);
                }
            });
        }
    });
    
    firebase.database().ref('videos').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                if (data[key].author === S.username) {
                    firebase.database().ref('videos/' + key + '/author').set(newName);
                }
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
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to find friends.</p>';
        return;
    }
    
    firebase.database().ref('friendRequests/' + S.username).once('value').then(function(reqSnapshot) {
        var pendingRequests = reqSnapshot.val() || [];
        
        firebase.database().ref('users').once('value').then(function(snapshot) {
            var users = snapshot.val() || {};
            var usernames = Object.keys(users);
            
            if (usernames.length === 0) {
                container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No users found.</p>';
                return;
            }
            
            var html = '';
            
            if (pendingRequests.length > 0) {
                html += '<div style="margin-bottom:16px;padding:12px;background:rgba(99,102,241,0.1);border-radius:14px;">';
                html += '<strong style="font-size:13px;">🔔 Pending Friend Requests (' + pendingRequests.length + ')</strong>';
                
                pendingRequests.forEach(function(requester) {
                    var color = getColor(requester);
                    html += '<div class="request-card" style="margin-top:8px;">';
                    html += '<div class="req-avatar" style="background:' + color + ';">' + requester.charAt(0).toUpperCase() + '</div>';
                    html += '<div class="req-info"><div class="req-name">@' + requester + '</div></div>';
                    html += '<div class="req-actions">';
                    html += '<button class="btn-sm btn-success" onclick="acceptFriendRequest(\'' + requester + '\')">✅</button>';
                    html += '<button class="btn-sm btn-danger" onclick="declineFriendRequest(\'' + requester + '\')">❌</button>';
                    html += '</div>';
                    html += '</div>';
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
                
                var avatarHTML = '';
                if (userData.avatar && (userData.avatar.startsWith('data:') || userData.avatar.includes('http'))) {
                    avatarHTML = '<img src="' + userData.avatar + '" alt="' + username + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />';
                } else {
                    avatarHTML = '<div style="width:40px;height:40px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">' + username.charAt(0).toUpperCase() + '</div>';
                }
                
                html += '<div class="user-card">';
                html += '<div class="user-avatar" onclick="viewUserProfile(\'' + username + '\')">' + avatarHTML + '</div>';
                html += '<div class="user-info">';
                html += '<div class="name" onclick="viewUserProfile(\'' + username + '\')">';
                if (isMe) html += '⭐ ';
                html += escapeHtml(userData.name || username);
                html += ' <span class="status-dot ' + (isOnline ? 'online' : 'offline') + '"></span>';
                html += '</div>';
                html += '<div class="bio">' + escapeHtml(userData.bio || 'No bio yet') + '</div>';
                html += '</div>';
                html += '<div class="actions">';
                
                if (!isMe) {
                    if (isFriend) {
                        html += '<button class="btn-sm btn-success" onclick="viewUserProfile(\'' + username + '\')">✓ Friends</button>';
                    } else {
                        html += '<button class="btn-sm" onclick="sendFriendRequest(\'' + username + '\')">➕ Add Friend</button>';
                    }
                }
                
                html += '</div>';
                html += '</div>';
            });
            
            container.innerHTML = html;
        });
    });
}

// ============================================================
// SEND FRIEND REQUEST
// ============================================================
function sendFriendRequest(username) {
    if (!S.username) { toast('Please log in'); return; }
    if (username === S.username) { toast('You cannot add yourself'); return; }
    if ((S.friends || []).indexOf(username) > -1) { toast('Already friends'); return; }
    
    firebase.database().ref('friendRequests/' + username).once('value').then(function(snapshot) {
        var requests = snapshot.val() || [];
        
        if (requests.indexOf(S.username) > -1) {
            toast('Friend request already sent');
            return;
        }
        
        requests.push(S.username);
        return firebase.database().ref('friendRequests/' + username).set(requests);
    }).then(function() {
        toast('Friend request sent to @' + username + '! 📨');
        
        // Send notification
        firebase.database().ref('notifications/' + username).push({
            from: S.username,
            message: 'sent you a friend request',
            type: 'friend_request',
            time: new Date().toISOString(),
            read: false
        });
    }).catch(function(error) {
        console.error('Error sending request:', error);
    });
}

// ============================================================
// ACCEPT FRIEND REQUEST - FIXED
// ============================================================
function acceptFriendRequest(username) {
    if (!S.username) return;
    
    console.log('Accepting friend request from:', username);
    
    // Step 1: Add to current user's friends
    if (S.friends.indexOf(username) === -1) {
        S.friends.push(username);
    }
    
    // Step 2: Save current user's friends FIRST
    firebase.database().ref('users/' + S.username + '/friends').set(S.friends).then(function() {
        console.log('Step 2: Current user friends saved');
        
        // Step 3: Get other user's friends and add current user
        return firebase.database().ref('users/' + username + '/friends').once('value');
    }).then(function(snapshot) {
        var theirFriends = snapshot.val() || [];
        if (theirFriends.indexOf(S.username) === -1) {
            theirFriends.push(S.username);
            return firebase.database().ref('users/' + username + '/friends').set(theirFriends);
        }
    }).then(function() {
        console.log('Step 3: Other user friends updated');
        
        // Step 4: Remove the friend request
        return firebase.database().ref('friendRequests/' + S.username).once('value');
    }).then(function(snapshot) {
        var requests = snapshot.val() || [];
        requests = requests.filter(function(r) { return r !== username; });
        return firebase.database().ref('friendRequests/' + S.username).set(requests);
    }).then(function() {
        console.log('Step 4: Friend request removed');
        
        // Step 5: Send notification to sender
        firebase.database().ref('notifications/' + username).push({
            from: S.username,
            message: 'accepted your friend request',
            type: 'friend_accept',
            time: new Date().toISOString(),
            read: false
        });
        
        console.log('Step 5: Notification sent to sender');
        
        // Step 6: Update UI
        saveState();
        renderChatList();
        renderProfile();
        renderUsers();
        
        toast('✅ You and @' + username + ' are now friends!');
    }).catch(function(error) {
        console.error('Error accepting request:', error);
        toast('Error accepting request');
    });
}

// ============================================================
// DECLINE FRIEND REQUEST
// ============================================================
function declineFriendRequest(username) {
    if (!S.username) return;
    
    firebase.database().ref('friendRequests/' + S.username).once('value').then(function(snapshot) {
        var requests = snapshot.val() || [];
        requests = requests.filter(function(r) { return r !== username; });
        return firebase.database().ref('friendRequests/' + S.username).set(requests);
    }).then(function() {
        toast('Friend request declined');
        renderProfile();
        renderUsers();
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

// ============================================================
// RENDER USER PROFILE
// ============================================================
function renderUserProfile(username) {
    if (!username) return;
    
    firebase.database().ref('users/' + username).once('value').then(function(snapshot) {
        if (!snapshot.exists()) { toast('User not found'); return; }
        
        var data = snapshot.val();
        var color = getColor(username);
        
        // Avatar
        var avatarEl = document.getElementById('viewProfileAvatar');
        if (avatarEl) {
            if (data.avatar && (data.avatar.startsWith('data:') || data.avatar.includes('http'))) {
                avatarEl.innerHTML = '<img src="' + data.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
            } else {
                avatarEl.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px;">' + (data.name || username).charAt(0).toUpperCase() + '</div>';
            }
        }
        
        // Name
        var nameEl = document.getElementById('viewProfileName');
        if (nameEl) nameEl.textContent = data.name || username;
        
        // Username
        var usernameEl = document.getElementById('viewProfileUsername');
        if (usernameEl) usernameEl.textContent = '@' + username;
        
        // Bio
        var bioEl = document.getElementById('viewProfileBio');
        if (bioEl) bioEl.textContent = data.bio || 'No bio yet';
        
        // Stats
        var userPosts = (S.socialPosts || []).filter(function(p) { return p.author === username; });
        
        var postsEl = document.getElementById('viewProfilePosts');
        if (postsEl) postsEl.textContent = userPosts.length;
        
        var friendsEl = document.getElementById('viewProfileFriends');
        if (friendsEl) friendsEl.textContent = (data.friends || []).length;
        
        // Actions
        var actionsEl = document.getElementById('viewProfileActions');
        if (actionsEl) {
            if ((S.friends || []).indexOf(username) > -1) {
                var dmId = [S.username, username].sort().join('_dm_');
                actionsEl.innerHTML = '<button class="btn-sm btn-success">✓ Friends</button> ' +
                    '<button class="btn-sm" onclick="openChat(\'' + dmId + '\', \'dm\')">💬 Message</button>';
            } else {
                actionsEl.innerHTML = '<button class="btn-sm btn-primary" onclick="sendFriendRequest(\'' + username + '\')">➕ Add Friend</button>';
            }
        }
        
        // Posts grid
        var gridEl = document.getElementById('viewProfilePostsGrid');
        if (gridEl) {
            if (userPosts.length === 0) {
                gridEl.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:20px;">No posts yet.</p>';
            } else {
                var sortedPosts = userPosts.slice().sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
                gridEl.innerHTML = sortedPosts.map(function(post) {
                    var img = post.image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80';
                    return '<div style="aspect-ratio:1;background-image:url(' + img + ');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;" onclick="viewPostDetail(\'' + post.id + '\')"></div>';
                }).join('');
            }
        }
    }).catch(function(error) {
        console.error('Error loading user profile:', error);
    });
}

// ============================================================
// LOAD USER DATA FROM FIREBASE
// ============================================================
function loadUserDataFromFirebase() {
    if (!S.username) return;
    
    firebase.database().ref('users/' + S.username).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            var data = snapshot.val();
            S.name = data.name || '';
            S.bio = data.bio || 'Building my energy. One aura at a time. ⚡';
            S.avatar = data.avatar || null;
            S.wallpaper = data.wallpaper || null;
            S.friends = data.friends || [];
            S.bookmarks = data.bookmarks || [];
            S.selectedAuras = data.selected_auras || [];
            saveState();
            renderProfile();
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
window.loadUserDataFromFirebase = loadUserDataFromFirebase;

console.log('👤 Profile module loaded - Friend requests fixed');