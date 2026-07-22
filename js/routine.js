// Routine Module

function renderRoutines() {
    const container = document.getElementById('routineEntries');
    if (!container) return;
    
    if (!S.routines || S.routines.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No routines yet. Create one! 📋</p>';
        return;
    }
    
    container.innerHTML = S.routines.map((routine, index) => {
        const dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `<div class="entry-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong>📋 ${escapeHtml(routine.title)}</strong>
                <div style="display:flex;gap:4px;">
                    <button class="btn-sm" onclick="editRoutine(${index})" style="font-size:10px;padding:2px 6px;">✏️</button>
                    <button class="btn-sm btn-danger" onclick="deleteRoutine(${index})" style="font-size:10px;padding:2px 6px;">🗑️</button>
                </div>
            </div>
            <small style="color:#94a3b8;display:block;">${dateStr}</small>
            <p style="font-size:12px;margin-top:4px;white-space:pre-wrap;">${escapeHtml(routine.content)}</p>
            ${routine.tags && routine.tags.length > 0 ? `
                <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">
                    ${routine.tags.map(tag => `<span style="font-size:9px;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 6px;border-radius:6px;">#${tag}</span>`).join('')}
                </div>
            ` : ''}
            ${routine.completed !== undefined ? `
                <div style="margin-top:6px;">
                    <span style="font-size:10px;color:${routine.completed ? '#22c55e' : '#94a3b8'};">
                        ${routine.completed ? '✅ Completed' : '⏳ In Progress'}
                    </span>
                </div>
            ` : ''}
        </div>`;
    }).join('');
}

function saveRoutine() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    const title = document.getElementById('routineTitle').value.trim();
    const content = document.getElementById('routineInput').value.trim();
    
    if (!title || !content) {
        toast('Add both title and description');
        return;
    }
    
    const routine = {
        title: title,
        content: content,
        date: new Date().toISOString(),
        completed: false,
        tags: []
    };
    
    S.routines.unshift(routine);
    
    // Save to Firebase
    pushData('routines/' + S.username, routine).then(() => {
        toast('📋 Routine saved!');
    }).catch(() => {
        toast('Failed to save routine');
    });
    
    // Clear inputs
    document.getElementById('routineTitle').value = '';
    document.getElementById('routineInput').value = '';
    
    renderRoutines();
    saveState();
}

function editRoutine(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    const routine = S.routines[index];
    
    showDialog({
        emoji: '✏️',
        title: 'Edit Routine',
        subtitle: 'Update your routine',
        placeholder: 'Title',
        defaultValue: routine.title,
        confirmText: 'Next'
    }).then(titleResult => {
        if (titleResult !== null) {
            showDialog({
                emoji: '📝',
                title: 'Edit Description',
                subtitle: 'Update the description',
                placeholder: 'Description...',
                defaultValue: routine.content,
                confirmText: 'Save'
            }).then(contentResult => {
                if (contentResult !== null) {
                    routine.title = titleResult.trim();
                    routine.content = contentResult.trim();
                    
                    // Update in Firebase
                    getRef('routines/' + S.username).once('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            const keys = Object.keys(data);
                            // Find the matching routine by date
                            for (let i = keys.length - 1; i >= 0; i--) {
                                if (data[keys[i]].date === routine.date) {
                                    updateData('routines/' + S.username + '/' + keys[i], routine);
                                    break;
                                }
                            }
                        }
                    });
                    
                    renderRoutines();
                    saveState();
                    toast('Routine updated! ✏️');
                }
            });
        }
    });
}

function deleteRoutine(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Routine',
        subtitle: 'Are you sure you want to delete this routine?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            const routine = S.routines[index];
            S.routines.splice(index, 1);
            
            // Remove from Firebase
            getRef('routines/' + S.username).once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const keys = Object.keys(data);
                    for (let i = keys.length - 1; i >= 0; i--) {
                        if (data[keys[i]].date === routine.date && 
                            data[keys[i]].title === routine.title) {
                            removeData('routines/' + S.username + '/' + keys[i]);
                            break;
                        }
                    }
                }
            });
            
            renderRoutines();
            saveState();
            toast('Routine deleted');
        }
    });
}

function toggleRoutineComplete(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    const routine = S.routines[index];
    routine.completed = !routine.completed;
    
    // Update in Firebase
    getRef('routines/' + S.username).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const keys = Object.keys(data);
            for (let i = keys.length - 1; i >= 0; i--) {
                if (data[keys[i]].date === routine.date) {
                    updateData('routines/' + S.username + '/' + keys[i] + '/completed', routine.completed);
                    break;
                }
            }
        }
    });
    
    renderRoutines();
    saveState();
    toast(routine.completed ? '✅ Routine completed!' : '🔄 Routine reopened');
}

function addTagToRoutine(index) {
    if (index < 0 || index >= S.routines.length) return;
    
    showDialog({
        emoji: '🏷️',
        title: 'Add Tag',
        subtitle: 'Enter a tag for this routine',
        placeholder: 'e.g., health, work, personal',
        confirmText: 'Add'
    }).then(result => {
        if (result && result.trim()) {
            const routine = S.routines[index];
            routine.tags = routine.tags || [];
            
            const tag = result.trim().toLowerCase();
            if (!routine.tags.includes(tag)) {
                routine.tags.push(tag);
                
                // Update in Firebase
                getRef('routines/' + S.username).once('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const keys = Object.keys(data);
                        for (let i = keys.length - 1; i >= 0; i--) {
                            if (data[keys[i]].date === routine.date) {
                                updateData('routines/' + S.username + '/' + keys[i] + '/tags', routine.tags);
                                break;
                            }
                        }
                    }
                });
                
                renderRoutines();
                saveState();
                toast('Tag added! 🏷️');
            } else {
                toast('Tag already exists');
            }
        }
    });
}

function removeTagFromRoutine(routineIndex, tagIndex) {
    if (routineIndex < 0 || routineIndex >= S.routines.length) return;
    
    const routine = S.routines[routineIndex];
    routine.tags.splice(tagIndex, 1);
    
    // Update in Firebase
    getRef('routines/' + S.username).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const keys = Object.keys(data);
            for (let i = keys.length - 1; i >= 0; i--) {
                if (data[keys[i]].date === routine.date) {
                    updateData('routines/' + S.username + '/' + keys[i] + '/tags', routine.tags);
                    break;
                }
            }
        }
    });
    
    renderRoutines();
    saveState();
    toast('Tag removed');
}

function filterRoutinesByTag(tag) {
    const container = document.getElementById('routineEntries');
    if (!container) return;
    
    const filtered = S.routines.filter(r => r.tags && r.tags.includes(tag));
    
    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;text-align:center;">No routines with tag #${tag}</p>`;
        return;
    }
    
    container.innerHTML = filtered.map((routine, index) => {
        const originalIndex = S.routines.indexOf(routine);
        const dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `<div class="entry-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong>📋 ${escapeHtml(routine.title)}</strong>
                <div style="display:flex;gap:4px;">
                    <button class="btn-sm" onclick="editRoutine(${originalIndex})" style="font-size:10px;padding:2px 6px;">✏️</button>
                    <button class="btn-sm btn-danger" onclick="deleteRoutine(${originalIndex})" style="font-size:10px;padding:2px 6px;">🗑️</button>
                </div>
            </div>
            <small style="color:#94a3b8;display:block;">${dateStr}</small>
            <p style="font-size:12px;margin-top:4px;white-space:pre-wrap;">${escapeHtml(routine.content)}</p>
            <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">
                ${routine.tags.map(t => `<span style="font-size:9px;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 6px;border-radius:6px;">#${t}</span>`).join('')}
            </div>
        </div>`;
    }).join('');
}

function searchRoutines() {
    showDialog({
        emoji: '🔍',
        title: 'Search Routines',
        subtitle: 'Search by title, content, or tag',
        placeholder: 'Search...',
        confirmText: 'Search'
    }).then(result => {
        if (result && result.trim()) {
            const query = result.trim().toLowerCase();
            const container = document.getElementById('routineEntries');
            if (!container) return;
            
            const filtered = S.routines.filter(r => {
                return r.title.toLowerCase().includes(query) ||
                       r.content.toLowerCase().includes(query) ||
                       (r.tags && r.tags.some(t => t.includes(query)));
            });
            
            if (filtered.length === 0) {
                container.innerHTML = `<p style="color:#94a3b8;text-align:center;">No routines found for "${query}"</p>`;
                // Show all routines button
                container.innerHTML += `<button class="btn-sm" onclick="renderRoutines()" style="margin-top:10px;display:block;margin-left:auto;margin-right:auto;">Show All Routines</button>`;
                return;
            }
            
            container.innerHTML = filtered.map((routine, index) => {
                const originalIndex = S.routines.indexOf(routine);
                const dateStr = new Date(routine.date).toLocaleDateString('en', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                });
                
                return `<div class="entry-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <strong>📋 ${escapeHtml(routine.title)}</strong>
                        <div style="display:flex;gap:4px;">
                            <button class="btn-sm" onclick="editRoutine(${originalIndex})" style="font-size:10px;padding:2px 6px;">✏️</button>
                            <button class="btn-sm btn-danger" onclick="deleteRoutine(${originalIndex})" style="font-size:10px;padding:2px 6px;">🗑️</button>
                        </div>
                    </div>
                    <small style="color:#94a3b8;display:block;">${dateStr}</small>
                    <p style="font-size:12px;margin-top:4px;white-space:pre-wrap;">${escapeHtml(routine.content)}</p>
                </div>`;
            }).join('');
            
            // Show all routines button
            container.innerHTML += `<button class="btn-sm" onclick="renderRoutines()" style="margin-top:10px;display:block;margin-left:auto;margin-right:auto;">Show All Routines</button>`;
        }
    });
}

function exportRoutines() {
    if (!S.routines || S.routines.length === 0) {
        toast('No routines to export');
        return;
    }
    
    let exportText = '📋 MY ROUTINES\n';
    exportText += '='.repeat(40) + '\n\n';
    
    S.routines.forEach((routine, index) => {
        const dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        exportText += `${index + 1}. ${routine.title}\n`;
        exportText += `   Date: ${dateStr}\n`;
        exportText += `   Status: ${routine.completed ? '✅ Completed' : '⏳ In Progress'}\n`;
        if (routine.tags && routine.tags.length > 0) {
            exportText += `   Tags: ${routine.tags.map(t => '#' + t).join(', ')}\n`;
        }
        exportText += `   Description: ${routine.content}\n`;
        exportText += '-'.repeat(40) + '\n\n';
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winchu-routines-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast('📤 Routines exported!');
}

// Add search and filter buttons to the routine page
function enhanceRoutinePage() {
    const container = document.getElementById('page-routine');
    if (!container) return;
    
    // Add action buttons if not already added
    if (!document.getElementById('routineActions')) {
        const actionsDiv = document.createElement('div');
        actionsDiv.id = 'routineActions';
        actionsDiv.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;';
        actionsDiv.innerHTML = `
            <button class="btn-sm" onclick="searchRoutines()" style="flex:1;">🔍 Search</button>
            <button class="btn-sm" onclick="exportRoutines()" style="flex:1;">📤 Export</button>
            <button class="btn-sm" onclick="renderRoutines()" style="flex:1;">🔄 Refresh</button>
        `;
        
        const entriesDiv = document.getElementById('routineEntries');
        if (entriesDiv) {
            entriesDiv.parentNode.insertBefore(actionsDiv, entriesDiv);
        }
    }
}

// Call enhanceRoutinePage when navigating to routine page
const originalNavigate = navigate;
navigate = function(page, data) {
    originalNavigate(page, data);
    if (page === 'routine') {
        setTimeout(enhanceRoutinePage, 100);
    }
};

console.log('📋 Routine module loaded');