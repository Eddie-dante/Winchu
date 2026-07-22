// Groups Module - WhatsApp-style groups with full member management

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
            <div onclick="openGroupChat('${g.id}')" style="cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>👥 ${g.name}</strong>
                    <span style="font-size:10px;background:${isCreator ? '#6366f1' : isAdmin ? '#8b5cf6' : '#94a3b8'};color:#fff;padding:3px 8px;border-radius:8px;">${isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Member'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                    ${memberCount} member${memberCount > 1 ? 's' : ''} · Created ${timeSince(new Date(g.created))}
                </div>
                ${g.description ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(g.description)}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;">
                <button class="btn-sm" onclick="event.stopPropagation();viewGroupMembers('${g.id}')" style="font-size:10px;">👥 Members</button>
                ${isAdmin ? `<button class="btn-sm" onclick="event.stopPropagation();showAddMembersDialog('${g.id}')" style="font-size:10px;">➕ Add</button>` : ''}
                ${isCreator ? `<button class="btn-sm" onclick="event.stopPropagation();showGroupSettings('${g.id}')" style="font-size:10px;">⚙️ Settings</button>` : ''}
                ${!isCreator ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();leaveGroup('${g.id}')" style="font-size:10px;">🚪 Leave</button>` : ''}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function createGroup() {
    if (!S.username) { toast('Please log in'); return; }
    
    const friends = S.friends || [];
    
    if (friends.length < 1) {
        toast('You need at least 1 friend to create a group. Add friends first!');
        return;
    }
    
    showDialog({
        emoji: '👥',
        title: 'Create Group',
        subtitle: 'Enter a name for your group',
        placeholder: 'Group name...',
        confirmText: 'Next →'
    }).then(groupName => {
        if (!groupName || !groupName.trim()) return;
        
        const name = groupName.trim();
        
        showDialog({
            emoji: '📝',
            title: 'Group Description',
            subtitle: 'Add a short description (optional)',
            placeholder: 'What is this group about?',
            confirmText: 'Next →'
        }).then(description => {
            showFriendSelectionDialog(name, description ? description.trim() : '', friends);
        });
    });
}

function showFriendSelectionDialog(groupName, description, friends) {
    const overlay = document.getElementById('dialogOverlay');
    const emoji = document.getElementById('dialogEmoji');
    const title = document.getElementById('dialogTitle');
    const subtitle = document.getElementById('dialogSubtitle');
    const input = document.getElementById('dialogInput');
    const cancelBtn = document.getElementById('dialogCancel');
    const confirmBtn = document.getElementById('dialogConfirm');
    const backBtn = document.getElementById('dialogBack');
    
    let selectedFriends = [];
    
    let friendsListHTML = '<div style="max-height:220px;overflow-y:auto;margin-bottom:8px;">';
    if (friends.length === 0) {
        friendsListHTML += '<p style="color:#94a3b8;text-align:center;padding:10px;">No friends to add</p>';
    } else {
        friends.forEach(friend => {
            const color = getColor(friend);
            friendsListHTML += `
                <div class="group-member-select" data-friend="${friend}" onclick="window._toggleFriendSelect(this, '${friend}')">
                    <div class="check-circle">✓</div>
                    <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0;">${friend.charAt(0).toUpperCase()}</div>
                    <span style="font-size:12px;">@${friend}</span>
                </div>`;
        });
    }
    friendsListHTML += '</div>';
    friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span> friend(s)</p>';
    
    backBtn.style.display = 'flex';
    input.style.display = 'none';
    emoji.textContent = '👥';
    title.textContent = 'Add Members';
    subtitle.innerHTML = `Select friends for <strong>${groupName}</strong><br>${friendsListHTML}`;
    cancelBtn.textContent = 'Cancel';
    confirmBtn.textContent = 'Create Group';
    confirmBtn.className = 'dialog-confirm';
    
    overlay.classList.add('active');
    
    window._toggleFriendSelect = function(element, friend) {
        element.classList.toggle('selected');
        const idx = selectedFriends.indexOf(friend);
        if (idx > -1) {
            selectedFriends.splice(idx, 1);
        } else {
            selectedFriends.push(friend);
        }
        const countEl = document.getElementById('selectedCount');
        if (countEl) countEl.textContent = selectedFriends.length;
    };
    
    const cleanup = () => {
        overlay.classList.remove('active');
        window._toggleFriendSelect = null;
    };
    
    cancelBtn.onclick = () => { cleanup(); };
    backBtn.onclick = () => { cleanup(); };
    
    confirmBtn.onclick = () => {
        if (selectedFriends.length < 1) {
            toast('Select at least 1 friend');
            return;
        }
        
        cleanup();
        
        const members = [S.username, ...selectedFriends];
        const group = {
            id: generateId(),
            name: groupName,
            description: description || '',
            admin: S.username,
            admins: [S.username],
            members: members,
            created: new Date().toISOString()
        };
        
        S.groups = S.groups || [];
        S.groups.push(group);
        
        pushData('groups', group).then(() => {
            selectedFriends.forEach(friend => {
                addNotification(friend, `added you to group "${groupName}"`, 'group_add', group.id);
            });
            saveState();
            renderGroups();
            renderChatList();
            toast(`Group "${groupName}" created! 🎉`);
        }).catch(() => {
            toast('Failed to create group');
        });
    };
    
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
}

function viewGroupMembers(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) { toast('Group not found'); return; }
    
    const isAdmin = (group.admins || []).includes(S.username);
    const isCreator = group.admin === S.username;
    
    let membersHTML = `<div style="margin-bottom:8px;"><strong>${group.name}</strong> · ${(group.members||[]).length} members</div>`;
    membersHTML += '<div style="max-height:280px;overflow-y:auto;">';
    
    (group.members || []).forEach(member => {
        const memberIsAdmin = (group.admins || []).includes(member);
        const memberIsCreator = group.admin === member;
        const color = getColor(member);
        const badge = memberIsCreator ? '👑 Creator' : memberIsAdmin ? '⭐ Admin' : '';
        
        membersHTML += `<div style="display:flex;align-items:center;padding:8px;border-bottom:1px solid rgba(0,0,0,0.05);gap:8px;">
            <div style="width:34px;height:34px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0;">${member.charAt(0).toUpperCase()}</div>
            <div style="flex:1;">
                <span style="font-weight:600;font-size:13px;">@${member}</span>
                ${badge ? `<span style="font-size:10px;color:#6366f1;margin-left:4px;">${badge}</span>` : ''}
                ${member === S.username ? '<span style="font-size:9px;color:#94a3b8;">(You)</span>' : ''}
            </div>
            ${isCreator && member !== S.username ? `
                <div style="display:flex;gap:3px;">
                    ${!memberIsAdmin ? `<button class="btn-sm btn-success" onclick="closeDialog();promoteToAdmin('${groupId}','${member}')" style="font-size:9px;padding:3px 7px;">⭐ Admin</button>` : `<button class="btn-sm" onclick="closeDialog();demoteAdmin('${groupId}','${member}')" style="font-size:9px;padding:3px 7px;">⬇ Demote</button>`}
                    <button class="btn-sm btn-danger" onclick="closeDialog();removeMember('${groupId}','${member}')" style="font-size:9px;padding:3px 7px;">🗑️</button>
                </div>
            ` : (isAdmin && !memberIsCreator && !memberIsAdmin && member !== S.username ? `
                <button class="btn-sm btn-danger" onclick="closeDialog();removeMember('${groupId}','${member}')" style="font-size:9px;padding:3px 7px;">🗑️</button>
            ` : '')}
        </div>`;
    });
    
    membersHTML += '</div>';
    
    if (isAdmin) {
        membersHTML += `
            <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">
                <button class="btn-sm btn-primary" onclick="closeDialog();showAddMembersDialog('${groupId}')" style="flex:1;">➕ Add Members</button>
                ${isCreator ? `<button class="btn-sm" onclick="closeDialog();showGroupSettings('${groupId}')" style="flex:1;">⚙️ Settings</button>` : ''}
            </div>`;
    }
    
    showDialog({
        emoji: '👥',
        title: 'Group Members',
        htmlSubtitle: membersHTML,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

function showAddMembersDialog(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) { toast('Group not found'); return; }
    
    const friends = (S.friends || []).filter(f => !(group.members || []).includes(f));
    
    if (friends.length === 0) {
        toast('No friends available to add.');
        return;
    }
    
    const overlay = document.getElementById('dialogOverlay');
    const emoji = document.getElementById('dialogEmoji');
    const title = document.getElementById('dialogTitle');
    const subtitle = document.getElementById('dialogSubtitle');
    const input = document.getElementById('dialogInput');
    const cancelBtn = document.getElementById('dialogCancel');
    const confirmBtn = document.getElementById('dialogConfirm');
    const backBtn = document.getElementById('dialogBack');
    
    let selectedFriends = [];
    
    let friendsListHTML = '<div style="max-height:220px;overflow-y:auto;margin-bottom:8px;">';
    friends.forEach(friend => {
        const color = getColor(friend);
        friendsListHTML += `
            <div class="group-member-select" data-friend="${friend}" onclick="window._toggleAddSelect(this, '${friend}')">
                <div class="check-circle">✓</div>
                <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0;">${friend.charAt(0).toUpperCase()}</div>
                <span style="font-size:12px;">@${friend}</span>
            </div>`;
    });
    friendsListHTML += '</div>';
    friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span></p>';
    
    backBtn.style.display = 'flex';
    input.style.display = 'none';
    emoji.textContent = '➕';
    title.textContent = 'Add Members';
    subtitle.innerHTML = `Add to <strong>${group.name}</strong><br>${friendsListHTML}`;
    cancelBtn.textContent = 'Cancel';
    confirmBtn.textContent = 'Add';
    confirmBtn.className = 'dialog-confirm';
    
    overlay.classList.add('active');
    
    window._toggleAddSelect = function(element, friend) {
        element.classList.toggle('selected');
        const idx = selectedFriends.indexOf(friend);
        if (idx > -1) selectedFriends.splice(idx, 1);
        else selectedFriends.push(friend);
        const countEl = document.getElementById('selectedCount');
        if (countEl) countEl.textContent = selectedFriends.length;
    };
    
    const cleanup = () => {
        overlay.classList.remove('active');
        window._toggleAddSelect = null;
    };
    
    cancelBtn.onclick = () => { cleanup(); };
    backBtn.onclick = () => { cleanup(); };
    
    confirmBtn.onclick = () => {
        if (selectedFriends.length === 0) { toast('Select at least 1'); return; }
        cleanup();
        
        group.members = [...new Set([...(group.members || []), ...selectedFriends])];
        updateData('groups/' + group.id + '/members', group.members).then(() => {
            selectedFriends.forEach(friend => {
                addNotification(friend, `added you to "${group.name}"`, 'group_add', group.id);
            });
            saveState();
            renderGroups();
            renderChatList();
            toast(`Added ${selectedFriends.length} member(s)!`);
        });
    };
    
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
}

function showGroupSettings(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group || group.admin !== S.username) {
        toast('Only the creator can change settings');
        return;
    }
    
    let html = `
        <div style="margin-bottom:10px;"><strong>${group.name}</strong></div>
        <div style="margin-bottom:8px;"><span style="font-size:11px;color:#94a3b8;">${(group.members||[]).length} members · Created ${new Date(group.created).toLocaleDateString()}</span></div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;">
            <button class="btn-sm" onclick="closeDialog();renameGroup('${groupId}')" style="width:100%;">✏️ Rename</button>
            <button class="btn-sm" onclick="closeDialog();editGroupDesc('${groupId}')" style="width:100%;">📝 Edit Description</button>
            <button class="btn-sm btn-danger" onclick="closeDialog();deleteGroup('${groupId}')" style="width:100%;">🗑️ Delete Group</button>
        </div>
    `;
    
    showDialog({
        emoji: '⚙️',
        title: 'Group Settings',
        htmlSubtitle: html,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

function promoteToAdmin(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group || group.admin !== S.username) return;
    
    showDialog({
        emoji: '⭐',
        title: 'Promote to Admin',
        subtitle: `Make @${username} an admin?`,
        confirmText: 'Promote'
    }).then(result => {
        if (result !== null) {
            group.admins = group.admins || [];
            if (!group.admins.includes(username)) {
                group.admins.push(username);
                updateData('groups/' + groupId + '/admins', group.admins);
                addNotification(username, `promoted you to admin in "${group.name}"`, 'group_promote', groupId);
                saveState();
                renderGroups();
                toast(`@${username} is now admin! ⭐`);
            }
        }
    });
}

function demoteAdmin(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group || group.admin !== S.username) return;
    
    group.admins = (group.admins || []).filter(a => a !== username);
    updateData('groups/' + groupId + '/admins', group.admins);
    saveState();
    renderGroups();
    toast(`@${username} demoted from admin`);
}

function removeMember(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Remove Member',
        subtitle: `Remove @${username}?`,
        confirmText: 'Remove',
        danger: true
    }).then(result => {
        if (result !== null) {
            group.members = (group.members || []).filter(m => m !== username);
            group.admins = (group.admins || []).filter(a => a !== username);
            updateData('groups/' + groupId + '/members', group.members);
            updateData('groups/' + groupId + '/admins', group.admins);
            addNotification(username, `removed you from "${group.name}"`, 'group_remove', groupId);
            saveState();
            renderGroups();
            toast('Member removed');
        }
    });
}

function renameGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '✏️',
        title: 'Rename',
        placeholder: 'New name...',
        defaultValue: group.name,
        confirmText: 'Save'
    }).then(result => {
        if (result && result.trim()) {
            group.name = result.trim();
            updateData('groups/' + groupId + '/name', group.name);
            saveState();
            renderGroups();
            renderChatList();
            toast('Renamed!');
        }
    });
}

function editGroupDesc(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '📝',
        title: 'Edit Description',
        placeholder: 'Group description...',
        defaultValue: group.description || '',
        confirmText: 'Save'
    }).then(result => {
        if (result !== null) {
            group.description = result.trim();
            updateData('groups/' + groupId + '/description', group.description);
            saveState();
            renderGroups();
            toast('Description updated!');
        }
    });
}

function deleteGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Group',
        subtitle: `Permanently delete "${group.name}"?`,
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            (group.members || []).forEach(m => {
                if (m !== S.username) addNotification(m, `"${group.name}" was deleted`, 'group_delete', '');
            });
            removeData('groups/' + groupId);
            S.groups = S.groups.filter(g => g.id !== groupId);
            saveState();
            renderGroups();
            renderChatList();
            toast('Group deleted');
        }
    });
}

function leaveGroup(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (group.admin === S.username) {
        toast('As creator, delete the group instead.');
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
            toast('Left group');
        }
    });
}

function openGroupChat(groupId) {
    currentChat = groupId;
    currentChatType = 'group';
    const group = S.groups.find(g => g.id === groupId);
    currentChatParticipants = group ? group.members : [];
    navigate('chat');
    setTimeout(() => {
        openChat(groupId, 'group', currentChatParticipants);
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

console.log('👥 Groups module loaded - WhatsApp style');