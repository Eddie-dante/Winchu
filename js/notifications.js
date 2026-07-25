// Notifications Module - Complete with real-time alerts, badge updates, settings

var notifListener = null;

// ============================================================
// SETUP NOTIFICATIONS LISTENER
// ============================================================
function setupNotifListener() {
    if (notifListener) { notifListener.off(); notifListener = null; }
    
    if (!S.username) return;
    
    console.log('Setting up notifications listener for:', S.username);
    
    // Load existing notifications
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
            
            // Sort newest first
            S.notifications.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
        }
        
        console.log('Loaded ' + S.notifications.length + ' notifications');
        updateNotifBadge();
    }).catch(function(error) {
        console.error('Error loading notifications:', error);
    });
    
    // Listen for new notifications
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
            
            // Show toast for new notification
            if (notif.from && notif.from !== S.username) {
                var icon = getNotifIcon(notif.type);
                toast(icon + ' ' + notif.from + ': ' + notif.message);
                
                // Show desktop notification
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

// ============================================================
// ADD NOTIFICATION
// ============================================================
function addNotification(to, message, type, refId) {
    if (!S.username || !to) return;
    
    // Don't notify yourself
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

// ============================================================
// RENDER NOTIFICATIONS PAGE
// ============================================================
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
    
    // Group notifications by date
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
    
    // Render each date group
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

// ============================================================
// HANDLE NOTIFICATION CLICK
// ============================================================
function handleNotifClick(notifId, type, refId) {
    // Mark as read
    markNotifRead(notifId);
    
    // Navigate based on type
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

// ============================================================
// MARK SINGLE NOTIFICATION AS READ
// ============================================================
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

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================
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

// ============================================================
// DELETE NOTIFICATION
// ============================================================
function deleteNotification(notifId) {
    if (!S.username) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Notification',
        subtitle: 'Remove this notification?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            removeData('notifications/' + S.username + '/' + notifId).then(function() {
                S.notifications = S.notifications.filter(function(n) {
                    return n.id !== notifId;
                });
                updateNotifBadge();
                renderNotifications();
                toast('Notification deleted');
            }).catch(function(error) {
                console.error('Error deleting notification:', error);
            });
        }
    });
}

// ============================================================
// CLEAR ALL NOTIFICATIONS
// ============================================================
function clearAllNotifications() {
    if (!S.username) return;
    
    if (S.notifications.length === 0) {
        toast('No notifications to clear');
        return;
    }
    
    showDialog({
        emoji: '🗑️',
        title: 'Clear All Notifications',
        subtitle: 'Remove all ' + S.notifications.length + ' notifications? This cannot be undone.',
        confirmText: 'Clear All',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            removeData('notifications/' + S.username).then(function() {
                S.notifications = [];
                updateNotifBadge();
                renderNotifications();
                toast('All notifications cleared');
            }).catch(function(error) {
                console.error('Error clearing notifications:', error);
                toast('Error clearing notifications');
            });
        }
    });
}

// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================
function updateNotifBadge() {
    var unreadCount = (S.notifications || []).filter(function(n) {
        return !n.read;
    }).length;
    
    // Update all badge elements
    var badgeIds = ['notifBadge', 'profileNotifBadge'];
    
    badgeIds.forEach(function(id) {
        var badge = document.getElementById(id);
        if (badge) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
    
    // Update page title with notification count
    if (unreadCount > 0) {
        document.title = '(' + unreadCount + ') Winchu · Nexus';
    } else {
        document.title = 'Winchu · Nexus';
    }
}

// ============================================================
// GET ICON FOR NOTIFICATION TYPE
// ============================================================
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

// ============================================================
// SHOW DESKTOP NOTIFICATION
// ============================================================
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

// ============================================================
// REQUEST DESKTOP NOTIFICATION PERMISSION
// ============================================================
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

// ============================================================
// SHOW NOTIFICATION SETTINGS
// ============================================================
function showNotifSettings() {
    var settings = getNotificationSettings();
    
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.likes ? 'checked' : '') + ' onchange="updateNotifSetting(\'likes\', this.checked)" />';
    html += '<span>❤️ Likes on your posts</span>';
    html += '</label>';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.comments ? 'checked' : '') + ' onchange="updateNotifSetting(\'comments\', this.checked)" />';
    html += '<span>💬 Comments on your posts</span>';
    html += '</label>';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.friendRequests ? 'checked' : '') + ' onchange="updateNotifSetting(\'friendRequests\', this.checked)" />';
    html += '<span>👋 Friend requests</span>';
    html += '</label>';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.friendAccepts ? 'checked' : '') + ' onchange="updateNotifSetting(\'friendAccepts\', this.checked)" />';
    html += '<span>✅ Friend acceptances</span>';
    html += '</label>';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.groupActivity ? 'checked' : '') + ' onchange="updateNotifSetting(\'groupActivity\', this.checked)" />';
    html += '<span>👥 Group activity</span>';
    html += '</label>';
    
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    html += '<input type="checkbox" ' + (settings.desktop ? 'checked' : '') + ' onchange="updateNotifSetting(\'desktop\', this.checked)" />';
    html += '<span>🖥️ Desktop notifications</span>';
    html += '</label>';
    
    html += '</div>';
    
    showDialog({
        emoji: '⚙️',
        title: 'Notification Settings',
        htmlSubtitle: html,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

// ============================================================
// GET NOTIFICATION SETTINGS
// ============================================================
function getNotificationSettings() {
    var settings = localStorage.getItem('winchu_notif_settings');
    if (settings) {
        try { return JSON.parse(settings); } catch(e) {}
    }
    
    // Default settings
    return {
        likes: true,
        comments: true,
        friendRequests: true,
        friendAccepts: true,
        groupActivity: true,
        desktop: true
    };
}

// ============================================================
// UPDATE NOTIFICATION SETTING
// ============================================================
function updateNotifSetting(key, value) {
    var settings = getNotificationSettings();
    settings[key] = value;
    localStorage.setItem('winchu_notif_settings', JSON.stringify(settings));
    console.log('Notification setting updated:', key, value);
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderNotifications = renderNotifications;
window.setupNotifListener = setupNotifListener;
window.addNotification = addNotification;
window.markNotifRead = markNotifRead;
window.markAllNotifsRead = markAllNotifsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.updateNotifBadge = updateNotifBadge;
window.handleNotifClick = handleNotifClick;
window.getNotifIcon = getNotifIcon;
window.showNotifSettings = showNotifSettings;
window.updateNotifSetting = updateNotifSetting;
window.requestNotifPermission = requestNotifPermission;
window.showDesktopNotification = showDesktopNotification;

console.log('🔔 Notifications module loaded');