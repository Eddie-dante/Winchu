// ==================== ROUTINE LOGIC ====================
function saveRoutine() {
    const title = document.getElementById('routineTitle').value.trim();
    const content = document.getElementById('routineInput').value.trim();
    if (!title || !content) { toast('Add title & description'); return; }
    const routine = { title: title, content: content, date: new Date().toISOString() };
    S.routines.unshift(routine);
    if (S.username) {
        const routineRef = getRef(`routines/${S.username}`);
        routineRef.push(routine);
    }
    document.getElementById('routineTitle').value = '';
    document.getElementById('routineInput').value = '';
    renderRoutines();
    toast('📋 Saved');
}

function renderRoutines() {
    const container = document.getElementById('routineEntries');
    if (!container) return;
    if (S.routines.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No routines yet.</p>';
        return;
    }
    container.innerHTML = S.routines.map(r =>
        `<div class="entry-card"><strong>${r.title}</strong><small style="color:#94a3b8;display:block;">${new Date(r.date).toLocaleDateString()}</small><p style="font-size:12px;margin-top:3px;white-space:pre-wrap;">${r.content}</p></div>`
    ).join('');
}

// Expose
window.saveRoutine = saveRoutine;
window.renderRoutines = renderRoutines;