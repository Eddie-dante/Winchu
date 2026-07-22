// Dashboard Module - Complete

// Get tasks based on selected auras
function getTasks() {
    var tasks = [];
    S.selectedAuras.forEach(function(key) {
        if (AURAS[key] && AURAS[key].tasks) {
            tasks = tasks.concat(AURAS[key].tasks);
        }
    });
    // Remove duplicates and limit to 8 tasks
    var uniqueTasks = [];
    tasks.forEach(function(task) {
        if (uniqueTasks.indexOf(task) === -1) {
            uniqueTasks.push(task);
        }
    });
    return uniqueTasks.slice(0, 8);
}

// Calculate score percentage
function calcScore() {
    var tasks = getTasks();
    var total = tasks.length;
    var done = S.completedTasks.filter(function(i) {
        return i < total;
    }).length;
    
    return {
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
        done: done,
        total: total
    };
}

// Calculate streak
function calcStreak() {
    var streak = 0;
    var now = new Date();
    
    for (var i = 0; i < 365; i++) {
        var d = new Date(now);
        d.setDate(d.getDate() - i);
        var dateStr = d.toDateString();
        
        if (S.streakData[dateStr]) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Render dashboard home page
function renderHome() {
    if (!S.username) {
        navigate('landing');
        return;
    }
    
    if (S.selectedAuras.length === 0) {
        navigate('select');
        return;
    }
    
    // Get primary aura for theming
    var primaryAura = AURAS[S.selectedAuras[0]];
    var tasks = getTasks();
    var score = calcScore();
    var streak = calcStreak();
    var circ = 2 * Math.PI * 43;
    var offset = circ - (score.pct / 100) * circ;
    
    // Update header
    var homeTitle = document.getElementById('homeTitle');
    if (homeTitle) {
        homeTitle.textContent = S.selectedAuras.map(function(k) {
            return AURAS[k] ? AURAS[k].emoji + ' ' + AURAS[k].name : k;
        }).join(' + ');
    }
    
    var homeBadge = document.getElementById('homeBadge');
    if (homeBadge) {
        homeBadge.textContent = '⚡ ' + S.selectedAuras.map(function(k) {
            return AURAS[k] ? AURAS[k].emoji : '';
        }).join('');
    }
    
    // Update score ring
    var scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score.pct + '%';
    
    var taskProgress = document.getElementById('taskProgress');
    if (taskProgress) taskProgress.textContent = score.done + '/' + score.total;
    
    var ring = document.getElementById('scoreRing');
    if (ring) {
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = primaryAura ? primaryAura.accent : '#0f172a';
    }
    
    // Update stat cards
    var streakCount = document.getElementById('streakCount');
    if (streakCount) streakCount.textContent = streak;
    
    var tasksDone = document.getElementById('tasksDone');
    if (tasksDone) tasksDone.textContent = S.completedTasks.length;
    
    var diaryCount = document.getElementById('diaryCount');
    if (diaryCount) diaryCount.textContent = (S.diary || []).length;
    
    var msgCount = document.getElementById('msgCount');
    if (msgCount) msgCount.textContent = chatMessages ? chatMessages.length : 0;
    
    // Render tasks list
    var tasksContainer = document.getElementById('tasks');
    if (tasksContainer) {
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:10px;font-size:12px;">No tasks available. Select auras to get tasks.</p>';
        } else {
            var tasksHTML = '';
            tasks.forEach(function(task, index) {
                var completed = S.completedTasks.indexOf(index) > -1;
                tasksHTML += '<div class="task-item' + (completed ? ' done' : '') + '" onclick="toggleTask(' + index + ')">';
                tasksHTML += '<div class="check-box">' + (completed ? '✓' : '') + '</div>';
                tasksHTML += '<span class="task-text">' + escapeHtml(task) + '</span>';
                tasksHTML += '</div>';
            });
            tasksContainer.innerHTML = tasksHTML;
        }
    }
    
    // Render calendar
    renderCalendar();
    
    // Save state
    saveState();
}

// Toggle task completion
function toggleTask(index) {
    var idx = S.completedTasks.indexOf(index);
    if (idx > -1) {
        S.completedTasks.splice(idx, 1);
    } else {
        S.completedTasks.push(index);
    }
    
    // Update streak data
    var tasks = getTasks();
    var total = tasks.length;
    var done = S.completedTasks.filter(function(x) {
        return x < total;
    }).length;
    var today = new Date().toDateString();
    
    if (done === total && total > 0) {
        S.streakData[today] = true;
    } else {
        delete S.streakData[today];
    }
    
    // Save to Firebase
    if (S.username) {
        db.ref('users/' + S.username + '/streakData').set(S.streakData);
        db.ref('users/' + S.username + '/completedTasks').set(S.completedTasks);
    }
    
    renderHome();
    saveState();
}

// Render calendar
function renderCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var firstDay = new Date(year, month, 1).getDay();
    var today = now.getDate();
    
    // Update month label
    var monthLabel = document.getElementById('monthLabel');
    if (monthLabel) {
        monthLabel.textContent = now.toLocaleDateString('en', {
            month: 'long',
            year: 'numeric'
        });
    }
    
    var cal = document.getElementById('calendar');
    if (!cal) return;
    
    cal.innerHTML = '';
    
    // Weekday headers
    var weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    weekdays.forEach(function(day) {
        var div = document.createElement('div');
        div.className = 'cal-day weekday';
        div.textContent = day;
        cal.appendChild(div);
    });
    
    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
        var emptyDiv = document.createElement('div');
        emptyDiv.className = 'cal-day';
        emptyDiv.style.background = 'transparent';
        cal.appendChild(emptyDiv);
    }
    
    // Get primary aura for coloring
    var primaryAura = AURAS[S.selectedAuras[0]];
    
    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = new Date(year, month, d).toDateString();
        var dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = d;
        
        // Highlight streak days
        if (S.streakData[dateStr]) {
            dayDiv.classList.add('active');
            if (primaryAura) {
                dayDiv.style.background = primaryAura.accent;
                dayDiv.style.color = '#fff';
                dayDiv.style.fontWeight = '600';
            }
        }
        
        // Highlight today
        if (d === today && month === now.getMonth() && year === now.getFullYear()) {
            dayDiv.classList.add('today');
        }
        
        cal.appendChild(dayDiv);
    }
}

// Reset today's tasks
function resetDay() {
    showDialog({
        emoji: '🔄',
        title: 'Reset Tasks',
        subtitle: 'Are you sure you want to reset all tasks for today? This will clear your progress.',
        confirmText: 'Reset',
        danger: true,
        cancelText: 'Cancel'
    }).then(function(result) {
        if (result !== null) {
            S.completedTasks = [];
            var today = new Date().toDateString();
            delete S.streakData[today];
            
            // Save to Firebase
            if (S.username) {
                db.ref('users/' + S.username + '/completedTasks').set([]);
                db.ref('users/' + S.username + '/streakData').set(S.streakData);
            }
            
            renderHome();
            saveState();
            toast('Tasks reset for today');
        }
    });
}

// Render aura selection grid
function renderAuraGrid() {
    var grid = document.getElementById('auraGrid');
    if (!grid) return;
    
    var html = '';
    var auraKeys = Object.keys(AURAS);
    
    auraKeys.forEach(function(key) {
        var aura = AURAS[key];
        var selected = S.selectedAuras.indexOf(key) > -1;
        
        html += '<div class="aura-btn' + (selected ? ' selected' : '') + '" onclick="toggleAura(\'' + key + '\')">';
        html += '<span class="emoji">' + aura.emoji + '</span>';
        html += '<div class="info">';
        html += '<h3>' + aura.name + '</h3>';
        html += '<p>' + aura.desc + '</p>';
        html += '</div>';
        html += '<span class="check-mark">✓</span>';
        html += '</div>';
    });
    
    grid.innerHTML = html;
    
    // Update counter
    var counter = document.getElementById('counter');
    if (counter) {
        counter.textContent = S.selectedAuras.length;
    }
}

// Toggle aura selection
function toggleAura(key) {
    var idx = S.selectedAuras.indexOf(key);
    
    if (idx > -1) {
        // Remove aura
        S.selectedAuras.splice(idx, 1);
    } else {
        // Add aura (max 3)
        if (S.selectedAuras.length < 3) {
            S.selectedAuras.push(key);
        } else {
            toast('You can select up to 3 auras. Remove one first.');
            return;
        }
    }
    
    renderAuraGrid();
    saveState();
}

// Get motivational quote based on aura
function getMotivationalQuote() {
    var quotes = {
        focus: [
            'Stay focused, go after your dreams.',
            'Concentration is the secret of strength.',
            'The successful warrior is the average man with laser-like focus.'
        ],
        energy: [
            'Energy and persistence conquer all things.',
            'The higher your energy level, the more efficient your body.',
            'Passion is energy. Feel the power that comes from focusing on what excites you.'
        ],
        calm: [
            'Peace begins with a smile.',
            'Calm mind brings inner strength and self-confidence.',
            'Nothing can bring you peace but yourself.'
        ],
        creative: [
            'Creativity is intelligence having fun.',
            'Every artist was first an amateur.',
            'Think left and think right, think low and think high.'
        ]
    };
    
    if (S.selectedAuras.length > 0) {
        var aura = S.selectedAuras[0];
        var auraQuotes = quotes[aura] || ['You are capable of amazing things.'];
        return auraQuotes[Math.floor(Math.random() * auraQuotes.length)];
    }
    
    return 'You are capable of amazing things. ⚡';
}

// Initialize dashboard
function initDashboard() {
    // Nothing to initialize specifically
    console.log('📊 Dashboard ready');
}

// Call initialization
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

// Expose functions globally
window.renderHome = renderHome;
window.toggleTask = toggleTask;
window.renderCalendar = renderCalendar;
window.resetDay = resetDay;
window.renderAuraGrid = renderAuraGrid;
window.toggleAura = toggleAura;
window.getTasks = getTasks;
window.calcScore = calcScore;
window.calcStreak = calcStreak;
window.getMotivationalQuote = getMotivationalQuote;

console.log('📊 Dashboard module loaded');