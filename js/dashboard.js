// ==================== DASHBOARD LOGIC ====================
function getTasks() {
    let tasks = [];
    S.selectedAuras.forEach(key => {
        if (AURAS[key]) tasks = tasks.concat(AURAS[key].tasks);
    });
    return [...new Set(tasks)].slice(0, 8);
}

function calcScore() {
    const tasks = getTasks(),
        total = tasks.length,
        done = S.completedTasks.filter(i => i < total).length;
    return { pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
}

function calcStreak() {
    let s = 0;
    const n = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(n);
        d.setDate(d.getDate() - i);
        if (S.streakData[d.toDateString()]) s++;
        else break;
    }
    return s;
}

function toggleTask(index) {
    const idx = S.completedTasks.indexOf(index);
    if (idx > -1) S.completedTasks.splice(idx, 1);
    else S.completedTasks.push(index);
    const tasks = getTasks(),
        total = tasks.length,
        done = S.completedTasks.filter(x => x < total).length;
    const today = new Date().toDateString();
    if (done === total && total > 0) S.streakData[today] = true;
    else delete S.streakData[today];
    renderHome();
}

function resetDay() {
    if (!confirm('Reset tasks?')) return;
    S.completedTasks = [];
    delete S.streakData[new Date().toDateString()];
    renderHome();
}

function renderHome() {
    if (S.selectedAuras.length === 0) { navigate('select'); return; }
    const p = AURAS[S.selectedAuras[0]],
        tasks = getTasks(),
        { pct, done, total } = calcScore();
    const streak = calcStreak();
    const circ = 2 * Math.PI * 43,
        offset = circ - (pct / 100) * circ;
    
    const titleEl = document.getElementById('homeTitle');
    if (titleEl) titleEl.textContent = S.selectedAuras.map(k => AURAS[k].emoji + ' ' + AURAS[k].name).join(' + ');
    
    const badgeEl = document.getElementById('homeBadge');
    if (badgeEl) badgeEl.textContent = '⚡ ' + S.selectedAuras.map(k => AURAS[k].emoji).join('');
    
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = pct + '%';
    
    const progressEl = document.getElementById('taskProgress');
    if (progressEl) progressEl.textContent = done + '/' + total;
    
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = streak;
    
    const tasksDoneEl = document.getElementById('tasksDone');
    if (tasksDoneEl) tasksDoneEl.textContent = S.completedTasks.length;
    
    const diaryCountEl = document.getElementById('diaryCount');
    if (diaryCountEl) diaryCountEl.textContent = S.diary.length;
    
    const msgCountEl = document.getElementById('msgCount');
    if (msgCountEl) msgCountEl.textContent = chatMessages.length;
    
    const ring = document.getElementById('scoreRing');
    if (ring) {
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = p.accent;
    }
    
    const tasksContainer = document.getElementById('tasks');
    if (tasksContainer) {
        tasksContainer.innerHTML = tasks.map((t, i) => {
            const c = S.completedTasks.includes(i);
            return `<div class="task-item${c ? ' done' : ''}" onclick="toggleTask(${i})"><div class="check-box">${c ? '✓' : ''}</div><span class="task-text">${t}</span></div>`;
        }).join('');
    }
    renderCalendar();
}

function renderCalendar() {
    const n = new Date(),
        y = n.getFullYear(),
        m = n.getMonth();
    const dim = new Date(y, m + 1, 0).getDate(),
        fd = new Date(y, m, 1).getDay();
    
    const monthLabel = document.getElementById('monthLabel');
    if (monthLabel) monthLabel.textContent = n.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    
    const cal = document.getElementById('calendar');
    if (!cal) return;
    cal.innerHTML = '';
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day weekday';
        div.textContent = d;
        cal.appendChild(div);
    });
    for (let i = 0; i < fd; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.style.background = 'transparent';
        cal.appendChild(div);
    }
    for (let d = 1; d <= dim; d++) {
        const ds = new Date(y, m, d).toDateString();
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;
        if (S.streakData[ds]) {
            div.classList.add('active');
            if (S.selectedAuras.length) div.style.background = AURAS[S.selectedAuras[0]].accent;
        }
        if (d === n.getDate() && m === n.getMonth() && y === n.getFullYear()) div.classList.add('today');
        cal.appendChild(div);
    }
}

// Expose
window.toggleTask = toggleTask;
window.resetDay = resetDay;
window.renderHome = renderHome;