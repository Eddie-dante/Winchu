// Dashboard Module
window.getTasks = function() {
    let tasks = [];
    window.S.selectedAuras.forEach(key => {
        if (AURAS[key]) {
            tasks = tasks.concat(AURAS[key].tasks);
        }
    });
    return [...new Set(tasks)].slice(0, 8);
};

window.calcScore = function() {
    const tasks = window.getTasks();
    const total = tasks.length;
    const done = window.S.completedTasks.filter(i => i < total).length;
    return {
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
        done: done,
        total: total
    };
};

window.calcStreak = function() {
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (window.S.streakData[d.toDateString()]) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
};

window.renderHome = function() {
    if (!window.S.username) {
        window.navigate('landing');
        return;
    }
    
    if (window.S.selectedAuras.length === 0) {
        window.navigate('select');
        return;
    }
    
    const primaryAura = AURAS[window.S.selectedAuras[0]];
    const tasks = window.getTasks();
    const score = window.calcScore();
    const streak = window.calcStreak();
    const circ = 2 * Math.PI * 43;
    const offset = circ - (score.pct / 100) * circ;
    
    // Update title
    const titleEl = document.getElementById('homeTitle');
    if (titleEl) {
        titleEl.textContent = window.S.selectedAuras
            .map(k => `${AURAS[k].emoji} ${AURAS[k].name}`)
            .join(' + ');
    }
    
    // Update badge
    const badgeEl = document.getElementById('homeBadge');
    if (badgeEl) {
        badgeEl.textContent = '⚡ ' + window.S.selectedAuras.map(k => AURAS[k].emoji).join('');
    }
    
    // Update score
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score.pct + '%';
    
    const progressEl = document.getElementById('taskProgress');
    if (progressEl) progressEl.textContent = score.done + '/' + score.total;
    
    // Update ring
    const ring = document.getElementById('scoreRing');
    if (ring) {
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = primaryAura.accent;
    }
    
    // Update stats
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = streak;
    
    const tasksDoneEl = document.getElementById('tasksDone');
    if (tasksDoneEl) tasksDoneEl.textContent = window.S.completedTasks.length;
    
    const diaryCountEl = document.getElementById('diaryCount');
    if (diaryCountEl) diaryCountEl.textContent = (window.S.diary || []).length;
    
    const msgCountEl = document.getElementById('msgCount');
    if (msgCountEl) msgCountEl.textContent = window.chatMessages ? window.chatMessages.length : 0;
    
    // Render tasks
    const tasksContainer = document.getElementById('tasks');
    if (tasksContainer) {
        tasksContainer.innerHTML = tasks.map((t, i) => {
            const completed = window.S.completedTasks.includes(i);
            return `
                <div class="task-item${completed ? ' done' : ''}" onclick="window.toggleTask(${i})">
                    <div class="check-box">${completed ? '✓' : ''}</div>
                    <span class="task-text">${t}</span>
                </div>`;
        }).join('');
    }
    
    // Render calendar
    window.renderCalendar();
    saveUserState();
};

window.toggleTask = function(index) {
    const idx = window.S.completedTasks.indexOf(index);
    if (idx > -1) {
        window.S.completedTasks.splice(idx, 1);
    } else {
        window.S.completedTasks.push(index);
    }
    
    const tasks = window.getTasks();
    const total = tasks.length;
    const done = window.S.completedTasks.filter(x => x < total).length;
    const today = new Date().toDateString();
    
    if (done === total && total > 0) {
        window.S.streakData[today] = true;
    } else {
        delete window.S.streakData[today];
    }
    
    window.renderHome();
    saveUserState();
};

window.renderCalendar = function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = now.getDate();
    const todayStr = now.toDateString();
    
    const monthLabel = document.getElementById('monthLabel');
    if (monthLabel) {
        monthLabel.textContent = now.toLocaleDateString('en', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    const cal = document.getElementById('calendar');
    if (!cal) return;
    
    cal.innerHTML = '';
    
    // Weekday headers
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day weekday';
        div.textContent = d;
        cal.appendChild(div);
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.style.background = 'transparent';
        cal.appendChild(div);
    }
    
    // Day cells
    const primaryAura = AURAS[window.S.selectedAuras[0]];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month, d).toDateString();
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;
        
        if (window.S.streakData[dateStr]) {
            div.classList.add('active');
            if (primaryAura) {
                div.style.background = primaryAura.accent;
                div.style.color = '#fff';
            }
        }
        
        if (d === today && month === now.getMonth() && year === now.getFullYear()) {
            div.classList.add('today');
        }
        
        cal.appendChild(div);
    }
};

window.resetDay = function() {
    showDialog({
        emoji: '🔄',
        title: 'Reset Tasks',
        subtitle: 'Are you sure you want to reset today\'s tasks?',
        confirmText: 'Reset',
        danger: true
    }).then(result => {
        if (result !== null) {
            window.S.completedTasks = [];
            const today = new Date().toDateString();
            delete window.S.streakData[today];
            window.renderHome();
            saveUserState();
            window.toast('Tasks reset');
        }
    });
};

// Handle Enter key for chat
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.getElementById('chatInput')) {
        window.sendChatMessage();
    }
});

console.log('📊 Dashboard module loaded');