// ==================== DIARY LOGIC ====================
function saveDiary() {
    const content = document.getElementById('diaryInput').value.trim();
    const mood = document.getElementById('diaryMood').value.trim() || '—';
    if (!content) { toast('Write something'); return; }
    const entry = { content: content, mood: mood, date: new Date().toISOString() };
    S.diary.unshift(entry);
    if (S.username) {
        const diaryRef = getRef(`diary/${S.username}`);
        diaryRef.push(entry);
    }
    document.getElementById('diaryInput').value = '';
    document.getElementById('diaryMood').value = '';
    renderDiary();
    toast('📝 Saved');
}

function renderDiary() {
    const container = document.getElementById('diaryEntries');
    if (!container) return;
    if (S.diary.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No entries yet.</p>';
        return;
    }
    container.innerHTML = S.diary.map((x) => {
        return `<div class="entry-card"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><small style="color:#94a3b8;">${new Date(x.date).toLocaleDateString()}</small><span style="font-size:10px;background:rgba(0,0,0,0.04);padding:2px 7px;border-radius:9px;">${x.mood}</span></div><p style="font-size:12px;white-space:pre-wrap;">${x.content}</p></div>`;
    }).join('');
}

// Expose
window.saveDiary = saveDiary;
window.renderDiary = renderDiary;