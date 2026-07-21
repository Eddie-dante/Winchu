// js/routine.js - Routine Logic
const Routine = {
    load() {
        if (!App.state.username) return;
        const routineRef = getRef(routines/${App.state.username});
        routineRef.once('value', function(snapshot) {
            const data = snapshot.val();
            if (data) App.state.routines = Object.values(data).reverse();
            Routine.render();
        });
    },

    save() {
        const title = document.getElementById('routineTitle').value.trim();
        const content = document.getElementById('routineInput').value.trim();
        if (!title || !content) { App.toast('Add title & description'); return; }
        const routine = { title, content, date: new Date().toISOString() };
        App.state.routines.unshift(routine);
        if (App.state.username) {
            const routineRef = getRef(routines/${App.state.username});
            routineRef.push(routine);
        }
        document.getElementById('routineTitle').value = '';
        document.getElementById('routineInput').value = '';
        this.render();
        App.toast('📋 Saved');
    },

    render() {
        const container = document.getElementById('routineEntries');
        if (!container) return;
        if (App.state.routines.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No routines yet.</p>';
            return;
        }
        container.innerHTML = App.state.routines.map(r =>
            <div class="entry-card"><strong>${r.title}</strong><small style="color:#94a3b8;display:block;">${new Date(r.date).toLocaleDateString()}</small><p style="font-size:12px;margin-top:3px;white-space:pre-wrap;">${r.content}</p></div>
        ).join('');
    }
};

window.Routine = Routine;
window.saveRoutine = Routine.save.bind(Routine);