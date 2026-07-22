// Diary Module - Fixed opening animation

var diaryPin = null;
var diaryIsLocked = true;
var diaryCurrentPage = 0;
var diaryPages = [];
var diaryUserName = '';

function initDiary() {
    var savedPin = localStorage.getItem('winchu_diary_pin');
    if (savedPin) diaryPin = savedPin;
    diaryUserName = S.name || S.username || '';
    loadDiaryEntries();
    renderDiaryBook();
}

function loadDiaryEntries() {
    diaryPages = [];
    if (S.diary && S.diary.length > 0) {
        S.diary.forEach(function(entry) {
            var date = new Date(entry.date);
            var dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            var timeOfDay = entry.mood && entry.mood !== '—' ? entry.mood : 'entry';
            var contentHTML = '<p>Dear Diary,</p><p>' + escapeHtml(entry.content) + '</p>';
            if (entry.mood && entry.mood !== '—') contentHTML += '<p style="margin-top:0.6rem;color:#4a6a7a;font-style:italic;">Mood: ' + escapeHtml(entry.mood) + '</p>';
            contentHTML += '<p style="margin-top:0.6rem;">— ' + (S.name || 'Me') + '</p>';
            diaryPages.push({ date: '📅 ' + dateStr, time: timeOfDay, content: contentHTML, editable: true, mood: entry.mood || '—', rawDate: entry.date });
        });
    }
    if (diaryPages.length === 0) {
        var today = new Date();
        var todayStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        diaryPages.push({
            date: '📅 ' + todayStr, time: 'late night',
            content: '<p>Dear Diary,</p><p>Today I finally opened the lock. The rain outside sounds like an old song.</p><p>I\'ve decided to write more often, to capture these small, fleeting thoughts.</p><p style="margin-top:0.6rem;">— Goodnight, world.</p>',
            editable: false, mood: '✨', rawDate: today.toISOString()
        });
    }
}

function renderDiaryBook() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    container.innerHTML = '';
    
    var wrapper = document.createElement('div');
    wrapper.className = 'book-wrapper';
    wrapper.style.cssText = 'width:100%;max-width:820px;aspect-ratio:3/2;perspective:2500px;cursor:default;margin:0 auto;';
    
    var book = document.createElement('div');
    book.className = 'book ' + (diaryIsLocked ? 'closed' : 'open');
    book.id = 'diaryBook';
    book.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.8s cubic-bezier(0.4,0.2,0.2,1);box-shadow:0 30px 60px rgba(0,0,0,0.5);border-radius:16px 4px 4px 16px;';
    book.style.transform = diaryIsLocked ? 'rotateY(-2deg) rotateX(1deg)' : 'rotateY(8deg) rotateX(1deg)';
    
    // COVER FRONT
    var coverFront = document.createElement('div');
    coverFront.className = 'book-cover book-cover-front';
    coverFront.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;z-index:10;background:linear-gradient(145deg,#0a1e3a,#0d2a4a,#0a1e3a);background-size:200% 200%;animation:shimmerBlue 4s ease-in-out infinite;box-shadow:inset 0 0 0 1px rgba(100,180,255,0.2),inset 0 0 60px rgba(30,80,150,0.3);color:#e8f0f8;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;text-align:center;overflow:hidden;';
    coverFront.innerHTML = '<div style="position:absolute;inset:0;background:linear-gradient(105deg,transparent 0%,transparent 30%,rgba(255,255,255,0.05) 45%,rgba(200,230,255,0.1) 50%,rgba(255,255,255,0.05) 55%,transparent 70%,transparent 100%);background-size:300% 100%;animation:shimmerMove 6s ease-in-out infinite;pointer-events:none;"></div>' +
        '<div style="position:absolute;inset:20px;border:1px solid rgba(100,200,255,0.15);border-radius:12px;pointer-events:none;"></div>' +
        '<div style="font-size:3rem;margin-bottom:0.2rem;z-index:1;">📘</div>' +
        '<div id="coverUserName" style="font-size:2.2rem;font-weight:400;letter-spacing:3px;border-bottom:1px solid rgba(100,200,255,0.15);padding-bottom:6px;margin-bottom:4px;z-index:1;">' + (diaryUserName || '—') + '</div>' +
        '<div style="font-size:3.5rem;color:#c8e4f0;letter-spacing:2px;z-index:1;">diary</div>' +
        '<div style="font-size:0.8rem;opacity:0.4;letter-spacing:5px;z-index:1;">· private ·</div>' +
        '<div style="margin-top:14px;font-size:0.65rem;border-top:1px solid rgba(100,200,255,0.1);padding-top:10px;width:50%;letter-spacing:2px;opacity:0.3;z-index:1;">✦ ' + (diaryIsLocked ? 'locked pages' : 'open pages') + ' ✦</div>';
    
    // COVER BACK
    var coverBack = document.createElement('div');
    coverBack.className = 'book-cover book-cover-back';
    coverBack.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;transform:rotateY(180deg);background:linear-gradient(145deg,#06142a,#0a1e3a);display:flex;align-items:center;justify-content:center;';
    coverBack.innerHTML = '<span style="font-size:2rem;letter-spacing:8px;color:#4a8aaa;opacity:0.2;">✦ diary ✦</span>';
    
    // SPINE
    var spine = document.createElement('div');
    spine.style.cssText = 'position:absolute;left:-8px;top:6px;width:16px;height:96%;background:#06142a;border-radius:8px 2px 2px 8px;box-shadow:inset -2px 0 10px rgba(0,0,0,0.8),inset 2px 0 4px #4a8aaa;z-index:20;border-left:1px solid #4a8aaa;';
    
    // PAGES - beneath cover
    var bookPages = document.createElement('div');
    bookPages.className = 'book-pages';
    bookPages.id = 'bookPages';
    bookPages.style.cssText = 'position:absolute;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden;border-radius:12px 2px 2px 12px;background:#f8f5f0;box-shadow:inset 0 0 0 1px #d0c8b8;padding:2rem 2.5rem;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Georgia,serif;color:#2a241e;line-height:1.8;';
    
    if (diaryIsLocked) {
        bookPages.style.transform = 'rotateY(-180deg)';
        bookPages.style.boxShadow = 'inset 0 0 0 1px #c6b8a4,inset 0 0 40px rgba(0,0,0,0.2)';
    }
    
    // Ruled lines
    var lines = document.createElement('div');
    lines.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(transparent 0px,transparent 27px,#ece6dc 27px,#ece6dc 28px);opacity:0.2;pointer-events:none;';
    bookPages.appendChild(lines);
    
    // Page content
    var pageContent = document.createElement('div');
    pageContent.style.cssText = 'position:relative;z-index:5;height:100%;display:flex;flex-direction:column;justify-content:space-between;';
    
    var header = document.createElement('div');
    header.style.cssText = 'border-bottom:1px solid #d0c8b8;padding-bottom:0.4rem;margin-bottom:0.8rem;display:flex;justify-content:space-between;font-size:0.85rem;color:#7a6e5e;text-transform:uppercase;';
    header.innerHTML = '<span id="pageDate">📅 —</span><span id="pageTime">✎ <span id="timeInput">entry</span></span>';
    
    var entry = document.createElement('div');
    entry.className = 'diary-entry';
    entry.id = 'diaryEntryContent';
    entry.contentEditable = 'false';
    entry.style.cssText = 'flex:1;font-size:1.2rem;background:rgba(255,250,240,0.3);padding:0.8rem 1rem;border-radius:12px;overflow-y:auto;border-left:3px solid #c6b8a4;color:#2c241c;min-height:70px;outline:none;white-space:pre-wrap;word-wrap:break-word;line-height:2;';
    
    var footer = document.createElement('div');
    footer.style.cssText = 'margin-top:0.8rem;display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:#8f826e;border-top:1px solid #ddd6c8;padding-top:0.5rem;';
    footer.innerHTML = '<span id="editHint" style="font-size:0.7rem;color:#a0907a;opacity:0.6;font-style:italic;">🔒 locked</span>' +
        '<button class="btn-sm" onclick="saveDiaryEntry()" style="font-size:10px;margin-left:8px;">💾 Save</button>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
        '<button id="prevPage" disabled style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.8rem;padding:4px 16px;border-radius:30px;cursor:pointer;">◀ prev</button>' +
        '<span id="pageIndicator" style="font-size:0.8rem;color:#6a5e4e;">1 / ' + diaryPages.length + '</span>' +
        '<button id="nextPage" style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.8rem;padding:4px 16px;border-radius:30px;cursor:pointer;">+ new ▶</button></div>';
    
    pageContent.appendChild(header);
    pageContent.appendChild(entry);
    pageContent.appendChild(footer);
    bookPages.appendChild(pageContent);
    
    // LOCK AREA
    var lockArea = document.createElement('div');
    lockArea.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(6,20,42,0.9);backdrop-filter:blur(8px);padding:10px 24px 12px;border-radius:40px;border:1px solid rgba(100,200,255,0.15);pointer-events:auto;';
    lockArea.innerHTML = '<div id="lockIcon" style="font-size:1.6rem;background:#1a4a6a;padding:0 14px;border-radius:20px;cursor:pointer;color:#e8f0f8;">' + (diaryIsLocked ? '🔒' : '🔓') + '</div>' +
        '<button id="lockToggle" style="background:#1a4a6a;border:none;color:#e8f0f8;font-size:0.7rem;padding:5px 18px;border-radius:20px;cursor:pointer;text-transform:uppercase;">' + (diaryIsLocked ? 'unlock' : 'lock') + '</button>' +
        '<span id="lockStatus" style="font-size:0.5rem;color:#e8f0f8;background:#06142a;padding:2px 12px;border-radius:12px;border:1px solid #4a8aaa;">' + (diaryIsLocked ? 'locked' : 'unlocked') + '</span>';
    
    // PIN MODAL
    var pinModal = document.createElement('div');
    pinModal.id = 'pinModal';
    pinModal.style.cssText = 'position:absolute;inset:0;z-index:50;background:rgba(6,20,42,0.9);backdrop-filter:blur(8px);display:' + (!diaryPin ? 'flex' : 'none') + ';justify-content:center;align-items:center;border-radius:16px 4px 4px 16px;';
    pinModal.innerHTML = '<div style="background:#f0ece6;padding:2rem;border-radius:24px;box-shadow:0 30px 50px rgba(0,0,0,0.5);text-align:center;max-width:340px;width:100%;">' +
        '<h2 style="color:#0a1e3a;font-weight:400;margin-bottom:0.2rem;font-size:1.6rem;">🔐 ' + (!diaryPin ? 'set PIN' : 'enter PIN') + '</h2>' +
        '<p style="color:#5a6a7a;font-size:0.9rem;margin-bottom:1rem;">4-digit code for your diary</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;margin-bottom:1rem;">' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '</div>' +
        '<button id="pinSubmit" style="background:#1a4a6a;border:none;color:#e8f0f8;font-size:0.9rem;padding:10px 20px;border-radius:40px;cursor:pointer;width:100%;box-shadow:0 3px 0 #0a2a4a;">' + (!diaryPin ? 'set PIN & open' : 'unlock') + '</button>' +
        '<div id="pinError" style="color:#b55a4a;font-size:0.8rem;margin-top:0.4rem;min-height:1.2rem;"></div></div>';
    
    book.appendChild(coverFront);
    book.appendChild(coverBack);
    book.appendChild(spine);
    book.appendChild(bookPages);
    book.appendChild(lockArea);
    book.appendChild(pinModal);
    wrapper.appendChild(book);
    container.appendChild(wrapper);
    
    renderDiaryPage(diaryCurrentPage);
    setupDiaryEvents(book, wrapper, pinModal);
}

function renderDiaryPage(index) {
    if (index < 0 || index >= diaryPages.length) return;
    diaryCurrentPage = index;
    var page = diaryPages[index];
    
    var pageDate = document.getElementById('pageDate');
    var timeInput = document.getElementById('timeInput');
    var diaryEntry = document.getElementById('diaryEntryContent');
    var pageIndicator = document.getElementById('pageIndicator');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');
    var editHint = document.getElementById('editHint');
    
    if (pageDate) pageDate.textContent = page.date;
    if (timeInput) timeInput.textContent = page.time || 'entry';
    if (diaryEntry) diaryEntry.innerHTML = page.content;
    if (pageIndicator) pageIndicator.textContent = (index + 1) + ' / ' + diaryPages.length;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.textContent = index === diaryPages.length - 1 ? '+ new ▶' : 'next ▶';
    
    if (!diaryIsLocked && page.editable !== false) {
        if (diaryEntry) { diaryEntry.contentEditable = 'true'; diaryEntry.style.borderLeftColor = '#4a7a9a'; diaryEntry.style.cursor = 'text'; }
        if (editHint) editHint.textContent = '✎ click to edit';
    } else {
        if (diaryEntry) { diaryEntry.contentEditable = 'false'; diaryEntry.style.borderLeftColor = '#c6b8a4'; diaryEntry.style.cursor = 'default'; }
        if (editHint) editHint.textContent = page.editable === false ? '🔒 sample' : '🔒 locked';
    }
}

function setupDiaryEvents(book, wrapper, pinModal) {
    function toggleLock() {
        if (diaryIsLocked) {
            if (!diaryPin) { pinModal.style.display = 'flex'; return; }
            diaryIsLocked = false;
            book.classList.add('opening');
            setTimeout(function() {
                book.classList.remove('opening', 'closed');
                book.classList.add('open');
                book.style.transform = 'rotateY(8deg) rotateX(1deg)';
                updateDiaryUI(book);
            }, 1000);
            showDiaryToast('🔓 Diary unlocked');
        } else {
            saveCurrentDiaryEntry();
            diaryIsLocked = true;
            book.classList.remove('open');
            book.classList.add('closed');
            book.style.transform = 'rotateY(-2deg) rotateX(1deg)';
            updateDiaryUI(book);
            showDiaryToast('🔒 Diary locked');
        }
    }
    
    document.getElementById('lockToggle').addEventListener('click', toggleLock);
    document.getElementById('lockIcon').addEventListener('click', toggleLock);
    
    document.getElementById('prevPage').addEventListener('click', function() { navigateDiaryPage(-1); });
    document.getElementById('nextPage').addEventListener('click', function() { navigateDiaryPage(1); });
    
    var pinInputs = pinModal.querySelectorAll('.pin-digit');
    pinInputs.forEach(function(inp, idx) {
        inp.addEventListener('input', function() { if (this.value.length === 1 && idx < 3) pinInputs[idx + 1].focus(); });
        inp.addEventListener('keydown', function(e) { if (e.key === 'Backspace' && this.value === '' && idx > 0) pinInputs[idx - 1].focus(); if (e.key === 'Enter') document.getElementById('pinSubmit').click(); });
    });
    
    document.getElementById('pinSubmit').addEventListener('click', function() {
        var code = '';
        pinInputs.forEach(function(inp) { if (inp.value && /[0-9]/.test(inp.value)) code += inp.value; });
        var pinError = document.getElementById('pinError');
        if (code.length !== 4) { if (pinError) pinError.textContent = '❌ enter 4 digits'; return; }
        
        if (!diaryPin) {
            diaryPin = code;
            localStorage.setItem('winchu_diary_pin', diaryPin);
            pinModal.style.display = 'none';
            diaryIsLocked = false;
            book.classList.add('opening');
            setTimeout(function() { book.classList.remove('opening', 'closed'); book.classList.add('open'); book.style.transform = 'rotateY(8deg) rotateX(1deg)'; updateDiaryUI(book); }, 1000);
            pinInputs.forEach(function(inp) { inp.value = ''; });
            showDiaryToast('🔓 PIN set · diary open');
        } else if (code === diaryPin) {
            pinModal.style.display = 'none';
            diaryIsLocked = false;
            book.classList.add('opening');
            setTimeout(function() { book.classList.remove('opening', 'closed'); book.classList.add('open'); book.style.transform = 'rotateY(8deg) rotateX(1deg)'; updateDiaryUI(book); }, 1000);
            pinInputs.forEach(function(inp) { inp.value = ''; });
            showDiaryToast('🔓 Diary unlocked');
        } else {
            if (pinError) pinError.textContent = '❌ incorrect PIN';
            pinInputs.forEach(function(inp) { inp.value = ''; });
            pinInputs[0].focus();
        }
    });
    
    var diaryEntry = document.getElementById('diaryEntryContent');
    if (diaryEntry) {
        var saveTimeout;
        diaryEntry.addEventListener('input', function() { if (diaryIsLocked) return; clearTimeout(saveTimeout); saveTimeout = setTimeout(function() { saveCurrentDiaryEntry(); }, 500); });
    }
}

function updateDiaryUI(book) {
    var lockIcon = document.getElementById('lockIcon');
    var lockStatus = document.getElementById('lockStatus');
    var lockToggle = document.getElementById('lockToggle');
    if (diaryIsLocked) {
        book.classList.remove('open'); book.classList.add('closed');
        if (lockIcon) lockIcon.textContent = '🔒'; if (lockStatus) lockStatus.textContent = 'locked'; if (lockToggle) lockToggle.textContent = 'unlock';
    } else {
        book.classList.remove('closed'); book.classList.add('open');
        if (lockIcon) lockIcon.textContent = '🔓'; if (lockStatus) lockStatus.textContent = 'unlocked'; if (lockToggle) lockToggle.textContent = 'lock';
    }
    renderDiaryPage(diaryCurrentPage);
}

function navigateDiaryPage(direction) {
    if (diaryIsLocked) return;
    saveCurrentDiaryEntry();
    var newIndex = diaryCurrentPage + direction;
    if (newIndex >= diaryPages.length) {
        var now = new Date();
        diaryPages.push({ date: '📅 ' + now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), time: 'entry', content: '<p style="color:#9a8a7a;font-style:italic;">— write your thoughts here —</p>', editable: true, rawDate: now.toISOString() });
    }
    if (newIndex < 0) return;
    diaryCurrentPage = newIndex;
    renderDiaryPage(diaryCurrentPage);
    updateDiaryUI(document.getElementById('diaryBook'));
}

function saveCurrentDiaryEntry() {
    var entry = document.getElementById('diaryEntryContent');
    var timeInput = document.getElementById('timeInput');
    if (!entry || diaryIsLocked) return;
    if (diaryCurrentPage >= 0 && diaryCurrentPage < diaryPages.length && diaryPages[diaryCurrentPage].editable !== false) {
        diaryPages[diaryCurrentPage].content = entry.innerHTML;
        diaryPages[diaryCurrentPage].time = timeInput ? timeInput.textContent.trim() : 'entry';
        var editHint = document.getElementById('editHint');
        if (editHint) { editHint.textContent = '✓ saved'; setTimeout(function() { if (editHint && !diaryIsLocked) editHint.textContent = '✎ click to edit'; }, 800); }
    }
}

function saveDiaryEntry() {
    saveCurrentDiaryEntry();
    if (!S.username || diaryIsLocked) return;
    var entry = diaryPages[diaryCurrentPage];
    if (!entry || entry.editable === false) return;
    var tempDiv = document.createElement('div'); tempDiv.innerHTML = entry.content;
    var textContent = tempDiv.textContent || tempDiv.innerText || '';
    var diaryEntry = { content: textContent.trim(), mood: entry.time || '—', date: entry.rawDate || new Date().toISOString() };
    S.diary.unshift(diaryEntry);
    db.ref('diary/' + S.username).push(diaryEntry);
    saveState();
    showDiaryToast('📝 Entry saved');
}

function showDiaryToast(msg) {
    var t = document.getElementById('diaryToast');
    if (!t) { t = document.createElement('div'); t.id = 'diaryToast'; t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#06142a;color:#e8f0f8;padding:10px 28px;border-radius:40px;font-size:0.9rem;z-index:9999;pointer-events:none;'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._timer); t._timer = setTimeout(function() { t.style.opacity = '0'; }, 2200);
}

document.addEventListener('DOMContentLoaded', function() {
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) { if (mutation.target.classList.contains('active')) initDiary(); });
        });
        observer.observe(diaryPage, { attributes: true, attributeFilter: ['class'] });
    }
});

window.renderDiary = function() { loadDiaryEntries(); renderDiaryBook(); };
window.saveDiary = saveDiaryEntry;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - fixed opening');