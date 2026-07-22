// Diary & Routines Module

function renderDiary() {
    const container = document.getElementById('diaryEntries');
    if (!container) return;
    
    if (!S.diary || S.diary.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No entries yet. Start journaling! ✍️</p>';
        return;
    }
    
    container.innerHTML = S.diary.map((entry, index) => {
        const dateStr = new Date(entry.date).toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `<div class="entry-card">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <small style="color:#94a3b8;">${dateStr}</small>
                <span style="font-size:10px;background:rgba(0,0,0,0.04);padding:2px 7px;border-radius:9px;">${entry.mood}</span>
                <button class="btn-sm btn-danger" onclick="deleteDiaryEntry(${index})" style="font-size:10px;padding:2px 6px;">🗑️</button>
            </div>
            <p style="font-size:12px;white-space:pre-wrap;">${entry.content}</p>
        </div>`;
    }).join('');
}

function saveDiary() {
    if (!S.username) {
        toast('Please log in');
        return;
    }
    
    const content = document.getElementById('diaryInput').value.trim();
    const mood = document.getElementById('diaryMood').value.trim() || '—';
    
    if (!content) {
        toast('Write something in your diary');
        return;
    }
    
    const entry = {
        content: content,
        mood: mood,
        date: new Date().toISOString()
    };
    
    S.diary.unshift(entry);
    pushData('diary/' + S.username, entry);
    
    document.getElementById('diaryInput').value = '';
    document.getElementById('diaryMood').value = '';
    
    renderDiary();
    saveState();
    toast('📝 Entry saved!');
}

function deleteDiaryEntry(index) {
    showDialog({
        emoji: '🗑️',
        title: 'Delete Entry',
        subtitle: 'Are you sure you want to delete this diary entry?',
        confirmText: 'Delete',
        danger: true
    }).then(result => {
        if (result !== null) {
            S.diary.splice(index, 1);
            renderDiary();
            saveState();
            toast('Entry deleted');
        }
    });
}

function renderRoutines() {
    const container = document.getElementById('routineEntries');
    if (!container) return;
    
    if (!S.routines || S.routines.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;">No routines yet. Create one! 📋</p>';
        return;
    }
    
    container.innerHTML = S.routines.map(r => {
        const dateStr = new Date(r.date).toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return `<div class="entry-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${r.title}</strong>
                <button class="btn-sm btn-danger" onclick="deleteRoutine('${r.date}')" style="font-size:10px;padding:2px 6px;">🗑️</button>
            </div>
            <small style="color:#94a3b8;display:block;">${dateStr}</small>
            <p style="font-size:12px;margin-top:3px;white-space:pre-wrap;">${r.content}</p>
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
        date: new Date().toISOString()
    };
    
    S.routines.unshift(routine);
    pushData('routines/' + S.username, routine);
    
    document.getElementById('routineTitle').value = '';
    document.getElementById('routineInput').value = '';
    
    renderRoutines();
    saveState();
    toast('📋 Routine saved!');
}

function deleteRoutine(date) {
    S.routines = S.routines.filter(r => r.date !== date);
    renderRoutines();
    saveState();
    toast('Routine deleted');
}