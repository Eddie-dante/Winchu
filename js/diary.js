// Diary Module
window.saveDiary = function() {
    if (!window.S.username) {
        window.toast('Please log in');
        return;
    }
    
    const content = document.getElementById('diaryInput').value.trim();
    const mood = document.getElementById('diaryMood').value.trim() || '—';
    
    if (!content) {
        window.toast('Write something in your diary');
        return;
    }
    
    const entry = {
        content: content,
        mood: mood,
        date: new Date().toISOString()
    };
    
    window.S.diary.unshift(entry);
    pushData('diary/' + window.S.username, entry);
    
    document.getElementById('diaryInput').value = '';
    document.getElementById('diaryMood').value = '';
    
    window.renderDiary();
    saveUserState();
    window.toast('📝 Entry saved');
};

window.renderDiary = function() {
    const container = document.getElementById('diaryEntries');
    if (!container) return;
    
    if (!window.S.diary || window.S.diary.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No entries yet. Start writing! ✍️</p>';
        return;
    }
    
    let html = '';
    window.S.diary.forEach((entry, index) => {
        const dateStr = new Date(entry.date).toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        html += `
            <div class="entry-card">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <small style="color:#94a3b8;">${dateStr}</small>
                    <span style="font-size:10px;background:rgba(0,0,0,0.04);padding:2px 7px;border-radius:9px;">
                        ${entry.mood}
                    </span>
                    <button class="btn-sm btn-danger" onclick="window.deleteDiaryEntry(${index})" 
                            style="font-size:10px;padding:2px 6px;">
                        🗑️
                    </button>
                </div>
                <p style="font-size:12px;white-space:pre-wrap;">${entry.content}</p>
            </div>`;
    });
    
    container.innerHTML = html;
};

window.deleteDiaryEntry = function(index) {
    if (index < 0 || index >= window.S.diary.length) return;
    
    showDialog({
        emoji: '🗑️',
        title: 'Delete Entry',
        subtitle: 'Are you sure you want to delete this diary entry?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            const entry = window.S.diary[index];
            window.S.diary.splice(index, 1);
            
            // Remove from Firebase
            const diaryRef = getRef('diary/' + window.S.username);
            diaryRef.once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        if (data[key].date === entry.date && 
                            data[key].content === entry.content) {
                            getRef('diary/' + window.S.username + '/' + key).remove();
                        }
                    });
                }
            });
            
            window.renderDiary();
            saveUserState();
            window.toast('Entry deleted');
        }
    });
};

console.log('📖 Diary module loaded');