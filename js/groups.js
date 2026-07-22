// Groups Module - Complete with member management, add members, and admin promotion

function renderGroups() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Please log in</p>';
        return;
    }
    
    S.groups = S.groups || [];
    
    if (S.groups.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No groups yet. Create one! 👥</p>';
        return;
    }
    
    let html = '';
    S.groups.forEach(g => {
        const memberCount = (g.members || []).length;
        const isAdmin = (g.admins || []).includes(S.username);
        const isCreator = g.admin === S.username;
        
        html += `<div class="group-card">
            <div onclick="openGroupChat('${g.id}')">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>👥 ${g.name}</strong>
                    <span style="font-size:10px;background:${isCreator ? '#6366f1' : isAdmin ? '#8b5cf6' : '#94a3b8'};color:#fff;padding:2px 8px;border-radius:8px;">${isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Member'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                    ${memberCount} member${memberCount > 1 ? 's' : ''} · Created ${timeSince(new Date(g.created))}
                </div>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                <button class="btn-sm" onclick="event.stopPropagation();viewGroupMembers('${g.id}')" style="font-size:10px;">👥 View Members</button>
                ${isAdmin ? `<button class="btn-sm" onclick="event.stopPropagation();showAddMembersDialog('${g.id}')" style="font-size:10px;">➕ Add Members</button>` : ''}
                ${isCreator ? `<button class="btn-sm" onclick="event.stopPropagation();showGroupSettings('${g.id}')" style="font-size:10px;">⚙️ Settings</button>` : ''}
                ${!isAdmin ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();leaveGroup('${g.id}')" style="font-size:10px;">🚪 Leave</button>` : ''}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function createGroup() {
    if (!S.username) { toast('Please log in'); return; }
    
    const friends = S.friends || [];
    
    if (friends.length < 2) {
        toast('You need at least 2 friends to create a group. Add friends first!');
        return;
    }
    
    // First, get the group name
    showDialog({
        emoji: '👥',
        title: 'Create Group',
        subtitle: 'Enter a name for your group',
        placeholder: 'Group name...',
        confirmText: 'Next →'
    }).then(groupName => {
        if (!groupName || !groupName.trim()) return;
        
        const name = groupName.trim();
        
        // Show friend selection dialog
        showFriendSelectionDialog(name, friends);
    });
}

function showFriendSelectionDialog(groupName, friends) {
    const overlay = document.getElementById('dialogOverlay');
    const dialog = document.getElementById('dialog');
    const emoji = document.getElementById('dialogEmoji');
    const title = document.getElementById('dialogTitle');
    const subtitle = document.getElementById('dialogSubtitle');
    const input = document.getElementById('dialogInput');
    const cancelBtn = document.getElementById('dialogCancel');
    const confirmBtn = document.getElementById('dialogConfirm');
    const backBtn = document.getElementById('dialogBack');
    
    let selectedFriends = [];
    
    // Build friend list HTML
    let friendsListHTML = '<div style="max-height:250px;overflow-y:auto;margin-bottom:12px;">';
    friends.forEach(friend => {
        const color = getColor(friend);
        friendsListHTML += `
            <div class="group-member-select" data-friend="${friend}" onclick="toggleFriendSelection(this, '${friend}')">
                <div class="check-circle">✓</div>
                <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">${friend.charAt(0).toUpperCase()}</div>
                <span style="font-size:13px;">@${friend}</span>
            </div>`;
    });
    friendsListHTML += '</div>';
    friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span> friends (minimum 2)</p>';
    
    // Update dialog
    backBtn.style.display = 'flex';
    input.style.display = 'none';
    emoji.textContent = '👥';
    title.textContent = 'Select Members';
    subtitle.innerHTML = `Add friends to <strong>${groupName}</strong><br>${friendsListHTML}`;
    cancelBtn.textContent = 'Cancel';
    confirmBtn.textContent = 'Create Group';
    confirmBtn.className = 'dialog-confirm';
    
    overlay.classList.add('active');
    
    // Expose toggle function
    window.toggleFriendSelection = function(element, friend) {
        element.classList.toggle('selected');
        const idx = selectedFriends.indexOf(friend);
        if (idx > -1) {
            selectedFriends.splice(idx, 1);
        } else {
            selectedFriends.push(friend);
        }
        document.getElementById('selectedCount').textContent = selectedFriends.length;
    };
    
    const cleanup = () => {
        overlay.classList.remove('active');
        window.toggleFriendSelection = null;
    };
    
    cancelBtn.onclick = () => { cleanup(); };
    backBtn.onclick = () => { cleanup(); };
    
    confirmBtn.onclick = () => {
        if (selectedFriends.length < 2) {
            toast('Select at least 2 friends');
            return;
        }
        
        cleanup();
        
        // Create the group
        const members = [S.username, ...selectedFriends];
        const group = {
            id: generateId(),
            name: groupName,
            admin: S.username,
            admins: [S.username],
            members: members,
            created: new Date().toISOString()
        };
        
        S.groups = S.groups || [];
        S.groups.push(group);
        
        // Save to Firebase
        pushData('groups', group).then(() => {
            // Notify all members
            selectedFriends.forEach(friend => {
                addNotification(friend, `added you to group "${groupName}"`, 'group_add', group.id);
            });
            
            saveState();
            renderGroups();
            renderChatList();
            toast(`Group "${groupName}" created with ${members.length} members! 🎉`);
        }).catch(() => {
            toast('Failed to create group');
        });
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) { cleanup(); }
    };
}

// View Group Members
function viewGroupMembers(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) { toast('Group not found'); return; }
    
    const isAdmin = (group.admins || []).includes(S.username);
    const isCreator = group.admin === S.username;
    
    let membersHTML = '<div style="max-height:300px;overflow-y:auto;">';
    
    (group.members || []).forEach(member => {
        const memberIsAdmin = (group.admins || []).includes(member);
        const memberIsCreator = group.admin === member;
        const color = getColor(member);
        const badge = memberIsCreator ? '👑 Creator' : memberIsAdmin ? '⭐ Admin' : '';
        
        membersHTML += `<div style="display:flex;align-items:center;padding:8px;border-bottom:1px solid rgba(0,0,0,0.05);gap:8px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0;">${member.charAt(0).toUpperCase()}</div>
            <div style="flex:1;">
                <span style="font-weight:600;font-size:13px;">@${member}</span>
                ${badge ? `<span style="font-size:10px;color:#6366f1;margin-left:4px;">${badge}</span>` : ''}
            </div>
            ${isCreator && member !== S.username ? `
                <div style="display:flex;gap:4px;">
                    ${!memberIsAdmin ? `<button class="btn-sm btn-success" onclick="promoteToAdmin('${groupId}','${member}')" style="font-size:9px;padding:3px 6px;">⭐ Make Admin</button>` : ''}
                    <button class="btn-sm btn-danger" onclick="removeMember('${groupId}','${member}')" style="font-size:9px;padding:3px 6px;">🗑️</button>
                </div>
            ` : (isAdmin && !memberIsCreator && member !== S.username && !memberIsAdmin ? `
                <button class="btn-sm btn-danger" onclick="removeMember('${groupId}','${member}')" style="font-size:9px;padding:3px 6px;">🗑️</button>
            ` : '')}
        </div>`;
    });
    
    membersHTML += '</div>';
    
    // Add action buttons at bottom
    if (isAdmin) {
        membersHTML += `
            <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">
                <button class="btn-sm btn-primary" onclick="closeDialog();showAddMembersDialog('${groupId}')" style="flex:1;">➕ Add Members</button>
                ${isCreator ? `<button class="btn-sm" onclick="closeDialog();showGroupSettings('${groupId}')" style="flex:1;">⚙️ Settings</button>` : ''}
            </div>`;
    }
    
    showDialog({
        emoji: '👥',
        title: group.name + ' - Members',
        htmlSubtitle: membersHTML,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

// Show Add Members Dialog
function showAddMembersDialog(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) { toast('Group not found'); return; }
    
    const friends = (S.friends || []).filter(f => !(group.members || []).includes(f));
    
    if (friends.length === 0) {
        toast('No friends available to add. All your friends are already in this group!');
        return;
    }
    
    const overlay = document.getElementById('dialogOverlay');
    const dialog = document.getElementById('dialog');
    const emoji = document.getElementById('dialogEmoji');
    const title = document.getElementById('dialogTitle');
    const subtitle = document.getElementById('dialogSubtitle');
    const input = document.getElementById('dialogInput');
    const cancelBtn = document.getElementById('dialogCancel');
    const confirmBtn = document.getElementById('dialogConfirm');
    const backBtn = document.getElementById('dialogBack');
    
    let selectedFriends = [];
    
    let friendsListHTML = '<div style="max-height:250px;overflow-y:auto;margin-bottom:12px;">';
    friends.forEach(friend => {
        const color = getColor(friend);
        friendsListHTML += `
            <div class="group-member-select" data-friend="${friend}" onclick="toggleFriendSelection(this, '${friend}')">
                <div class="check-circle">✓</div>
                <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">${friend.charAt(0).toUpperCase()}</div>
                <span style="font-size:13px;">@${friend}</span>
            </div>`;
    });
    friendsListHTML += '</div>';
    friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span> friends</p>';
    
    backBtn.style.display = 'flex';
    input.style.display = 'none';
    emoji.textContent = '➕';
    title.textContent = 'Add Members';
    subtitle.innerHTML = `Add friends to <strong>${group.name}</strong><br>${friendsListHTML}`;
    cancelBtn.textContent = 'Cancel';
    confirmBtn.textContent = 'Add Selected';
    confirmBtn.className = 'dialog-confirm';
    
    overlay.classList.add('active');
    
    window.toggleFriendSelection = function(element, friend) {
        element.classList.toggle('selected');
        const idx = selectedFriends.indexOf(friend);
        if (idx > -1) {
            selectedFriends.splice(idx, 1);
        } else {
            selectedFriends.push(friend);
        }
        document.getElementById('selectedCount').textContent = selectedFriends.length;
    };
    
    const cleanup = () => {
        overlay.classList.remove('active');
        window.toggleFriendSelection = null;
    };
    
    cancelBtn.onclick = () => { cleanup(); };
    backBtn.onclick = () => { cleanup(); };
    
    confirmBtn.onclick = () => {
        if (selectedFriends.length === 0) {
            toast('Select at least one friend');
            return;
        }
        
        cleanup();
        
        // Add members to group
        group.members = [...new Set([...(group.members || []), ...selectedFriends])];
        
        // Update in Firebase
        updateData('groups/' + group.id + '/members', group.members).then(() => {
            // Notify new members
            selectedFriends.forEach(friend => {
                addNotification(friend, `added you to group "${group.name}"`, 'group_add', group.id);
            });
            
            saveState();
            renderGroups();
            renderChatList();
            toast(`Added ${selectedFriends.length} member(s) to "${group.name}"!`);
        }).catch(() => {
            toast('Failed to add members');
        });
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) { cleanup(); }
    };
}

// Show Group Settings
function showGroupSettings(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group || group.admin !== S.username) {
        toast('Only the group creator can access settings');
        return;
    }
    
    let settingsHTML = `
        <div style="margin-bottom:12px;">
            <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Group Name</p>
            <strong>${group.name}</strong>
        </div>
        <div style="margin-bottom:12px;">
            <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Created</p>
            <strong>${new Date(group.created).toLocaleDateString()}</strong>
        </div>
        <div style="margin-bottom:12px;">
            <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Members</p>
            <strong>${(group.members || []).length}</strong>
        </div>
        <div style="margin-bottom:12px;">
            <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Admins</p>
            <strong>${(group.admins || []).join(', ')}</strong>
        </div>
        <div style="display:flex;gap:6px;margin-top:16px;flex-direction:column;">
            <button class="btn-sm" onclick="closeDialog();renameGroup('${groupId}')" style="width:100%;">✏️ Rename Group</button>
            <button class="btn-sm btn-danger" onclick="closeDialog();deleteGroup('${groupId}')" style="width:100%;">🗑️ Delete Group</button>
        </div>
    `;
    
    showDialog({
        emoji: '⚙️',
        title: 'Group Settings',
        htmlSubtitle: settingsHTML,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

// Promote member to admin
function promoteToAdmin(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (group.admin !== S.username) {
        toast('Only the group creator can promote admins');
        return;
    }
    
    showDialog({
        emoji: '⭐',
        title: 'Promote to Admin',
        subtitle: `Make @${username} an admin of "${group.name}"?`,
        confirmText: 'Promote',
        cancelText: 'Cancel'
    }).then(result => {
        if (result !== null) {
            group.admins = group.admins || [];
            if (!group.admins.includes(username)) {
                group.admins.push(username);
                updateData('groups/' + groupId + '/admins', group.admins).then(() => {
                    addNotification(username, `promoted you to admin in "${group.name}"`, 'group_promote', groupId);
                    saveState();
                    renderGroups();
                    toast(`@${username} is now an admin! ⭐`);
                });
            } else {
                toast('User is already an admin');
            }
        }
    });
}

// Remove member from group
function removeMember(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (username === S.username) {
        toast('Use the Leave button to leave the group');
        return;
    }
    
    showDialog({
        emoji: '🗑️',
        title: 'Remove Member',
        subtitle: `Remove @${username} from "${group.name}"?`,
        confirmText: 'Remove',
        danger: true
    }).then(result => {
        if (result !== null) {
            group.members = (group.members || []).filter(m => m !== username);
            group.admins = (group.admins || []).filter(a => a !== username);
            
            updateData('groups/' + groupId + '/members', group.members);
            updateData('groups/' + groupId + '/admins', group.admins);
            
            addNotification(username, `removed you from group "${group.name}"`, 'group_remove', groupId);
            saveState();
            renderGroups();
            toast(`@${username} removed from group`);
        }
    });
}

// Rename group
function renameGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '✏️',
        title: 'Rename Group',
        subtitle: 'Enter a new name',
        placeholder: 'New group name...',
        defaultValue: group.name,
        confirmText: 'Save'
    }).then(result => {
        if (result && result.trim()) {
            group.name = result.trim();
            updateData('groups/' + groupId + '/name', group.name);
            saveState();
            renderGroups();
            renderChatList();
            toast('Group renamed! ✏️');
        }
    });
}

// Delete group
function deleteGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Group',
        subtitle: `Are you sure you want to permanently delete "${group.name}"?`,
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            removeData('groups/' + groupId);
            S.groups = S.groups.filter(g => g.id !== groupId);
            saveState();
            renderGroups();
            renderChatList();
            toast('Group deleted');
        }
    });
}

// Leave group
function leaveGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (group.admin === S.username) {
        toast('As the creator, you cannot leave. Delete the group instead.');
        return;
    }
    
    showDialog({
        emoji: '🚪',
        title: 'Leave Group',
        subtitle: `Leave "${group.name}"?`,
        confirmText: 'Leave',
        danger: true
    }).then(result => {
        if (result !== null) {
            group.members = (group.members || []).filter(m => m !== S.username);
            group.admins = (group.admins || []).filter(a => a !== S.username);
            
            updateData('groups/' + groupId + '/members', group.members);
            updateData('groups/' + groupId + '/admins', group.admins);
            
            S.groups = S.groups.filter(g => g.id !== groupId);
            saveState();
            renderGroups();
            renderChatList();
            toast('You left the group');
        }
    });
}

function openGroupChat(groupId) {
    currentChat = groupId;
    navigate('chat');
    setTimeout(() => {
        openChat(groupId, 'group');
    }, 300);
}

function loadGroups() {
    getRef('groups').on('child_added', (snapshot) => {
        const group = snapshot.val();
        group.id = snapshot.key;
        
        if (group.members && group.members.includes(S.username)) {
            if (!S.groups.find(g => g.id === group.id)) {
                S.groups.push(group);
                renderGroups();
                renderChatList();
            }
        }
    });
    
    getRef('groups').on('child_changed', (snapshot) => {
        const group = snapshot.val();
        group.id = snapshot.key;
        const idx = S.groups.findIndex(g => g.id === group.id);
        if (idx > -1) {
            S.groups[idx] = group;
            renderGroups();
            renderChatList();
        }
    });
    
    getRef('groups').on('child_removed', (snapshot) => {
        S.groups = S.groups.filter(g => g.id !== snapshot.key);
        renderGroups();
        renderChatList();
    });
}

console.log('👥 Groups module loaded with full member management');