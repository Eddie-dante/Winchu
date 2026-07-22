// Groups Module - With friend selection for group creation

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
        html += `<div class="group-card" onclick="openGroupChat('${g.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>👥 ${g.name}</strong>
                ${g.admin === S.username ? '<span style="font-size:10px;background:#6366f1;color:#fff;padding:2px 8px;border-radius:8px;">Admin</span>' : ''}
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                ${memberCount} member${memberCount > 1 ? 's' : ''} · 
                Members: ${(g.members || []).join(', ')}
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
    // Create a custom dialog for selecting friends
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
        friendsListHTML += `
            <div class="group-member-select" data-friend="${friend}" onclick="toggleFriendSelection(this, '${friend}')">
                <div class="check-circle">✓</div>
                <div class="user-avatar" style="width:32px;height:32px;border-radius:50%;background:${getColor(friend)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">${friend.charAt(0).toUpperCase()}</div>
                <span style="font-size:13px;">@${friend}</span>
            </div>`;
    });
    friendsListHTML += '</div>';
    friendsListHTML += '<p style="font-size:10px;color:#94a3b8;">Selected: <span id="selectedCount">0</span> friends</p>';
    
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
        
        // Only show groups where user is a member
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
}

console.log('👥 Groups module loaded');