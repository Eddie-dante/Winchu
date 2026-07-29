// Notifications Module - Complete

var notifListener = null;

function setupNotifListener() {
    if (notifListener) { notifListener.off(); notifListener = null; }
    
    if (!S.username) return;
    
    console.log('Setting up notifications listener for:', S.username);
    
    getRef('notifications/' + S.username).orderByChild('time').limitToLast(50).once('value').then(function(snapshot) {
        var data = snapshot.val();
        S.notifications = [];
        
        if (data) {
            Object.keys(data).forEach(function(key) {
                var notif = data[key];
                if (notif) {
                    notif.id = key;
                    S.notifications.push(notif);
                }
            });
            
            S.notifications.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.notifications.length + ' notifications');
        updateNotifBadge();
    }).catch(function(error) {
        console.error('Error loading notifications:', error);
    });
    
    notifListener = getRef('notifications/' + S.username).orderByChild('time').limitToLast(50);
    
    notifListener.on('child_added', function(snapshot) {
        var notif = snapshot.val();
        if (!notif) return;
        notif.id = snapshot.key;
        
        var existing = S.notifications.find(function(n) {
            return n.id === notif.id;
        });
        
        if (!existing) {
            console.log('New notification:', notif.message);
            S.notifications.unshift(notif);
            updateNotifBadge();
            
            if (notif.from && notif.from !== S.username) {
                var icon = getNotifIcon(notif.type);
                toast(icon + ' ' + notif.from + ': ' + notif.message);
                
                showDesktopNotification(
                    notif.from,
                    notif.message,
                    notif.type
                );
            }
        }
    });
    
    notifListener.on('child_changed', function(snapshot) {
        var notif = snapshot.val();
        if (!notif) return;
        notif.id = snapshot.key;
        
        var idx = S.notifications.findIndex(function(n) {
            return n.id === notif.id;
        });
        
        if (idx > -1) {
            S.notifications[idx] = notif;
            updateNotifBadge();
        }
    });
    
    console.log('🔔 Notifications listener active');
}

function addNotification(to, message, type, refId) {
    if (!S.username || !to) return;
    if (to === S.username) return;
    
    var notification = {
        from: S.username,
        to: to,
        message: message,
        type: type || 'general',
        refId: refId || '',
        time: new Date().toISOString(),
        read: false
    };
    
    pushData('notifications/' + to, notification).then(function() {
        console.log('Notification sent to:', to);
    }).catch(function(error) {
        console.error('Error sending notification:', error);
    });
}

function renderNotifications() {
    var container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to see notifications.</p>';
        return;
    }
    
    S.notifications = S.notifications || [];
    
    if (S.notifications.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">🔔</div>' +
            '<p>No notifications yet.</p>' +
            '<p style="font-size:12px;">When someone likes your post, comments, or sends a friend request, you\'ll see it here.</p>' +
            '</div>';
        return;
    }
    
    var grouped = {};
    var sorted = S.notifications.slice().sort(function(a, b) {
        return new Date(b.time) - new Date(a.time);
    });
    
    sorted.forEach(function(notif) {
        var dateKey = new Date(notif.time).toDateString();
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(notif);
    });
    
    var html = '';
    
    Object.keys(grouped).forEach(function(dateKey) {
        var today = new Date().toDateString();
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        
        var dateLabel = dateKey;
        if (dateKey === today) {
            dateLabel = 'Today';
        } else if (dateKey === yesterday) {
            dateLabel = 'Yesterday';
        }
        
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;padding-left:4px;">' + dateLabel + '</div>';
        
        grouped[dateKey].forEach(function(notif) {
            var icon = getNotifIcon(notif.type);
            var timeStr = new Date(notif.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += '<div class="notification-item' + (notif.read ? '' : ' unread') + '" onclick="handleNotifClick(\'' + notif.id + '\', \'' + notif.type + '\', \'' + (notif.refId || '') + '\')" style="cursor:pointer;">';
            html += '<div style="display:flex;align-items:flex-start;gap:10px;">';
            html += '<div style="font-size:24px;flex-shrink:0;margin-top:2px;">' + icon + '</div>';
            html += '<div style="flex:1;min-width:0;">';
            html += '<div style="font-size:12px;">';
            html += '<strong>' + escapeHtml(notif.from || 'System') + '</strong> ';
            html += '<span style="color:#64748b;">' + escapeHtml(notif.message) + '</span>';
            html += '</div>';
            html += '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">' + timeStr + '</div>';
            html += '</div>';
            
            if (!notif.read) {
                html += '<div style="width:8px;height:8px;background:#6366f1;border-radius:50%;flex-shrink:0;margin-top:6px;"></div>';
            }
            
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function handleNotifClick(notifId, type, refId) {
    markNotifRead(notifId);
    
    switch(type) {
        case 'like':
        case 'comment':
            if (refId) {
                closeDialog();
                viewPostDetail(refId);
            }
            break;
        case 'friend_request':
        case 'friend_accept':
            navigate('users');
            break;
        case 'group_add':
        case 'group_promote':
        case 'group_remove':
        case 'group_delete':
            navigate('groups');
            break;
        default:
            break;
    }
}

function markNotifRead(notifId) {
    if (!S.username) return;
    
    var notif = S.notifications.find(function(n) {
        return n.id === notifId;
    });
    
    if (notif && !notif.read) {
        notif.read = true;
        updateData('notifications/' + S.username + '/' + notifId + '/read', true).then(function() {
            console.log('Notification marked as read');
        }).catch(function(error) {
            console.error('Error marking notification:', error);
        });
        
        updateNotifBadge();
        renderNotifications();
    }
}

function markAllNotifsRead() {
    if (!S.username) return;
    
    var unreadNotifs = S.notifications.filter(function(n) {
        return !n.read;
    });
    
    if (unreadNotifs.length === 0) {
        toast('All notifications are already read');
        return;
    }
    
    var promises = [];
    
    unreadNotifs.forEach(function(notif) {
        notif.read = true;
        promises.push(updateData('notifications/' + S.username + '/' + notif.id + '/read', true));
    });
    
    Promise.all(promises).then(function() {
        updateNotifBadge();
        renderNotifications();
        toast('All notifications marked as read ✓');
    }).catch(function(error) {
        console.error('Error marking all as read:', error);
        toast('Error marking notifications');
    });
}

function updateNotifBadge() {
    var unreadCount = (S.notifications || []).filter(function(n) {
        return !n.read;
    }).length;
    
    var badgeIds = ['notifBadge', 'profileNotifBadge'];
    
    badgeIds.forEach(function(id) {
        var badge = document.getElementById(id);
        if (badge) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
    
    if (unreadCount > 0) {
        document.title = '(' + unreadCount + ') Winchu · Nexus';
    } else {
        document.title = 'Winchu · Nexus';
    }
}

function getNotifIcon(type) {
    var icons = {
        'like': '❤️',
        'comment': '💬',
        'friend_request': '👋',
        'friend_accept': '✅',
        'group_add': '👥',
        'group_promote': '⭐',
        'group_remove': '🚪',
        'group_delete': '🗑️',
        'follow': '👤',
        'mention': '📢',
        'system': 'ℹ️',
        'general': '🔔'
    };
    
    return icons[type] || '🔔';
}

function showDesktopNotification(title, body, type) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    try {
        var notification = new Notification(title, {
            body: body,
            icon: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=128&q=80',
            tag: 'winchu-notification',
            badge: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=128&q=80'
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
            navigate('notifications');
        };
        
        setTimeout(function() {
            notification.close();
        }, 5000);
    } catch(e) {
        console.error('Desktop notification error:', e);
    }
}

function requestNotifPermission() {
    if (!('Notification' in window)) {
        toast('Desktop notifications not supported');
        return;
    }
    
    if (Notification.permission === 'granted') {
        toast('Desktop notifications already enabled');
        return;
    }
    
    Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
            toast('Desktop notifications enabled! ✅');
        } else {
            toast('Desktop notifications denied');
        }
    });
}

window.renderNotifications = renderNotifications;
window.setupNotifListener = setupNotifListener;
window.addNotification = addNotification;
window.markNotifRead = markNotifRead;
window.markAllNotifsRead = markAllNotifsRead;
window.updateNotifBadge = updateNotifBadge;
window.handleNotifClick = handleNotifClick;
window.getNotifIcon = getNotifIcon;
window.requestNotifPermission = requestNotifPermission;

console.log('🔔 Notifications module loaded');