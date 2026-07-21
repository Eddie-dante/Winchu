// Routine Module
window.saveRoutine = function() {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const title = document.getElementById('routineTitle').value.trim();
    const content = document.getElementById('routineInput').value.trim();
    
    if (!title || !content) {
        window.toast('Add both title and description');
        return;
    }
    
    const routine = {
        title: title,
        content: content,
        date: new Date().toISOString()
    };
    
    window.S.routines.unshift(routine);
    pushData('routines/' + window.S.username, routine);
    
    document.getElementById('routineTitle').value = '';
    document.getElementById('routineInput').value = '';
    
    window.renderRoutines();
    saveUserState();
    window.toast('📋 Routine saved');
};

window.renderRoutines = function() {
    const container = document.getElementById('routineEntries');
    if (!container) return;
    
    if (!window.S.routines || window.S.routines.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No routines yet. Create one! 📋</p>';
        return;
    }
    
    let html = '';
    window.S.routines.forEach((routine, index) => {
        const dateStr = new Date(routine.date).toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        html += `
            <div class="entry-card">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>${routine.title}</strong>
                    <button class="btn-sm btn-danger" onclick="window.deleteRoutine(${index})" 
                            style="font-size:10px;padding:2px 6px;">
                        🗑️
                    </button>
                </div>
                <small style="color:#94a3b8;display:block;">${dateStr}</small>
                <p style="font-size:12px;margin-top:3px;white-space:pre-wrap;">${routine.content}</p>
            </div>`;
    });
    
    container.innerHTML = html;
};

window.deleteRoutine = function(index) {
    if (index < 0 || index >= window.S.routines.length) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Routine',
        subtitle: 'Are you sure you want to delete this routine?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            const routine = window.S.routines[index];
            window.S.routines.splice(index, 1);
            
            // Remove from Firebase
            const routinesRef = getRef('routines/' + window.S.username);
            routinesRef.once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        if (data[key].title === routine.title && 
                            data[key].date === routine.date) {
                            getRef('routines/' + window.S.username + '/' + key).remove();
                        }
                    });
                }
            });
            
            window.renderRoutines();
            saveUserState();
            window.toast('Routine deleted');
        }
    });
};

console.log('📋 Routine module loaded');