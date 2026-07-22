// Groups Module - Complete with WhatsApp-style group management

function renderGroups() {
    var container = document.getElementById('groupsList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to see your groups.</p>';
        return;
    }
    
    S.groups = S.groups || [];
    
    // Remove duplicates
    var seen = {};
    S.groups = S.groups.filter(function(g) {
        if (seen[g.id]) return false;
        seen[g.id] = true;
        return true;
    });
    
    if (S.groups.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">👥</div>' +
            '<p>No groups yet.</p>' +
            '<p style="font-size:12px;">Create a group to chat with multiple friends at once!</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    
    S.groups.forEach(function(group) {
        var memberCount = (group.members || []).length;
        var isAdmin = (group.admins || []).indexOf(S.username) > -1;
        var isCreator = group.admin === S.username;
        
        var roleBadge = '';
        var roleColor = '#94a3b8';
        if (isCreator) {
            roleBadge = 'Creator';
            roleColor = '#6366f1';
        } else if (isAdmin) {
            roleBadge = 'Admin';
            roleColor = '#8b5cf6';
        } else {
            roleBadge = 'Member';
        }
        
        html += '<div class="group-card">';
        
        // Clickable area to open group chat
        html += '<div onclick="openGroupChat(\'' + group.id + '\')" style="cursor:pointer;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<strong>👥 ' + escapeHtml(group.name || 'Group') + '</strong>';
        html += '<span style="font-size:10px;background:' + roleColor + ';color:#fff;padding:3px 8px;border-radius:8px;">' + roleBadge + '</span>';
        html += '</div>';
        html += '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">';
        html += memberCount + ' member' + (memberCount > 1 ? 's' : '') + ' · Created ' + timeSince(new Date(group.created));
        html += '</div>';
        if (group.description) {
            html += '<div style="font-size:11px;color:#64748b;margin-top:2px;">' + escapeHtml(group.description) + '</div>';
        }
        html += '</div>';
        
        // Action buttons
        html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;">';
        html += '<button class="btn-sm" onclick="event.stopPropagation();viewGroupMembers(\'' + group.id + '\')" style="font-size:10px;">👥 Members</button>';
        
        if (isAdmin) {
            html += '<button class="btn-sm" onclick="event.stopPropagation();showAddMembersDialog(\'' + group.id + '\')" style="font-size:10px;">➕ Add</button>';
        }
        
        if (isCreator) {
            html += '<button class="btn-sm" onclick="event.stopPropagation();showGroupSettings(\'' + group.id + '\')" style="font-size:10px;">⚙️ Settings</button>';
        }
        
        if (!isCreator) {
            html += '<button class="btn-sm btn-danger" onclick="event.stopPropagation();leaveGroup(\'' + group.id + '\')" style="font-size:10px;">🚪 Leave</button>';
        }
        
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Create a new group
function createGroup() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    var friends = S.friends || [];
    
    if (friends.length < 1) {
        toast('You need at least 1 friend to create a group. Add friends first!');
        return;
    }
    
    // Get group name
    showDialog({
        emoji: '👥',
        title: 'Create Group',
        subtitle: 'Enter a name for your group',
        placeholder: 'Group name...',
        confirmText: 'Next →'
    }).then(function(groupName) {
        if (!groupName || !groupName.trim()) return;
        
        var name = groupName.trim();
        
        // Get optional description
        showDialog({
            emoji: '📝',
            title: 'Group Description',
            subtitle: 'Add a short description (optional)',
            placeholder: 'What is this group about?',
            confirmText: 'Next →'
        }).then(function(description) {
            showFriendSelectionDialog(name, description ? description.trim() : '', friends);
        });
    });
}

// Show friend selection dialog
function showFriendSelectionDialog(groupName, description, friends) {
    closeDialog();
    
    setTimeout(function() {
        var overlay = document.getElementById('dialogOverlay');
        var emoji = document.getElementById('dialogEmoji');
        var title = document.getElementById('dialogTitle');
        var subtitle = document.getElementById('dialogSubtitle');
        var input = document.getElementById('dialogInput');
        var cancelBtn = document.getElementById('dialogCancel');
        var confirmBtn = document.getElementById('dialogConfirm');
        var backBtn = document.getElementById('dialogBack');
        
        var selectedFriends = [];
        
        var friendsListHTML = '<div style="max-height:220px;overflow-y:auto;margin-bottom:8px;">';
        
        if (friends.length === 0) {
            friendsListHTML += '<p style="color:#94a3b8;text-align:center;padding:10px;">No friends to add</p>';
        } else {
            friends.forEach(function(friend) {
                var color = getColor(friend);
                friendsListHTML += '<div class="group-member-select" data-friend="' + friend + '" data-selected="false" style="display:flex;align-items:center;padding:8px 10px;background:rgba(255,255,255,0.4);border-radius:10px;margin-bottom:4px;cursor:pointer;border:1.5px solid transparent;gap:8px;">';
                friendsListHTML += '<div class="check-circle" style="width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">✓</div>';
                friendsListHTML += '<div style="width:30px;height:30px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0;">' + friend.charAt(0).toUpperCase() + '</div>';
                friendsListHTML += '<span style="font-size:12px;">@' + friend + '</span>';
                friendsListHTML += '</div>';
            });
        }
        
        friendsListHTML += '</div>';
        friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span> friend(s)</p>';
        
        backBtn.style.display = 'flex';
        input.style.display = 'none';
        emoji.textContent = '👥';
        title.textContent = 'Add Members';
        subtitle.innerHTML = 'Select friends for <strong>' + escapeHtml(groupName) + '</strong><br>' + friendsListHTML;
        cancelBtn.textContent = 'Cancel';
        confirmBtn.textContent = 'Create Group';
        confirmBtn.className = 'dialog-confirm';
        
        overlay.classList.add('active');
        
        // Add click handlers after DOM update
        setTimeout(function() {
            var items = overlay.querySelectorAll('.group-member-select');
            items.forEach(function(item) {
                item.addEventListener('click', function() {
                    var friend = this.dataset.friend;
                    var isSelected = this.dataset.selected === 'true';
                    
                    if (isSelected) {
                        this.dataset.selected = 'false';
                        this.style.borderColor = 'transparent';
                        this.style.background = 'rgba(255,255,255,0.4)';
                        var circle = this.querySelector('.check-circle');
                        circle.style.background = 'transparent';
                        circle.style.borderColor = '#cbd5e1';
                        circle.style.color = 'inherit';
                        selectedFriends = selectedFriends.filter(function(f) { return f !== friend; });
                    } else {
                        this.dataset.selected = 'true';
                        this.style.borderColor = '#6366f1';
                        this.style.background = 'rgba(99,102,241,0.1)';
                        var circle = this.querySelector('.check-circle');
                        circle.style.background = '#6366f1';
                        circle.style.borderColor = '#6366f1';
                        circle.style.color = '#fff';
                        selectedFriends.push(friend);
                    }
                    
                    var countEl = document.getElementById('selectedCount');
                    if (countEl) countEl.textContent = selectedFriends.length;
                });
            });
        }, 100);
        
        var cleanup = function() {
            overlay.classList.remove('active');
        };
        
        backBtn.onclick = function() { cleanup(); };
        cancelBtn.onclick = function() { cleanup(); };
        
        confirmBtn.onclick = function() {
            if (selectedFriends.length < 1) {
                toast('Select at least 1 friend');
                return;
            }
            
            cleanup();
            
            var members = [S.username].concat(selectedFriends);
            var groupId = generateId();
            
            var group = {
                id: groupId,
                name: groupName,
                description: description || '',
                admin: S.username,
                admins: [S.username],
                members: members,
                created: new Date().toISOString()
            };
            
            // Save to Firebase
            db.ref('groups/' + groupId).set(group).then(function() {
                // Add to local state
                if (!S.groups.find(function(g) { return g.id === groupId; })) {
                    S.groups.push(group);
                }
                
                // Notify members
                selectedFriends.forEach(function(friend) {
                    addNotification(friend, 'added you to group "' + groupName + '"', 'group_add', groupId);
                });
                
                saveState();
                renderGroups();
                renderChatList();
                toast('Group "' + groupName + '" created! 🎉');
            }).catch(function(error) {
                console.error('Group creation error:', error);
                toast('Failed to create group');
            });
        };
        
        overlay.onclick = function(e) {
            if (e.target === overlay) cleanup();
        };
    }, 200);
}

// View group members
function viewGroupMembers(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) {
        toast('Group not found');
        return;
    }
    
    closeDialog();
    
    setTimeout(function() {
        var isAdmin = (group.admins || []).indexOf(S.username) > -1;
        var isCreator = group.admin === S.username;
        
        var membersHTML = '<div style="margin-bottom:8px;"><strong>' + escapeHtml(group.name) + '</strong> · ' + (group.members || []).length + ' members</div>';
        membersHTML += '<div style="max-height:280px;overflow-y:auto;">';
        
        (group.members || []).forEach(function(member) {
            var memberIsAdmin = (group.admins || []).indexOf(member) > -1;
            var memberIsCreator = group.admin === member;
            var color = getColor(member);
            var badge = memberIsCreator ? '👑 Creator' : (memberIsAdmin ? '⭐ Admin' : '');
            
            membersHTML += '<div style="display:flex;align-items:center;padding:8px;border-bottom:1px solid rgba(0,0,0,0.05);gap:8px;">';
            membersHTML += '<div style="width:34px;height:34px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0;">' + member.charAt(0).toUpperCase() + '</div>';
            membersHTML += '<div style="flex:1;">';
            membersHTML += '<span style="font-weight:600;font-size:13px;">@' + member + '</span>';
            if (badge) membersHTML += '<span style="font-size:10px;color:#6366f1;margin-left:4px;">' + badge + '</span>';
            if (member === S.username) membersHTML += '<span style="font-size:9px;color:#94a3b8;"> (You)</span>';
            membersHTML += '</div>';
            
            if (isCreator && member !== S.username) {
                membersHTML += '<div style="display:flex;gap:3px;">';
                if (!memberIsAdmin) {
                    membersHTML += '<button class="btn-sm btn-success dialog-action-btn" data-action="promote" data-group="' + groupId + '" data-user="' + member + '" style="font-size:9px;padding:3px 7px;">⭐ Admin</button>';
                } else {
                    membersHTML += '<button class="btn-sm dialog-action-btn" data-action="demote" data-group="' + groupId + '" data-user="' + member + '" style="font-size:9px;padding:3px 7px;">⬇ Demote</button>';
                }
                membersHTML += '<button class="btn-sm btn-danger dialog-action-btn" data-action="remove" data-group="' + groupId + '" data-user="' + member + '" style="font-size:9px;padding:3px 7px;">🗑️</button>';
                membersHTML += '</div>';
            } else if (isAdmin && !memberIsCreator && !memberIsAdmin && member !== S.username) {
                membersHTML += '<button class="btn-sm btn-danger dialog-action-btn" data-action="remove" data-group="' + groupId + '" data-user="' + member + '" style="font-size:9px;padding:3px 7px;">🗑️</button>';
            }
            
            membersHTML += '</div>';
        });
        
        membersHTML += '</div>';
        
        if (isAdmin) {
            membersHTML += '<div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">';
            membersHTML += '<button class="btn-sm btn-primary dialog-action-btn" data-action="addMembers" data-group="' + groupId + '" style="flex:1;">➕ Add Members</button>';
            if (isCreator) {
                membersHTML += '<button class="btn-sm dialog-action-btn" data-action="settings" data-group="' + groupId + '" style="flex:1;">⚙️ Settings</button>';
            }
            membersHTML += '</div>';
        }
        
        showDialog({
            emoji: '👥',
            title: 'Group Members',
            htmlSubtitle: membersHTML,
            showBack: true,
            noCancel: true,
            confirmText: 'Close'
        });
        
        // Attach action listeners
        setTimeout(function() {
            var actionBtns = document.querySelectorAll('.dialog-action-btn');
            actionBtns.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var action = this.dataset.action;
                    var gId = this.dataset.group;
                    var user = this.dataset.user;
                    
                    closeDialog();
                    
                    setTimeout(function() {
                        switch(action) {
                            case 'promote': promoteToAdmin(gId, user); break;
                            case 'demote': demoteAdmin(gId, user); break;
                            case 'remove': removeMember(gId, user); break;
                            case 'addMembers': showAddMembersDialog(gId); break;
                            case 'settings': showGroupSettings(gId); break;
                        }
                    }, 300);
                });
            });
        }, 200);
    }, 200);
}

// Show add members dialog
function showAddMembersDialog(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    closeDialog();
    
    setTimeout(function() {
        var friends = (S.friends || []).filter(function(f) {
            return (group.members || []).indexOf(f) === -1;
        });
        
        if (friends.length === 0) {
            toast('No friends available to add.');
            return;
        }
        
        var overlay = document.getElementById('dialogOverlay');
        var emoji = document.getElementById('dialogEmoji');
        var title = document.getElementById('dialogTitle');
        var subtitle = document.getElementById('dialogSubtitle');
        var input = document.getElementById('dialogInput');
        var cancelBtn = document.getElementById('dialogCancel');
        var confirmBtn = document.getElementById('dialogConfirm');
        var backBtn = document.getElementById('dialogBack');
        
        var selectedFriends = [];
        
        var listHTML = '<div style="max-height:220px;overflow-y:auto;margin-bottom:8px;">';
        friends.forEach(function(friend) {
            var color = getColor(friend);
            listHTML += '<div class="group-member-select" data-friend="' + friend + '" data-selected="false" style="display:flex;align-items:center;padding:8px 10px;background:rgba(255,255,255,0.4);border-radius:10px;margin-bottom:4px;cursor:pointer;border:1.5px solid transparent;gap:8px;">';
            listHTML += '<div class="check-circle" style="width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:11px;">✓</div>';
            listHTML += '<div style="width:30px;height:30px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;">' + friend.charAt(0).toUpperCase() + '</div>';
            listHTML += '<span style="font-size:12px;">@' + friend + '</span>';
            listHTML += '</div>';
        });
        listHTML += '</div>';
        listHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span></p>';
        
        backBtn.style.display = 'flex';
        input.style.display = 'none';
        emoji.textContent = '➕';
        title.textContent = 'Add Members';
        subtitle.innerHTML = 'Add to <strong>' + escapeHtml(group.name) + '</strong><br>' + listHTML;
        cancelBtn.textContent = 'Cancel';
        confirmBtn.textContent = 'Add';
        confirmBtn.className = 'dialog-confirm';
        
        overlay.classList.add('active');
        
        setTimeout(function() {
            overlay.querySelectorAll('.group-member-select').forEach(function(item) {
                item.addEventListener('click', function() {
                    var friend = this.dataset.friend;
                    var isSelected = this.dataset.selected === 'true';
                    
                    if (isSelected) {
                        this.dataset.selected = 'false';
                        this.style.borderColor = 'transparent';
                        this.style.background = 'rgba(255,255,255,0.4)';
                        var c = this.querySelector('.check-circle');
                        c.style.background = 'transparent';
                        c.style.borderColor = '#cbd5e1';
                        c.style.color = 'inherit';
                        selectedFriends = selectedFriends.filter(function(f) { return f !== friend; });
                    } else {
                        this.dataset.selected = 'true';
                        this.style.borderColor = '#6366f1';
                        this.style.background = 'rgba(99,102,241,0.1)';
                        var c = this.querySelector('.check-circle');
                        c.style.background = '#6366f1';
                        c.style.borderColor = '#6366f1';
                        c.style.color = '#fff';
                        selectedFriends.push(friend);
                    }
                    
                    var countEl = document.getElementById('selectedCount');
                    if (countEl) countEl.textContent = selectedFriends.length;
                });
            });
        }, 100);
        
        var cleanup = function() { overlay.classList.remove('active'); };
        backBtn.onclick = cleanup;
        cancelBtn.onclick = cleanup;
        
        confirmBtn.onclick = function() {
            if (selectedFriends.length === 0) { toast('Select at least 1'); return; }
            cleanup();
            
            group.members = Array.from(new Set((group.members || []).concat(selectedFriends)));
            
            db.ref('groups/' + groupId + '/members').set(group.members).then(function() {
                selectedFriends.forEach(function(friend) {
                    addNotification(friend, 'added you to "' + group.name + '"', 'group_add', groupId);
                });
                saveState();
                renderGroups();
                renderChatList();
                toast('Added ' + selectedFriends.length + ' member(s)!');
            });
        };
        
        overlay.onclick = function(e) { if (e.target === overlay) cleanup(); };
    }, 200);
}

// Show group settings
function showGroupSettings(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group || group.admin !== S.username) {
        toast('Only the creator can change settings');
        return;
    }
    
    closeDialog();
    
    setTimeout(function() {
        var html = '<div style="margin-bottom:10px;"><strong>' + escapeHtml(group.name) + '</strong></div>';
        html += '<div style="margin-bottom:8px;"><span style="font-size:11px;color:#94a3b8;">' + (group.members || []).length + ' members · Created ' + new Date(group.created).toLocaleDateString() + '</span></div>';
        html += '<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;">';
        html += '<button class="btn-sm dialog-settings-btn" data-action="rename" data-group="' + groupId + '" style="width:100%;">✏️ Rename</button>';
        html += '<button class="btn-sm dialog-settings-btn" data-action="editDesc" data-group="' + groupId + '" style="width:100%;">📝 Edit Description</button>';
        html += '<button class="btn-sm btn-danger dialog-settings-btn" data-action="delete" data-group="' + groupId + '" style="width:100%;">🗑️ Delete Group</button>';
        html += '</div>';
        
        showDialog({
            emoji: '⚙️',
            title: 'Group Settings',
            htmlSubtitle: html,
            showBack: true,
            noCancel: true,
            confirmText: 'Close'
        });
        
        setTimeout(function() {
            document.querySelectorAll('.dialog-settings-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var action = this.dataset.action;
                    var gId = this.dataset.group;
                    closeDialog();
                    setTimeout(function() {
                        if (action === 'rename') renameGroup(gId);
                        else if (action === 'editDesc') editGroupDesc(gId);
                        else if (action === 'delete') deleteGroup(gId);
                    }, 300);
                });
            });
        }, 200);
    }, 200);
}

// Promote member to admin
function promoteToAdmin(groupId, username) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group || group.admin !== S.username) return;
    
    showDialog({
        emoji: '⭐',
        title: 'Promote to Admin',
        subtitle: 'Make @' + username + ' an admin?',
        confirmText: 'Promote'
    }).then(function(result) {
        if (result !== null) {
            group.admins = group.admins || [];
            if (group.admins.indexOf(username) === -1) {
                group.admins.push(username);
                db.ref('groups/' + groupId + '/admins').set(group.admins);
                addNotification(username, 'promoted you to admin in "' + group.name + '"', 'group_promote', groupId);
                saveState();
                renderGroups();
                toast('@' + username + ' is now admin! ⭐');
            }
        }
    });
}

// Demote admin
function demoteAdmin(groupId, username) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group || group.admin !== S.username) return;
    
    group.admins = (group.admins || []).filter(function(a) { return a !== username; });
    db.ref('groups/' + groupId + '/admins').set(group.admins);
    saveState();
    renderGroups();
    toast('@' + username + ' demoted from admin');
}

// Remove member from group
function removeMember(groupId, username) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Remove Member',
        subtitle: 'Remove @' + username + ' from the group?',
        confirmText: 'Remove',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            group.members = (group.members || []).filter(function(m) { return m !== username; });
            group.admins = (group.admins || []).filter(function(a) { return a !== username; });
            
            db.ref('groups/' + groupId + '/members').set(group.members);
            db.ref('groups/' + groupId + '/admins').set(group.admins);
            
            addNotification(username, 'removed you from "' + group.name + '"', 'group_remove', groupId);
            saveState();
            renderGroups();
            toast('Member removed');
        }
    });
}

// Rename group
function renameGroup(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    showDialog({
        emoji: '✏️',
        title: 'Rename Group',
        placeholder: 'New name...',
        defaultValue: group.name,
        confirmText: 'Save'
    }).then(function(result) {
        if (result && result.trim()) {
            group.name = result.trim();
            db.ref('groups/' + groupId + '/name').set(group.name);
            saveState();
            renderGroups();
            renderChatList();
            toast('Group renamed!');
        }
    });
}

// Edit group description
function editGroupDesc(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    showDialog({
        emoji: '📝',
        title: 'Edit Description',
        placeholder: 'Group description...',
        defaultValue: group.description || '',
        confirmText: 'Save'
    }).then(function(result) {
        if (result !== null) {
            group.description = result.trim();
            db.ref('groups/' + groupId + '/description').set(group.description);
            saveState();
            renderGroups();
            toast('Description updated!');
        }
    });
}

// Delete group
function deleteGroup(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Group',
        subtitle: 'Permanently delete "' + escapeHtml(group.name) + '"? This cannot be undone.',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            (group.members || []).forEach(function(member) {
                if (member !== S.username) {
                    addNotification(member, '"' + group.name + '" was deleted', 'group_delete', '');
                }
            });
            
            db.ref('groups/' + groupId).remove();
            S.groups = S.groups.filter(function(g) { return g.id !== groupId; });
            saveState();
            renderGroups();
            renderChatList();
            toast('Group deleted');
        }
    });
}

// Leave group
function leaveGroup(groupId) {
    var group = S.groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    
    if (group.admin === S.username) {
        toast('As creator, you cannot leave. Delete the group instead.');
        return;
    }
    
    showDialog({
        emoji: '🚪',
        title: 'Leave Group',
        subtitle: 'Leave "' + escapeHtml(group.name) + '"?',
        confirmText: 'Leave',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            group.members = (group.members || []).filter(function(m) { return m !== S.username; });
            group.admins = (group.admins || []).filter(function(a) { return a !== S.username; });
            
            db.ref('groups/' + groupId + '/members').set(group.members);
            db.ref('groups/' + groupId + '/admins').set(group.admins);
            
            S.groups = S.groups.filter(function(g) { return g.id !== groupId; });
            saveState();
            renderGroups();
            renderChatList();
            toast('Left group');
        }
    });
}

// Open group chat
function openGroupChat(groupId) {
    currentChat = groupId;
    currentChatType = 'group';
    var group = S.groups.find(function(g) { return g.id === groupId; });
    currentChatParticipants = group ? group.members : [];
    navigate('chat');
    setTimeout(function() {
        openChat(groupId, 'group');
    }, 300);
}

// Load groups from Firebase
function loadGroups() {
    db.ref('groups').once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.groups = [];
        if (data) {
            Object.keys(data).forEach(function(key) {
                var group = data[key];
                group.id = key;
                if (group.members && group.members.indexOf(S.username) > -1) {
                    S.groups.push(group);
                }
            });
        }
        renderGroups();
        renderChatList();
    }).catch(function(error) {
        console.error('Error loading groups:', error);
    });
}

// Expose functions globally
window.renderGroups = renderGroups;
window.createGroup = createGroup;
window.viewGroupMembers = viewGroupMembers;
window.showAddMembersDialog = showAddMembersDialog;
window.showGroupSettings = showGroupSettings;
window.promoteToAdmin = promoteToAdmin;
window.demoteAdmin = demoteAdmin;
window.removeMember = removeMember;
window.renameGroup = renameGroup;
window.editGroupDesc = editGroupDesc;
window.deleteGroup = deleteGroup;
window.leaveGroup = leaveGroup;
window.openGroupChat = openGroupChat;
window.loadGroups = loadGroups;

console.log('👥 Groups module loaded');