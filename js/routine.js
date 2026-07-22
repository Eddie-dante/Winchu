// Routine Module - Complete with CRUD, tags, search, export, and completion tracking

// Render routines list
function renderRoutines() {
    var container = document.getElementById('routineEntries');
    if (!container) return;
    
    if (!S.username) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Please log in to manage routines.</p>';
        return;
    }
    
    S.routines = S.routines || [];
    
    if (S.routines.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">' +
            '<div style="font-size:48px;margin-bottom:12px;">📋</div>' +
            '<p>No routines yet.</p>' +
            '<p style="font-size:12px;">Create a routine to build better habits!</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    
    // Sort routines by date (newest first)
    var sortedRoutines = S.routines.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedRoutines.forEach(function(routine, displayIndex) {
        var originalIndex = S.routines.indexOf(routine);
        var dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        var timeStr = new Date(routine.date).toLocaleTimeString('en', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        var borderColor = routine.completed ? '#22c55e' : '#6366f1';
        
        html += '<div class="entry-card" style="border-left:4px solid ' + borderColor + ';">';
        
        // Header with title and actions
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">';
        html += '<div style="flex:1;">';
        html += '<strong style="font-size:14px;">📋 ' + escapeHtml(routine.title) + '</strong>';
        html += '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">' + dateStr + ' at ' + timeStr + '</div>';
        html += '</div>';
        
        // Action buttons
        html += '<div style="display:flex;gap:4px;flex-shrink:0;">';
        
        // Toggle complete
        html += '<button class="btn-sm ' + (routine.completed ? 'btn-success' : '') + '" onclick="toggleRoutineComplete(' + originalIndex + ')" style="font-size:10px;padding:4px 8px;" title="' + (routine.completed ? 'Mark incomplete' : 'Mark complete') + '">';
        html += routine.completed ? '✅' : '⭕';
        html += '</button>';
        
        // Edit
        html += '<button class="btn-sm" onclick="editRoutine(' + originalIndex + ')" style="font-size:10px;padding:4px 8px;" title="Edit">✏️</button>';
        
        // Delete
        html += '<button class="btn-sm btn-danger" onclick="deleteRoutine(' + originalIndex + ')" style="font-size:10px;padding:4px 8px;" title="Delete">🗑️</button>';
        
        html += '</div>';
        html += '</div>';
        
        // Status badge
        html += '<div style="margin-bottom:6px;">';
        html += '<span style="font-size:10px;background:' + (routine.completed ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)') + ';color:' + (routine.completed ? '#22c55e' : '#6366f1') + ';padding:2px 8px;border-radius:10px;font-weight:600;">';
        html += routine.completed ? '✅ Completed' : '⏳ In Progress';
        html += '</span>';
        
        if (routine.timeOfDay) {
            html += '<span style="font-size:10px;background:rgba(245,158,11,0.15);color:#f59e0b;padding:2px 8px;border-radius:10px;font-weight:600;margin-left:4px;">' + routine.timeOfDay + '</span>';
        }
        
        if (routine.priority) {
            var priorityColor = routine.priority === 'high' ? '#ef4444' : routine.priority === 'medium' ? '#f59e0b' : '#22c55e';
            html += '<span style="font-size:10px;background:' + priorityColor + '20;color:' + priorityColor + ';padding:2px 8px;border-radius:10px;font-weight:600;margin-left:4px;">' + routine.priority.toUpperCase() + '</span>';
        }
        
        html += '</div>';
        
        // Content
        html += '<p style="font-size:12px;color:#475569;white-space:pre-wrap;margin-bottom:6px;">' + escapeHtml(routine.content) + '</p>';
        
        // Tags
        if (routine.tags && routine.tags.length > 0) {
            html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
            routine.tags.forEach(function(tag) {
                html += '<span style="font-size:9px;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 8px;border-radius:8px;cursor:pointer;" onclick="filterRoutinesByTag(\'' + tag + '\')">#' + tag + '</span>';
            });
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Add action buttons at the bottom
    var actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;';
    actionsDiv.innerHTML = '<button class="btn-sm" onclick="searchRoutines()" style="flex:1;">🔍 Search</button>' +
        '<button class="btn-sm" onclick="exportRoutines()" style="flex:1;">📤 Export</button>' +
        '<button class="btn-sm" onclick="renderRoutines()" style="flex:1;">🔄 Refresh</button>';
    container.appendChild(actionsDiv);
}

// Save a new routine
function saveRoutine() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    var title = document.getElementById('routineTitle');
    var content = document.getElementById('routineInput');
    
    if (!title || !content) return;
    
    var titleVal = title.value.trim();
    var contentVal = content.value.trim();
    
    if (!titleVal || !contentVal) {
        toast('Please add both a title and description');
        return;
    }
    
    var routine = {
        title: titleVal,
        content: contentVal,
        date: new Date().toISOString(),
        completed: false,
        tags: [],
        priority: 'medium',
        timeOfDay: ''
    };
    
    // Extract tags from content (#tag)
    var tagRegex = /#(\w+)/g;
    var match;
    while ((match = tagRegex.exec(contentVal)) !== null) {
        if (routine.tags.indexOf(match[1]) === -1) {
            routine.tags.push(match[1].toLowerCase());
        }
    }
    
    S.routines.unshift(routine);
    
    // Save to Firebase
    db.ref('routines/' + S.username).push(routine).then(function() {
        console.log('Routine saved to Firebase');
    }).catch(function(error) {
        console.error('Error saving routine:', error);
    });
    
    // Clear inputs
    title.value = '';
    content.value = '';
    
    renderRoutines();
    saveState();
    toast('📋 Routine saved!');
}

// Toggle routine completion
function toggleRoutineComplete(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    S.routines[index].completed = !S.routines[index].completed;
    
    // Update in Firebase
    updateRoutineInFirebase(index);
    
    renderRoutines();
    saveState();
    
    var routine = S.routines[index];
    toast(routine.completed ? '✅ Routine completed!' : '🔄 Routine reopened');
}

// Edit routine
function editRoutine(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    var routine = S.routines[index];
    
    showDialog({
        emoji: '✏️',
        title: 'Edit Routine Title',
        subtitle: 'Update the title',
        placeholder: 'Routine title...',
        defaultValue: routine.title,
        confirmText: 'Next →'
    }).then(function(newTitle) {
        if (newTitle === null) return;
        
        showDialog({
            emoji: '📝',
            title: 'Edit Description',
            subtitle: 'Update the description',
            placeholder: 'Describe your routine...',
            defaultValue: routine.content,
            confirmText: 'Next →'
        }).then(function(newContent) {
            if (newContent === null) return;
            
            showDialog({
                emoji: '⚡',
                title: 'Priority',
                subtitle: 'Set priority level',
                placeholder: 'low, medium, or high',
                defaultValue: routine.priority || 'medium',
                confirmText: 'Next →'
            }).then(function(newPriority) {
                if (newPriority === null) return;
                
                showDialog({
                    emoji: '🕐',
                    title: 'Time of Day',
                    subtitle: 'When do you do this routine?',
                    placeholder: 'e.g., Morning, Afternoon, Evening',
                    defaultValue: routine.timeOfDay || '',
                    confirmText: '💾 Save'
                }).then(function(newTimeOfDay) {
                    routine.title = (newTitle && newTitle.trim()) ? newTitle.trim() : routine.title;
                    routine.content = (newContent && newContent.trim()) ? newContent.trim() : routine.content;
                    routine.priority = (newPriority && newPriority.trim()) ? newPriority.trim().toLowerCase() : routine.priority;
                    routine.timeOfDay = (newTimeOfDay && newTimeOfDay.trim()) ? newTimeOfDay.trim() : '';
                    
                    // Re-extract tags
                    routine.tags = [];
                    var tagRegex = /#(\w+)/g;
                    var match;
                    while ((match = tagRegex.exec(routine.content)) !== null) {
                        if (routine.tags.indexOf(match[1]) === -1) {
                            routine.tags.push(match[1].toLowerCase());
                        }
                    }
                    
                    updateRoutineInFirebase(index);
                    renderRoutines();
                    saveState();
                    toast('Routine updated! ✏️');
                });
            });
        });
    });
}

// Delete routine
function deleteRoutine(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Routine',
        subtitle: 'Are you sure you want to delete this routine?',
        confirmText: 'Delete',
        danger: true
    }).then(function(result) {
        if (result !== null) {
            var routine = S.routines[index];
            S.routines.splice(index, 1);
            
            // Remove from Firebase
            db.ref('routines/' + S.username).once('value').then(function(snapshot) {
                var data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(function(key) {
                        if (data[key].date === routine.date && data[key].title === routine.title) {
                            db.ref('routines/' + S.username + '/' + key).remove();
                        }
                    });
                }
            });
            
            renderRoutines();
            saveState();
            toast('Routine deleted');
        }
    });
}

// Update routine in Firebase
function updateRoutineInFirebase(index) {
    if (!S.username || index < 0 || index >= S.routines.length) return;
    
    var routine = S.routines[index];
    
    db.ref('routines/' + S.username).once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                if (data[key].date === routine.date && data[key].title === routine.title) {
                    db.ref('routines/' + S.username + '/' + key).update({
                        completed: routine.completed,
                        title: routine.title,
                        content: routine.content,
                        tags: routine.tags,
                        priority: routine.priority,
                        timeOfDay: routine.timeOfDay
                    });
                }
            });
        }
    }).catch(function(error) {
        console.error('Error updating routine:', error);
    });
}

// Filter routines by tag
function filterRoutinesByTag(tag) {
    var container = document.getElementById('routineEntries');
    if (!container) return;
    
    var filtered = S.routines.filter(function(r) {
        return r.tags && r.tags.indexOf(tag) > -1;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' +
            '<p>No routines with tag #' + tag + '</p>' +
            '<button class="btn-sm" onclick="renderRoutines()" style="margin-top:10px;">Show All</button>' +
            '</div>';
        return;
    }
    
    var html = '<div style="margin-bottom:10px;padding:8px;background:rgba(99,102,241,0.1);border-radius:10px;">' +
        '<span style="font-size:12px;">🔍 Filtered by: <strong>#' + tag + '</strong> (' + filtered.length + ' routines)</span>' +
        '<button class="btn-sm" onclick="renderRoutines()" style="margin-left:8px;font-size:10px;">Clear Filter</button>' +
        '</div>';
    
    filtered.forEach(function(routine) {
        var originalIndex = S.routines.indexOf(routine);
        html += renderSingleRoutine(routine, originalIndex);
    });
    
    container.innerHTML = html;
}

// Render a single routine
function renderSingleRoutine(routine, index) {
    var dateStr = new Date(routine.date).toLocaleDateString('en', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    
    var borderColor = routine.completed ? '#22c55e' : '#6366f1';
    
    var html = '<div class="entry-card" style="border-left:4px solid ' + borderColor + ';">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">';
    html += '<div><strong>' + escapeHtml(routine.title) + '</strong><br><small style="color:#94a3b8;">' + dateStr + '</small></div>';
    html += '<div style="display:flex;gap:4px;">';
    html += '<button class="btn-sm" onclick="toggleRoutineComplete(' + index + ')">' + (routine.completed ? '✅' : '⭕') + '</button>';
    html += '<button class="btn-sm" onclick="editRoutine(' + index + ')">✏️</button>';
    html += '<button class="btn-sm btn-danger" onclick="deleteRoutine(' + index + ')">🗑️</button>';
    html += '</div></div>';
    html += '<p style="font-size:12px;white-space:pre-wrap;">' + escapeHtml(routine.content) + '</p>';
    if (routine.tags && routine.tags.length > 0) {
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
        routine.tags.forEach(function(tag) {
            html += '<span style="font-size:9px;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 8px;border-radius:8px;">#' + tag + '</span>';
        });
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// Search routines
function searchRoutines() {
    showDialog({
        emoji: '🔍',
        title: 'Search Routines',
        subtitle: 'Search by title, content, or tag',
        placeholder: 'Search...',
        confirmText: 'Search'
    }).then(function(query) {
        if (!query || !query.trim()) return;
        
        var q = query.trim().toLowerCase();
        var container = document.getElementById('routineEntries');
        if (!container) return;
        
        var filtered = S.routines.filter(function(r) {
            return r.title.toLowerCase().indexOf(q) > -1 ||
                   r.content.toLowerCase().indexOf(q) > -1 ||
                   (r.tags && r.tags.some(function(t) { return t.indexOf(q) > -1; }));
        });
        
        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' +
                '<p>No routines found for "' + escapeHtml(q) + '"</p>' +
                '<button class="btn-sm" onclick="renderRoutines()" style="margin-top:10px;">Show All</button>' +
                '</div>';
            return;
        }
        
        var html = '<div style="margin-bottom:10px;padding:8px;background:rgba(99,102,241,0.1);border-radius:10px;">' +
            '<span style="font-size:12px;">🔍 Results for: <strong>' + escapeHtml(q) + '</strong> (' + filtered.length + ' found)</span>' +
            '<button class="btn-sm" onclick="renderRoutines()" style="margin-left:8px;font-size:10px;">Clear</button>' +
            '</div>';
        
        filtered.forEach(function(routine) {
            html += renderSingleRoutine(routine, S.routines.indexOf(routine));
        });
        
        container.innerHTML = html;
    });
}

// Export routines
function exportRoutines() {
    if (!S.routines || S.routines.length === 0) {
        toast('No routines to export');
        return;
    }
    
    var text = '📋 MY ROUTINES\n';
    text += '='.repeat(50) + '\n\n';
    
    S.routines.forEach(function(routine, index) {
        var dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        text += (index + 1) + '. ' + routine.title + '\n';
        text += '   Date: ' + dateStr + '\n';
        text += '   Status: ' + (routine.completed ? '✅ Completed' : '⏳ In Progress') + '\n';
        if (routine.priority) text += '   Priority: ' + routine.priority.toUpperCase() + '\n';
        if (routine.timeOfDay) text += '   Time: ' + routine.timeOfDay + '\n';
        if (routine.tags && routine.tags.length > 0) text += '   Tags: ' + routine.tags.map(function(t) { return '#' + t; }).join(', ') + '\n';
        text += '   ' + routine.content + '\n';
        text += '-'.repeat(50) + '\n\n';
    });
    
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'winchu-routines-' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast('📤 Routines exported!');
}

// Get routine statistics
function getRoutineStats() {
    var total = S.routines.length;
    var completed = S.routines.filter(function(r) { return r.completed; }).length;
    var inProgress = total - completed;
    var highPriority = S.routines.filter(function(r) { return r.priority === 'high'; }).length;
    
    var allTags = [];
    S.routines.forEach(function(r) {
        if (r.tags) allTags = allTags.concat(r.tags);
    });
    
    var tagCounts = {};
    allTags.forEach(function(tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    var topTags = Object.keys(tagCounts).sort(function(a, b) {
        return tagCounts[b] - tagCounts[a];
    }).slice(0, 5);
    
    return {
        total: total,
        completed: completed,
        inProgress: inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        highPriority: highPriority,
        topTags: topTags
    };
}

// Show routine statistics
function showRoutineStats() {
    var stats = getRoutineStats();
    
    var html = '<div style="text-align:center;">';
    html += '<div style="font-size:48px;margin-bottom:8px;">📊</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
    html += '<div style="background:rgba(99,102,241,0.1);padding:10px;border-radius:10px;"><strong>' + stats.total + '</strong><br><small>Total</small></div>';
    html += '<div style="background:rgba(34,197,94,0.1);padding:10px;border-radius:10px;"><strong>' + stats.completed + '</strong><br><small>Completed</small></div>';
    html += '<div style="background:rgba(245,158,11,0.1);padding:10px;border-radius:10px;"><strong>' + stats.inProgress + '</strong><br><small>In Progress</small></div>';
    html += '<div style="background:rgba(239,68,68,0.1);padding:10px;border-radius:10px;"><strong>' + stats.highPriority + '</strong><br><small>High Priority</small></div>';
    html += '</div>';
    html += '<div style="margin-bottom:8px;"><strong>Completion Rate: ' + stats.completionRate + '%</strong></div>';
    if (stats.topTags.length > 0) {
        html += '<div><small>Top Tags:</small><br>';
        stats.topTags.forEach(function(tag) {
            html += '<span style="font-size:10px;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 8px;border-radius:8px;margin:2px;display:inline-block;">#' + tag + ' (' + tagCounts[tag] + ')</span>';
        });
        html += '</div>';
    }
    html += '</div>';
    
    showDialog({
        emoji: '📊',
        title: 'Routine Statistics',
        htmlSubtitle: html,
        showBack: true,
        noCancel: true,
        confirmText: 'Close'
    });
}

// Expose functions globally
window.renderRoutines = renderRoutines;
window.saveRoutine = saveRoutine;
window.toggleRoutineComplete = toggleRoutineComplete;
window.editRoutine = editRoutine;
window.deleteRoutine = deleteRoutine;
window.filterRoutinesByTag = filterRoutinesByTag;
window.searchRoutines = searchRoutines;
window.exportRoutines = exportRoutines;
window.showRoutineStats = showRoutineStats;
window.getRoutineStats = getRoutineStats;

console.log('📋 Routine module loaded');