// js/dashboard.js - Dashboard Logic
const Dashboard = {
    render() {
        if (App.state.selectedAuras.length === 0) { App.navigate('select'); return; }
        const p = AURAS[App.state.selectedAuras[0]];
        const tasks = getTasks();
        const { pct, done, total } = calcScore();
        const streak = calcStreak();
        const circ = 2 * Math.PI * 43;
        const offset = circ - (pct / 100) * circ;

        document.getElementById('homeTitle').textContent = App.state.selectedAuras.map(k => AURAS[k].emoji + ' ' + AURAS[k].name).join(' + ');
        document.getElementById('homeBadge').textContent = '⚡️ ' + App.state.selectedAuras.map(k => AURAS[k].emoji).join('');
        document.getElementById('score').textContent = pct + '%';
        document.getElementById('taskProgress').textContent = done + '/' + total;
        document.getElementById('streakCount').textContent = streak;
        document.getElementById('tasksDone').textContent = App.state.completedTasks.length;
        document.getElementById('diaryCount').textContent = App.state.diary.length;
        document.getElementById('msgCount').textContent = window.Chat ? Chat.messages.length : 0;

        const ring = document.getElementById('scoreRing');
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = p.accent;

        document.getElementById('tasks').innerHTML = tasks.map((t, i) => {
            const c = App.state.completedTasks.includes(i);
            return <div class="task-item${c ? ' done' : ''}" onclick="Dashboard.toggleTask(${i})"><div class="check-box">${c ? '✓' : ''}</div><span class="task-text">${t}</span></div>;
        }).join('');
        this.renderCalendar();
    },

    toggleTask(index) {
        const idx = App.state.completedTasks.indexOf(index);
        if (idx > -1) App.state.completedTasks.splice(idx, 1);
        else App.state.completedTasks.push(index);
        const tasks = getTasks(), total = tasks.length, done = App.state.completedTasks.filter(x => x < total).length;
        const today = new Date().toDateString();
        if (done === total && total > 0) App.state.streakData[today] = true;
        else delete App.state.streakData[today];
        this.render();
    },

    resetDay() {
        if (!confirm('Reset tasks?')) return;
        App.state.completedTasks = [];
        delete App.state.streakData[new Date().toDateString()];
        this.render();
    },

    renderCalendar() {
        const n = new Date(), y = n.getFullYear(), m = n.getMonth();
        const dim = new Date(y, m + 1, 0).getDate(), fd = new Date(y, m, 1).getDay();
        document.getElementById('monthLabel').textContent = n.toLocaleDateString('en', { month: 'long', year: 'numeric' });
        const cal = document.getElementById('calendar');
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
            if (App.state.streakData[ds]) {
                div.classList.add('active');
                if (App.state.selectedAuras.length) div.style.background = AURAS[App.state.selectedAuras[0]].accent;
            }
            if (d === n.getDate() && m === n.getMonth() && y === n.getFullYear()) div.classList.add('today');
            cal.appendChild(div);
        }
    }
};

function getTasks() {
    let tasks = [];
    App.state.selectedAuras.forEach(key => { if (AURAS[key]) tasks = tasks.concat(AURAS[key].tasks); });
    return [...new Set(tasks)].slice(0, 8);
}
function calcScore() {
    const tasks = getTasks(), total = tasks.length, done = App.state.completedTasks.filter(i => i < total).length;
    return { pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
}

function calcStreak() {
    let s = 0; const n = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(n); d.setDate(d.getDate() - i);
        if (App.state.streakData[d.toDateString()]) s++; else break;
    }
    return s;
}

window.Dashboard = Dashboard;
window.toggleTask = Dashboard.toggleTask.bind(Dashboard);
window.resetDay = Dashboard.resetDay.bind(Dashboard);