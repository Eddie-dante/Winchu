// Groups Module - Fixed: no doubles, all buttons working

function renderGroups() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Please log in</p>';
        return;
    }
    
    S.groups = S.groups || [];
    
    // Remove duplicates by ID
    const seen = new Set();
    S.groups = S.groups.filter(g => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
    });
    
    if (S.groups.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No groups yet. Create one! 👥</p>';
        return;
    }
    
    let html = '';
    S.groups.forEach(g => {
        const memberCount = (g.members || []).length;
        const isAdmin = (g.admins || []).includes(S.username);
        const isCreator = g.admin === S.username;
        
        html += `<div class="group-card" id="group-${g.id}">
            <div onclick="openGroupChat('${g.id}')" style="cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>👥 ${escapeHtml(g.name || 'Group')}</strong>
                    <span style="font-size:10px;background:${isCreator ? '#6366f1' : isAdmin ? '#8b5cf6' : '#94a3b8'};color:#fff;padding:3px 8px;border-radius:8px;">${isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Member'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                    ${memberCount} member${memberCount > 1 ? 's' : ''} · Created ${timeSince(new Date(g.created))}
                </div>
                ${g.description ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(g.description)}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;">
                <button class="btn-sm" onclick="event.stopPropagation();event.preventDefault();viewGroupMembers('${g.id}')" style="font-size:10px;">👥 Members</button>
                ${isAdmin ? `<button class="btn-sm" onclick="event.stopPropagation();event.preventDefault();showAddMembersDialog('${g.id}')" style="font-size:10px;">➕ Add</button>` : ''}
                ${isCreator ? `<button class="btn-sm" onclick="event.stopPropagation();event.preventDefault();showGroupSettings('${g.id}')" style="font-size:10px;">⚙️ Settings</button>` : ''}
                ${!isCreator ? `<button class="btn-sm btn-danger" onclick="event.stopPropagation();event.preventDefault();leaveGroup('${g.id}')" style="font-size:10px;">🚪 Leave</button>` : ''}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    
    // Attach event listeners after rendering
    attachGroupButtonListeners();
}

function attachGroupButtonListeners() {
    // Use event delegation on the container
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    // Remove old listeners by cloning
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    
    // Re-attach using event delegation
    newContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            // Extract function name and arguments
            const match = onclick.match(/(\w+)\((['"])(.+?)\2\)/);
            if (match) {
                const funcName = match[1];
                const arg = match[3];
                
                switch(funcName) {
                    case 'viewGroupMembers':
                        viewGroupMembers(arg);
                        break;
                    case 'showAddMembersDialog':
                        showAddMembersDialog(arg);
                        break;
                    case 'showGroupSettings':
                        showGroupSettings(arg);
                        break;
                    case 'leaveGroup':
                        leaveGroup(arg);
                        break;
                    case 'openGroupChat':
                        openGroupChat(arg);
                        break;
                }
            }
        }
    });
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
    // Close any existing dialog first
    closeDialog();
    
    setTimeout(() => {
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
                    <div class="group-member-select" data-friend="${friend}" data-selected="false" style="display:flex;align-items:center;padding:8px 10px;background:rgba(255,255,255,0.4);border-radius:10px;margin-bottom:4px;cursor:pointer;border:1.5px solid transparent;gap:8px;">
                        <div class="check-circle" style="width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">✓</div>
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
        
        // Add click handlers to member select items
        setTimeout(() => {
            const items = overlay.querySelectorAll('.group-member-select');
            items.forEach(item => {
                item.addEventListener('click', function() {
                    const friend = this.dataset.friend;
                    const isSelected = this.dataset.selected === 'true';
                    
                    if (isSelected) {
                        this.dataset.selected = 'false';
                        this.style.borderColor = 'transparent';
                        this.style.background = 'rgba(255,255,255,0.4)';
                        this.querySelector('.check-circle').style.background = 'transparent';
                        this.querySelector('.check-circle').style.borderColor = '#cbd5e1';
                        this.querySelector('.check-circle').style.color = 'inherit';
                        selectedFriends = selectedFriends.filter(f => f !== friend);
                    } else {
                        this.dataset.selected = 'true';
                        this.style.borderColor = '#6366f1';
                        this.style.background = 'rgba(99,102,241,0.1)';
                        this.querySelector('.check-circle').style.background = '#6366f1';
                        this.querySelector('.check-circle').style.borderColor = '#6366f1';
                        this.querySelector('.check-circle').style.color = '#fff';
                        selectedFriends.push(friend);
                    }
                    
                    const countEl = document.getElementById('selectedCount');
                    if (countEl) countEl.textContent = selectedFriends.length;
                });
            });
        }, 100);
        
        const cleanup = () => {
            overlay.classList.remove('active');
        };
        
        backBtn.onclick = () => { cleanup(); };
        cancelBtn.onclick = () => { cleanup(); };
        
        confirmBtn.onclick = () => {
            if (selectedFriends.length < 1) {
                toast('Select at least 1 friend');
                return;
            }
            
            cleanup();
            
            const members = [S.username, ...selectedFriends];
            const groupId = generateId();
            const group = {
                id: groupId,
                name: groupName,
                description: description || '',
                admin: S.username,
                admins: [S.username],
                members: members,
                created: new Date().toISOString()
            };
            
            // Save to Firebase - use setData to avoid duplicates
            setData('groups/' + groupId, group).then(() => {
                // Add to local state only if not already there
                if (!S.groups.find(g => g.id === groupId)) {
                    S.groups.push(group);
                }
                
                // Notify members
                selectedFriends.forEach(friend => {
                    addNotification(friend, `added you to group "${groupName}"`, 'group_add', groupId);
                });
                
                saveState();
                renderGroups();
                renderChatList();
                toast(`Group "${groupName}" created! 🎉`);
            }).catch((err) => {
                console.error('Group creation error:', err);
                toast('Failed to create group');
            });
        };
        
        overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
    }, 200);
}

// View Group Members
function viewGroupMembers(groupId) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) { toast('Group not found'); return; }
    
    const isAdmin = (group.admins || []).includes(S.username);
    const isCreator = group.admin === S.username;
    
    let membersHTML = `<div style="margin-bottom:8px;"><strong>${escapeHtml(group.name)}</strong> · ${(group.members||[]).length} members</div>`;
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
                    ${!memberIsAdmin ? `<button class="btn-sm btn-success dialog-action-btn" data-action="promote" data-group="${groupId}" data-user="${member}" style="font-size:9px;padding:3px 7px;">⭐ Admin</button>` : `<button class="btn-sm dialog-action-btn" data-action="demote" data-group="${groupId}" data-user="${member}" style="font-size:9px;padding:3px 7px;">⬇ Demote</button>`}
                    <button class="btn-sm btn-danger dialog-action-btn" data-action="remove" data-group="${groupId}" data-user="${member}" style="font-size:9px;padding:3px 7px;">🗑️</button>
                </div>
            ` : (isAdmin && !memberIsCreator && !memberIsAdmin && member !== S.username ? `
                <button class="btn-sm btn-danger dialog-action-btn" data-action="remove" data-group="${groupId}" data-user="${member}" style="font-size:9px;padding:3px 7px;">🗑️</button>
            ` : '')}
        </div>`;
    });
    
    membersHTML += '</div>';
    
    if (isAdmin) {
        membersHTML += `
            <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">
                <button class="btn-sm btn-primary dialog-action-btn" data-action="addMembers" data-group="${groupId}" style="flex:1;">➕ Add Members</button>
                ${isCreator ? `<button class="btn-sm dialog-action-btn" data-action="settings" data-group="${groupId}" style="flex:1;">⚙️ Settings</button>` : ''}
            </div>`;
    }
    
    showDialog({
        emoji: '👥',
        title: 'Group Members',
        htmlSubtitle: membersHTML,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    }).then(result => {
        if (result === 'close') return;
    });
    
    // Attach dialog action listeners
    setTimeout(() => {
        document.querySelectorAll('.dialog-action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const action = this.dataset.action;
                const gId = this.dataset.group;
                const user = this.dataset.user;
                
                closeDialog();
                
                setTimeout(() => {
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
}

function showAddMembersDialog(groupId) {
    closeDialog();
    
    setTimeout(() => {
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
                <div class="group-member-select" data-friend="${friend}" data-selected="false" style="display:flex;align-items:center;padding:8px 10px;background:rgba(255,255,255,0.4);border-radius:10px;margin-bottom:4px;cursor:pointer;border:1.5px solid transparent;gap:8px;">
                    <div class="check-circle" style="width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">✓</div>
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
        subtitle.innerHTML = `Add to <strong>${escapeHtml(group.name)}</strong><br>${friendsListHTML}`;
        cancelBtn.textContent = 'Cancel';
        confirmBtn.textContent = 'Add';
        confirmBtn.className = 'dialog-confirm';
        
        overlay.classList.add('active');
        
        setTimeout(() => {
            overlay.querySelectorAll('.group-member-select').forEach(item => {
                item.addEventListener('click', function() {
                    const friend = this.dataset.friend;
                    const isSelected = this.dataset.selected === 'true';
                    
                    if (isSelected) {
                        this.dataset.selected = 'false';
                        this.style.borderColor = 'transparent';
                        this.style.background = 'rgba(255,255,255,0.4)';
                        this.querySelector('.check-circle').style.background = 'transparent';
                        this.querySelector('.check-circle').style.borderColor = '#cbd5e1';
                        this.querySelector('.check-circle').style.color = 'inherit';
                        selectedFriends = selectedFriends.filter(f => f !== friend);
                    } else {
                        this.dataset.selected = 'true';
                        this.style.borderColor = '#6366f1';
                        this.style.background = 'rgba(99,102,241,0.1)';
                        this.querySelector('.check-circle').style.background = '#6366f1';
                        this.querySelector('.check-circle').style.borderColor = '#6366f1';
                        this.querySelector('.check-circle').style.color = '#fff';
                        selectedFriends.push(friend);
                    }
                    
                    const countEl = document.getElementById('selectedCount');
                    if (countEl) countEl.textContent = selectedFriends.length;
                });
            });
        }, 100);
        
        const cleanup = () => { overlay.classList.remove('active'); };
        
        backBtn.onclick = () => { cleanup(); };
        cancelBtn.onclick = () => { cleanup(); };
        
        confirmBtn.onclick = () => {
            if (selectedFriends.length === 0) { toast('Select at least 1'); return; }
            cleanup();
            
            group.members = [...new Set([...(group.members || []), ...selectedFriends])];
            updateData('groups/' + groupId + '/members', group.members).then(() => {
                selectedFriends.forEach(friend => {
                    addNotification(friend, `added you to "${group.name}"`, 'group_add', groupId);
                });
                saveState();
                renderGroups();
                renderChatList();
                toast(`Added ${selectedFriends.length} member(s)!`);
            });
        };
        
        overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
    }, 200);
}

function showGroupSettings(groupId) {
    closeDialog();
    
    setTimeout(() => {
        const group = S.groups.find(g => g.id === groupId);
        if (!group || group.admin !== S.username) {
            toast('Only the creator can change settings');
            return;
        }
        
        let html = `
            <div style="margin-bottom:10px;"><strong>${escapeHtml(group.name)}</strong></div>
            <div style="margin-bottom:8px;"><span style="font-size:11px;color:#94a3b8;">${(group.members||[]).length} members · Created ${new Date(group.created).toLocaleDateString()}</span></div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;">
                <button class="btn-sm dialog-settings-btn" data-action="rename" data-group="${groupId}" style="width:100%;">✏️ Rename</button>
                <button class="btn-sm dialog-settings-btn" data-action="editDesc" data-group="${groupId}" style="width:100%;">📝 Edit Description</button>
                <button class="btn-sm btn-danger dialog-settings-btn" data-action="delete" data-group="${groupId}" style="width:100%;">🗑️ Delete Group</button>
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
        
        setTimeout(() => {
            document.querySelectorAll('.dialog-settings-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const action = this.dataset.action;
                    const gId = this.dataset.group;
                    closeDialog();
                    setTimeout(() => {
                        if (action === 'rename') renameGroup(gId);
                        else if (action === 'editDesc') editGroupDesc(gId);
                        else if (action === 'delete') deleteGroup(gId);
                    }, 300);
                });
            });
        }, 200);
    }, 200);
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
        subtitle: `Permanently delete "${escapeHtml(group.name)}"?`,
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
        subtitle: `Leave "${escapeHtml(group.name)}"?`,
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

// FIXED: loadGroups - no duplicates
function loadGroups() {
    // Clear existing
    S.groups = [];
    
    // Load once from Firebase
    getRef('groups').once('value', (snapshot) => {
        const data = snapshot.val();
        S.groups = [];
        if (data) {
            Object.keys(data).forEach(key => {
                const group = data[key];
                group.id = key;
                if (group.members && group.members.includes(S.username)) {
                    // Check for duplicates before adding
                    if (!S.groups.find(g => g.id === group.id)) {
                        S.groups.push(group);
                    }
                }
            });
        }
        renderGroups();
        renderChatList();
    });
    
    // Listen for changes
    getRef('groups').on('child_changed', (snapshot) => {
        const group = snapshot.val();
        group.id = snapshot.key;
        
        if (group.members && group.members.includes(S.username)) {
            const idx = S.groups.findIndex(g => g.id === group.id);
            if (idx > -1) {
                S.groups[idx] = group;
            } else {
                if (!S.groups.find(g => g.id === group.id)) {
                    S.groups.push(group);
                }
            }
        } else {
            S.groups = S.groups.filter(g => g.id !== group.id);
        }
        renderGroups();
        renderChatList();
    });
    
    getRef('groups').on('child_removed', (snapshot) => {
        S.groups = S.groups.filter(g => g.id !== snapshot.key);
        renderGroups();
        renderChatList();
    });
    
    // Don't listen for child_added to avoid duplicates with once('value')
}

console.log('👥 Groups module loaded - all buttons working, no duplicates');