// Notifications Module

function addNotification(to, message, type, refId) {
    if (to === S.username) return; // Don't notify yourself
    
    const notification = {
        from: S.username,
        to: to,
        message: message,
        type: type,
        refId: refId,
        time: new Date().toISOString(),
        read: false
    };
    
    pushData('notifications/' + to, notification);
}

function setupNotifListener() {
    if (!S.username) return;
    if (notifListener) notifListener.off();
    
    notifListener = getRef('notifications/' + S.username).orderByChild('time').limitToLast(30);
    
    notifListener.on('child_added', (snapshot) => {
        const notification = snapshot.val();
        notification.id = snapshot.key;
        
        if (!S.notifications.find(n => n.id === notification.id)) {
            S.notifications.unshift(notification);
            updateNotifBadge();
        }
    });
}

function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">Please log in</p>';
        return;
    }
    
    S.notifications = S.notifications || [];
    
    if (S.notifications.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><div style="font-size:48px;">🔔</div><p>No notifications yet</p></div>';
        return;
    }
    
    let html = '';
    const sorted = [...S.notifications].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    sorted.forEach(n => {
        const icon = n.type === 'like' ? '❤️' :
                     n.type === 'comment' ? '💬' :
                     n.type === 'friend_request' ? '👋' :
                     n.type === 'friend_accept' ? '✅' :
                     n.type === 'group_add' ? '👥' : '📢';
        
        html += `<div class="notification-item${n.read ? '' : ' unread'}" onclick="markNotifRead('${n.id}')">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">${icon}</span>
                <div style="flex:1;">
                    <strong>${n.from}</strong> ${n.message}
                    <br><small style="color:#94a3b8;">${timeSince(new Date(n.time))}</small>
                </div>
                ${!n.read ? '<span style="width:8px;height:8px;background:#6366f1;border-radius:50%;"></span>' : ''}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function markNotifRead(id) {
    const notification = S.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
        notification.read = true;
        getRef('notifications/' + S.username + '/' + id + '/read').set(true);
        updateNotifBadge();
        renderNotifications();
    }
}

function markAllNotifsRead() {
    S.notifications.forEach(n => {
        if (!n.read) {
            n.read = true;
            getRef('notifications/' + S.username + '/' + n.id + '/read').set(true);
        }
    });
    updateNotifBadge();
    renderNotifications();
    toast('All notifications marked as read');
}

function updateNotifBadge() {
    const unreadCount = (S.notifications || []).filter(n => !n.read).length;
    
    ['notifBadge', 'profileNotifBadge'].forEach(id => {
        const badge = document.getElementById(id);
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
}