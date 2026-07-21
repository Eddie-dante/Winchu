// js/diary.js - Diary Logic
const Diary = {
    load() {
        if (!App.state.username) return;
        const diaryRef = getRef(diary/${App.state.username});
        diaryRef.once('value', function(snapshot) {
            const data = snapshot.val();
            if (data) App.state.diary = Object.values(data).reverse();
            Diary.render();
        });
    },

    save() {
        const content = document.getElementById('diaryInput').value.trim();
        const mood = document.getElementById('diaryMood').value.trim() || '—';
        if (!content) { App.toast('Write something'); return; }
        const entry = { content, mood, date: new Date().toISOString() };
        App.state.diary.unshift(entry);
        if (App.state.username) {
            const diaryRef = getRef(diary/${App.state.username});
            diaryRef.push(entry);
        }
        document.getElementById('diaryInput').value = '';
        document.getElementById('diaryMood').value = '';
        this.render();
        App.toast('📝 Saved');
    },

    render() {
        const container = document.getElementById('diaryEntries');
        if (!container) return;
        if (App.state.diary.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No entries yet.</p>';
            return;
        }
        container.innerHTML = App.state.diary.map(x =>
            <div class="entry-card"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><small style="color:#94a3b8;">${new Date(x.date).toLocaleDateString()}</small><span style="font-size:10px;background:rgba(0,0,0,0.04);padding:2px 7px;border-radius:9px;">${x.mood}</span></div><p style="font-size:12px;white-space:pre-wrap;">${x.content}</p></div>
        ).join('');
    }
};

window.Diary = Diary;
window.saveDiary = Diary.save.bind(Diary);