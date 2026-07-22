// Groups Module

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
        html += `<div class="group-card" onclick="openGroupChat('${g.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>👥 ${g.name}</strong>
                ${g.admin === S.username ? '<span style="font-size:10px;background:#6366f1;color:#fff;padding:2px 8px;border-radius:8px;">Admin</span>' : ''}
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                ${g.members.length} members · Created ${timeSince(new Date(g.created))}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function createGroup() {
    showDialog({
        emoji: '👥',
        title: 'Create Group',
        subtitle: 'Enter a name for your group',
        placeholder: 'Group name...',
        confirmText: 'Create'
    }).then(result => {
        if (result && result.trim()) {
            const group = {
                id: generateId(),
                name: result.trim(),
                admin: S.username,
                admins: [S.username],
                members: [S.username],
                created: new Date().toISOString()
            };
            
            S.groups = S.groups || [];
            S.groups.push(group);
            pushData('groups', group);
            
            saveState();
            renderGroups();
            renderChatList();
            toast('Group created! 🎉');
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

function addMemberToGroup(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (!group.members.includes(username)) {
        group.members.push(username);
        setData('groups/' + groupId + '/members', group.members);
        addNotification(username, `You were added to group "${group.name}"`, 'group_add', groupId);
        toast('Member added!');
    }
}

function removeMemberFromGroup(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    group.members = group.members.filter(m => m !== username);
    setData('groups/' + groupId + '/members', group.members);
    toast('Member removed');
}

function makeAdmin(groupId, username) {
    const group = S.groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (!group.admins.includes(username)) {
        group.admins.push(username);
        setData('groups/' + groupId + '/admins', group.admins);
        toast(username + ' is now an admin');
    }
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
}