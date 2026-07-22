// Dashboard Module

function getTasks() {
    let tasks = [];
    S.selectedAuras.forEach(key => {
        if (AURAS[key]) tasks = tasks.concat(AURAS[key].tasks);
    });
    return [...new Set(tasks)].slice(0, 8);
}

function calcScore() {
    const tasks = getTasks();
    const total = tasks.length;
    const done = S.completedTasks.filter(i => i < total).length;
    return {
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
        done: done,
        total: total
    };
}

function calcStreak() {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (S.streakData[d.toDateString()]) streak++;
        else break;
    }
    return streak;
}

function renderHome() {
    if (!S.username) { navigate('landing'); return; }
    if (S.selectedAuras.length === 0) { navigate('select'); return; }

    const primaryAura = AURAS[S.selectedAuras[0]];
    const tasks = getTasks();
    const score = calcScore();
    const streak = calcStreak();
    const circ = 2 * Math.PI * 43;
    const offset = circ - (score.pct / 100) * circ;

    document.getElementById('homeTitle').textContent = S.selectedAuras
        .map(k => `${AURAS[k].emoji} ${AURAS[k].name}`).join(' + ');
    document.getElementById('homeBadge').textContent = '⚡ ' + S.selectedAuras
        .map(k => AURAS[k].emoji).join('');
    document.getElementById('score').textContent = score.pct + '%';
    document.getElementById('taskProgress').textContent = score.done + '/' + score.total;
    document.getElementById('streakCount').textContent = streak;
    document.getElementById('tasksDone').textContent = S.completedTasks.length;
    document.getElementById('diaryCount').textContent = (S.diary || []).length;
    document.getElementById('msgCount').textContent = chatMessages ? chatMessages.length : 0;

    const ring = document.getElementById('scoreRing');
    if (ring) {
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = primaryAura.accent;
    }

    const tasksContainer = document.getElementById('tasks');
    if (tasksContainer) {
        tasksContainer.innerHTML = tasks.map((t, i) => {
            const completed = S.completedTasks.includes(i);
            return `<div class="task-item${completed ? ' done' : ''}" onclick="toggleTask(${i})">
                <div class="check-box">${completed ? '✓' : ''}</div>
                <span class="task-text">${t}</span>
            </div>`;
        }).join('');
    }
    renderCalendar();
    saveState();
}

function toggleTask(index) {
    const idx = S.completedTasks.indexOf(index);
    if (idx > -1) S.completedTasks.splice(idx, 1);
    else S.completedTasks.push(index);

    const tasks = getTasks();
    const total = tasks.length;
    const done = S.completedTasks.filter(x => x < total).length;
    const today = new Date().toDateString();

    if (done === total && total > 0) S.streakData[today] = true;
    else delete S.streakData[today];

    renderHome();
    saveState();
}

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    document.getElementById('monthLabel').textContent = now.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric'
    });

    const cal = document.getElementById('calendar');
    if (!cal) return;
    cal.innerHTML = '';

    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day weekday';
        div.textContent = d;
        cal.appendChild(div);
    });

    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.style.background = 'transparent';
        cal.appendChild(div);
    }

    const primaryAura = AURAS[S.selectedAuras[0]];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month, d).toDateString();
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;
        
        if (S.streakData[dateStr]) {
            div.classList.add('active');
            if (primaryAura) {
                div.style.background = primaryAura.accent;
                div.style.color = '#fff';
            }
        }
        
        if (d === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
            div.classList.add('today');
        }
        
        cal.appendChild(div);
    }
}

function resetDay() {
    showDialog({
        emoji: '🔄',
        title: 'Reset Tasks',
        subtitle: 'Reset today\'s tasks?',
        confirmText: 'Reset',
        danger: true
    }).then(result => {
        if (result !== null) {
            S.completedTasks = [];
            delete S.streakData[new Date().toDateString()];
            renderHome();
            saveState();
            toast('Tasks reset');
        }
    });
}

function renderAuraGrid() {
    const grid = document.getElementById('auraGrid');
    if (!grid) return;
    
    let html = '';
    Object.keys(AURAS).forEach(key => {
        const aura = AURAS[key];
        const selected = S.selectedAuras.includes(key);
        html += `<div class="aura-btn${selected ? ' selected' : ''}" onclick="toggleAura('${key}')">
            <span class="emoji">${aura.emoji}</span>
            <div class="info"><h3>${aura.name}</h3><p>${aura.desc}</p></div>
            <span class="check-mark">✓</span>
        </div>`;
    });
    
    grid.innerHTML = html;
    document.getElementById('counter').textContent = S.selectedAuras.length;
}

function toggleAura(key) {
    const idx = S.selectedAuras.indexOf(key);
    if (idx > -1) S.selectedAuras.splice(idx, 1);
    else if (S.selectedAuras.length < 3) S.selectedAuras.push(key);
    renderAuraGrid();
    saveState();
}

function confirmSelection() {
    if (S.selectedAuras.length === 0) {
        toast('Select at least one aura');
        return;
    }
    if (S.username) setData('users/' + S.username + '/selected_auras', S.selectedAuras);
    saveState();
    navigate('social');
    toast('Auras activated! ✨');
}