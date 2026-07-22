// Groups Module - Fixed group visibility for all members

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
        
        // Save to Firebase at the group ID path
        setData('groups/' + groupId, group).then(() => {
            // Add to current user's groups
            S.groups = S.groups || [];
            S.groups.push(group);
            
            // Notify all selected friends
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
}

// FIXED: loadGroups - properly listens for all groups where user is a member
function loadGroups() {
    // Load existing groups from Firebase
    getRef('groups').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            S.groups = [];
            Object.keys(data).forEach(key => {
                const group = data[key];
                group.id = key;
                // Only add groups where current user is a member
                if (group.members && group.members.includes(S.username)) {
                    S.groups.push(group);
                }
            });
            renderGroups();
            renderChatList();
        }
    });
    
    // Listen for new groups added
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
    
    // Listen for group changes
    getRef('groups').on('child_changed', (snapshot) => {
        const group = snapshot.val();
        group.id = snapshot.key;
        
        // Check if user is still a member
        if (group.members && group.members.includes(S.username)) {
            const idx = S.groups.findIndex(g => g.id === group.id);
            if (idx > -1) {
                S.groups[idx] = group;
            } else {
                S.groups.push(group);
            }
            renderGroups();
            renderChatList();
        } else {
            // User was removed from group
            S.groups = S.groups.filter(g => g.id !== group.id);
            renderGroups();
            renderChatList();
        }
    });
    
    // Listen for group deletions
    getRef('groups').on('child_removed', (snapshot) => {
        S.groups = S.groups.filter(g => g.id !== snapshot.key);
        renderGroups();
        renderChatList();
    });
}

// ... (keep all other functions: viewGroupMembers, showAddMembersDialog, etc.)

console.log('👥 Groups module loaded - all members can see groups');