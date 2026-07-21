// ==================== DIARY LOGIC ====================
function saveDiary() {
    var content = document.getElementById('diaryInput').value.trim();
    var mood = document.getElementById('diaryMood').value.trim() || '—';
    if (!content) {
        window.toast('Write something');
        return;
    }
    var entry = { content: content, mood: mood, date: new Date().toISOString() };
    window.S.diary.unshift(entry);
    if (window.S.username) {
        var diaryRef = getRef('diary/' + window.S.username);
        diaryRef.push(entry);
    }
    document.getElementById('diaryInput').value = '';
    document.getElementById('diaryMood').value = '';
    renderDiary();
    window.toast('📝 Saved');
}
window.saveDiary = saveDiary;

function renderDiary() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    if (window.S.diary.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No entries yet.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < window.S.diary.length; i++) {
        var x = window.S.diary[i];
        var dateStr = new Date(x.date).toLocaleDateString();
        html += '<div class="entry-card"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><small style="color:#94a3b8;">' + dateStr + '</small><span style="font-size:10px;background:rgba(0,0,0,0.04);padding:2px 7px;border-radius:9px;">' + x.mood + '</span></div><p style="font-size:12px;white-space:pre-wrap;">' + x.content + '</p></div>';
    }
    container.innerHTML = html;
}
window.renderDiary = renderDiary;