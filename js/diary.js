// Diary Module - Blue Book Design with PIN, page navigation, and Firebase sync

var diaryPin = null;
var diaryIsLocked = true;
var diaryCurrentPage = 0;
var diaryPages = [];
var diaryUserName = '';
var isOpening = false;

// ============================================================
// INITIALIZE DIARY
// ============================================================
function initDiary() {
    var savedPin = localStorage.getItem('winchu_diary_pin');
    if (savedPin) diaryPin = savedPin;
    
    diaryUserName = S.name || S.username || '';
    loadDiaryEntries();
    renderDiaryBook();
}

// ============================================================
// LOAD DIARY ENTRIES FROM STATE
// ============================================================
function loadDiaryEntries() {
    diaryPages = [];
    
    if (S.diary && S.diary.length > 0) {
        S.diary.forEach(function(entry) {
            var date = new Date(entry.date);
            var dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            var timeOfDay = entry.mood && entry.mood !== '—' ? entry.mood : 'entry';
            
            var contentHTML = '<p>Dear Diary,</p>';
            contentHTML += '<p>' + escapeHtml(entry.content) + '</p>';
            if (entry.mood && entry.mood !== '—') {
                contentHTML += '<p style="margin-top:0.6rem;color:#4a6a7a;font-style:italic;">Mood: ' + escapeHtml(entry.mood) + '</p>';
            }
            contentHTML += '<p style="margin-top:0.6rem;">— ' + (S.name || 'Me') + '</p>';
            
            diaryPages.push({
                date: '📅 ' + dateStr,
                time: timeOfDay,
                content: contentHTML,
                editable: true,
                mood: entry.mood || '—',
                rawDate: entry.date
            });
        });
    }
    
    // Add sample page if no entries
    if (diaryPages.length === 0) {
        var today = new Date();
        var todayStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        diaryPages.push({
            date: '📅 ' + todayStr,
            time: 'late night',
            content: '<p>Dear Diary,</p><p>Today I finally opened the lock. The rain outside sounds like an old song, and I\'m sitting at my desk, turning the pages of this book that holds so many nights.</p><p>I\'ve decided to write more often, to capture these small, fleeting thoughts. Because some words are only for you.</p><p style="margin-top:0.6rem;">— Goodnight, world.</p>',
            editable: false,
            mood: '✨',
            rawDate: today.toISOString()
        });
    }
}

// ============================================================
// RENDER DIARY BOOK - Blue design matching the template
// ============================================================
function renderDiaryBook() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Toast element
    var toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.id = 'diaryToast';
    toastEl.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#0a1e32;color:#e8f0f8;padding:10px 28px;border-radius:40px;font-family:Georgia,serif;font-size:0.85rem;font-weight:400;box-shadow:0 6px 20px rgba(0,0,0,0.3);border:1px solid #3a6a8a;opacity:0;transition:opacity 0.3s ease;z-index:999;pointer-events:none;white-space:nowrap;letter-spacing:0.3px;';
    container.appendChild(toastEl);
    
    // Book wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'book-wrapper';
    wrapper.style.cssText = 'width:100%;max-width:820px;aspect-ratio:3/2;perspective:2000px;cursor:default;margin:0 auto;';
    
    // Book
    var book = document.createElement('div');
    book.className = 'book ' + (diaryIsLocked ? 'closed' : 'open');
    book.id = 'diaryBook';
    book.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.6s cubic-bezier(0.4,0.2,0.2,1);box-shadow:0 25px 50px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.1) inset;border-radius:16px 4px 4px 16px;';
    book.style.transform = diaryIsLocked ? 'rotateY(-2deg) rotateX(1deg)' : 'rotateY(8deg) rotateX(1deg)';
    
    // COVER FRONT
    var coverFront = document.createElement('div');
    coverFront.className = 'book-cover book-cover-front';
    coverFront.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;text-align:center;box-sizing:border-box;border:1px solid rgba(255,255,255,0.1);z-index:10;background:linear-gradient(145deg,#1a3a5c,#0d2844);background-image:radial-gradient(circle at 30% 35%,#2a5a7a 1px,transparent 1px),radial-gradient(circle at 70% 75%,#2a5a7a 1px,transparent 1px);background-size:48px 48px;box-shadow:inset 0 0 0 1px #3a6a8a,inset 0 0 40px rgba(0,20,40,0.6);color:#e8f0f8;';
    coverFront.innerHTML = '<div style="position:absolute;inset:20px;border:1px solid rgba(180,215,255,0.2);border-radius:12px;pointer-events:none;"></div>' +
        '<div style="font-size:3rem;margin-bottom:0.2rem;">📘</div>' +
        '<div class="user-name-display" id="coverUserName" style="font-size:2rem;font-weight:400;letter-spacing:2px;border-bottom:1px solid rgba(180,215,255,0.2);padding-bottom:6px;margin-bottom:4px;">' + (diaryUserName || '—') + '</div>' +
        '<div style="font-size:1.6rem;letter-spacing:8px;font-weight:300;color:#8ab4d0;">diary</div>' +
        '<div class="cover-sub" style="font-size:0.8rem;opacity:0.5;font-weight:300;letter-spacing:4px;">· private ·</div>' +
        '<div style="margin-top:14px;font-size:0.65rem;border-top:1px solid rgba(180,215,255,0.15);padding-top:10px;width:50%;letter-spacing:2px;opacity:0.4;">✦ ' + (diaryIsLocked ? 'locked pages' : 'open pages') + ' ✦</div>';
    
    // COVER BACK
    var coverBack = document.createElement('div');
    coverBack.className = 'book-cover book-cover-back';
    coverBack.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;transform:rotateY(180deg);background:linear-gradient(145deg,#0d2844,#081a2e);box-shadow:inset 0 0 50px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
    coverBack.innerHTML = '<span style="font-size:2rem;letter-spacing:8px;color:#4a7a9a;opacity:0.3;">✦ diary ✦</span>';
    
    // SPINE
    var spine = document.createElement('div');
    spine.className = 'book-spine';
    spine.style.cssText = 'position:absolute;left:-8px;top:6px;width:16px;height:96%;background:#0a1e32;border-radius:8px 2px 2px 8px;box-shadow:inset -2px 0 10px rgba(0,0,0,0.8),inset 2px 0 4px #3a6a8a;transform:rotateY(0deg) translateZ(2px);z-index:20;border-left:1px solid #3a6a8a;';
    
    // PAGES
    var bookPages = document.createElement('div');
    bookPages.className = 'book-pages';
    bookPages.id = 'bookPages';
    bookPages.style.cssText = 'position:absolute;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden;border-radius:12px 2px 2px 12px;background:#f8f5f0;box-shadow:inset 0 0 0 1px #d0c8b8,inset 0 0 30px rgba(100,80,60,0.06);padding:2rem 2.5rem;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Georgia,Times New Roman,serif;color:#2a241e;line-height:1.7;';
    
    if (diaryIsLocked) {
        bookPages.style.transform = 'rotateY(-180deg)';
        bookPages.style.boxShadow = 'inset 0 0 0 1px #c6b8a4,inset 0 0 40px rgba(0,0,0,0.2)';
    }
    
    // Ruled lines
    var ruledLines = document.createElement('div');
    ruledLines.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(transparent 0px,transparent 27px,#ece6dc 27px,#ece6dc 28px);opacity:0.25;pointer-events:none;';
    bookPages.appendChild(ruledLines);
    
    // Page content
    var pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.cssText = 'position:relative;z-index:5;height:100%;display:flex;flex-direction:column;justify-content:space-between;';
    
    // Header
    var header = document.createElement('div');
    header.className = 'diary-header';
    header.style.cssText = 'border-bottom:1px solid #d0c8b8;padding-bottom:0.4rem;margin-bottom:0.8rem;display:flex;justify-content:space-between;font-size:0.8rem;font-weight:400;letter-spacing:0.5px;color:#7a6e5e;text-transform:uppercase;';
    header.innerHTML = '<span id="pageDate">📅 —</span><span id="pageTime">✎ <span contenteditable="false" id="timeInput">entry</span></span>';
    
    // Diary entry
    var entry = document.createElement('div');
    entry.className = 'diary-entry';
    entry.id = 'diaryEntryContent';
    entry.contentEditable = 'false';
    entry.spellcheck = true;
    entry.style.cssText = 'flex:1;font-size:1.05rem;background:rgba(255,250,240,0.4);padding:0.8rem 1rem;border-radius:12px;box-shadow:inset 0 1px 4px rgba(0,0,0,0.02);overflow-y:auto;border-left:3px solid #c6b8a4;font-weight:400;color:#2c241c;min-height:70px;outline:none;cursor:text;user-select:text;white-space:pre-wrap;word-wrap:break-word;line-height:1.8;';
    
    // Footer
    var footer = document.createElement('div');
    footer.className = 'diary-footer';
    footer.style.cssText = 'margin-top:0.8rem;display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:#8f826e;border-top:1px solid #ddd6c8;padding-top:0.5rem;font-weight:400;letter-spacing:0.3px;';
    footer.innerHTML = '<span class="edit-hint" id="editHint" style="font-size:0.65rem;color:#a0907a;opacity:0.6;">🔒 locked</span>' +
        '<button class="btn-sm" onclick="saveDiaryEntry()" style="font-size:10px;margin-left:8px;background:#4a7a9a;color:#fff;border:none;padding:4px 12px;border-radius:20px;cursor:pointer;">💾 Save</button>' +
        '<div class="page-nav" style="display:flex;gap:10px;align-items:center;">' +
        '<button id="prevPage" disabled style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.75rem;padding:4px 16px;border-radius:30px;cursor:pointer;">◀ prev</button>' +
        '<span class="page-indicator" id="pageIndicator" style="font-size:0.75rem;color:#6a5e4e;min-width:50px;text-align:center;">1 / ' + diaryPages.length + '</span>' +
        '<button id="nextPage" style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.75rem;padding:4px 16px;border-radius:30px;cursor:pointer;">+ new ▶</button>' +
        '</div>';
    
    pageContent.appendChild(header);
    pageContent.appendChild(entry);
    pageContent.appendChild(footer);
    bookPages.appendChild(pageContent);
    
    // LOCK AREA - bottom middle
    var lockArea = document.createElement('div');
    lockArea.className = 'lock-area';
    lockArea.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(10,20,35,0.85);backdrop-filter:blur(8px);padding:10px 24px 12px;border-radius:40px 40px 28px 28px;border:1px solid rgba(180,215,255,0.2);box-shadow:0 4px 20px rgba(0,0,0,0.4);pointer-events:auto;';
    lockArea.innerHTML = '<div class="lock-icon" id="lockIcon" style="font-size:1.6rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));background:#4a7a9a;padding:0 14px;border-radius:20px;line-height:1.2;box-shadow:inset 0 -2px 0 #1a3a5c;cursor:pointer;color:#e8f0f8;">' + (diaryIsLocked ? '🔒' : '🔓') + '</div>' +
        '<button class="lock-btn" id="lockToggle" style="background:#4a7a9a;border:none;color:#e8f0f8;font-size:0.7rem;padding:5px 18px;border-radius:20px;cursor:pointer;letter-spacing:1px;text-transform:uppercase;box-shadow:0 2px 0 #1a3a5c;">' + (diaryIsLocked ? 'unlock' : 'lock') + '</button>' +
        '<span class="lock-status" id="lockStatus" style="font-size:0.5rem;color:#e8f0f8;background:#0a1e32;padding:2px 12px;border-radius:12px;border:1px solid #3a6a8a;">' + (diaryIsLocked ? 'locked' : 'unlocked') + '</span>';
    
    // PIN MODAL
    var pinModal = document.createElement('div');
    pinModal.className = 'pin-modal';
    pinModal.id = 'pinModal';
    pinModal.style.cssText = 'position:absolute;inset:0;z-index:50;background:rgba(10,20,35,0.85);backdrop-filter:blur(8px);display:' + (!diaryPin ? 'flex' : 'none') + ';justify-content:center;align-items:center;border-radius:16px 4px 4px 16px;padding:2rem;';
    pinModal.innerHTML = '<div class="pin-box" style="background:#f0ece6;padding:2rem 2.2rem;border-radius:24px;box-shadow:0 30px 50px rgba(0,0,0,0.5);text-align:center;max-width:340px;width:100%;border:1px solid #c6d0dc;">' +
        '<h2 style="color:#1a3a5c;font-weight:400;letter-spacing:1px;margin-bottom:0.2rem;font-size:1.4rem;">🔐 ' + (!diaryPin ? 'set PIN' : 'enter PIN') + '</h2>' +
        '<p style="color:#5a6a7a;font-size:0.8rem;margin-bottom:1rem;">4-digit code for your diary</p>' +
        '<div class="pin-input-group" style="display:flex;gap:10px;justify-content:center;margin-bottom:1rem;">' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#1a3a5c;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#1a3a5c;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#1a3a5c;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#1a3a5c;outline:none;" />' +
        '</div>' +
        '<button class="pin-submit" id="pinSubmit" style="background:#4a7a9a;border:none;color:#e8f0f8;font-size:0.85rem;padding:10px 20px;border-radius:40px;cursor:pointer;letter-spacing:1px;box-shadow:0 3px 0 #1a3a5c;width:100%;">' + (!diaryPin ? 'set PIN & open' : 'unlock') + '</button>' +
        '<div class="pin-error" id="pinError" style="color:#b55a4a;font-size:0.75rem;margin-top:0.4rem;min-height:1.2rem;"></div>' +
        '</div>';
    
    // Assemble book
    book.appendChild(coverFront);
    book.appendChild(coverBack);
    book.appendChild(spine);
    book.appendChild(bookPages);
    book.appendChild(lockArea);
    book.appendChild(pinModal);
    wrapper.appendChild(book);
    container.appendChild(wrapper);
    
    // Render current page
    renderDiaryPage(diaryCurrentPage);
    
    // Setup events
    setupDiaryEvents(book, wrapper, pinModal);
}

// ============================================================
// RENDER DIARY PAGE
// ============================================================
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
        if (diaryEntry) { diaryEntry.contentEditable = 'true'; timeInput.contentEditable = 'true'; diaryEntry.style.borderLeftColor = '#4a7a9a'; diaryEntry.style.cursor = 'text'; }
        if (editHint) editHint.textContent = '✎ click to edit';
    } else {
        if (diaryEntry) { diaryEntry.contentEditable = 'false'; timeInput.contentEditable = 'false'; diaryEntry.style.borderLeftColor = '#c6b8a4'; diaryEntry.style.cursor = 'default'; }
        if (editHint) editHint.textContent = page.editable === false ? '🔒 sample page' : '🔒 locked';
    }
}

// ============================================================
// SETUP DIARY EVENTS
// ============================================================
function setupDiaryEvents(book, wrapper, pinModal) {
    function toggleLock() {
        if (diaryIsLocked) {
            if (!diaryPin) { pinModal.style.display = 'flex'; return; }
            diaryIsLocked = false;
            isOpening = true;
            book.classList.add('opening');
            setTimeout(function() {
                book.classList.remove('opening', 'closed');
                book.classList.add('open');
                isOpening = false;
                updateDiaryUI(book);
            }, 900);
            showDiaryToast('🔓 Diary unlocked · you can edit');
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
    
    // PIN inputs
    var pinInputs = pinModal.querySelectorAll('.pin-digit');
    pinInputs.forEach(function(inp, idx) {
        inp.addEventListener('input', function() { if (this.value.length === 1 && idx < 3) pinInputs[idx + 1].focus(); });
        inp.addEventListener('keydown', function(e) { if (e.key === 'Backspace' && this.value === '' && idx > 0) pinInputs[idx - 1].focus(); if (e.key === 'Enter') document.getElementById('pinSubmit').click(); });
    });
    
    document.getElementById('pinSubmit').addEventListener('click', function() {
        var code = '';
        pinInputs.forEach(function(inp) { if (inp.value && /[0-9]/.test(inp.value)) code += inp.value; });
        var pinError = document.getElementById('pinError');
        if (code.length !== 4) { if (pinError) pinError.textContent = '❌ enter exactly 4 digits'; return; }
        
        if (!diaryPin) {
            diaryPin = code;
            localStorage.setItem('winchu_diary_pin', diaryPin);
            pinModal.style.display = 'none';
            diaryIsLocked = false;
            isOpening = true;
            book.classList.add('opening');
            setTimeout(function() { book.classList.remove('opening', 'closed'); book.classList.add('open'); isOpening = false; updateDiaryUI(book); }, 900);
            pinInputs.forEach(function(inp) { inp.value = ''; });
            showDiaryToast('🔓 PIN set · diary open for editing');
        } else if (code === diaryPin) {
            pinModal.style.display = 'none';
            diaryIsLocked = false;
            isOpening = true;
            book.classList.add('opening');
            setTimeout(function() { book.classList.remove('opening', 'closed'); book.classList.add('open'); isOpening = false; updateDiaryUI(book); }, 900);
            pinInputs.forEach(function(inp) { inp.value = ''; });
            showDiaryToast('🔓 Diary unlocked');
        } else {
            if (pinError) pinError.textContent = '❌ incorrect PIN';
            pinInputs.forEach(function(inp) { inp.value = ''; });
            pinInputs[0].focus();
        }
    });
    
    // Save on input
    var diaryEntry = document.getElementById('diaryEntryContent');
    if (diaryEntry) {
        var saveTimeout;
        diaryEntry.addEventListener('input', function() { if (diaryIsLocked) return; clearTimeout(saveTimeout); saveTimeout = setTimeout(function() { saveCurrentDiaryEntry(); }, 500); });
    }
}

// ============================================================
// UPDATE DIARY UI
// ============================================================
function updateDiaryUI(book) {
    var lockIcon = document.getElementById('lockIcon');
    var lockStatus = document.getElementById('lockStatus');
    var lockToggle = document.getElementById('lockToggle');
    
    if (diaryIsLocked) {
        book.classList.remove('open'); book.classList.add('closed');
        if (lockIcon) lockIcon.textContent = '🔒';
        if (lockStatus) lockStatus.textContent = 'locked';
        if (lockToggle) lockToggle.textContent = 'unlock';
    } else {
        book.classList.remove('closed'); book.classList.add('open');
        if (lockIcon) lockIcon.textContent = '🔓';
        if (lockStatus) lockStatus.textContent = 'unlocked';
        if (lockToggle) lockToggle.textContent = 'lock';
    }
    renderDiaryPage(diaryCurrentPage);
}

// ============================================================
// NAVIGATE DIARY PAGE
// ============================================================
function navigateDiaryPage(direction) {
    if (diaryIsLocked) return;
    saveCurrentDiaryEntry();
    var newIndex = diaryCurrentPage + direction;
    if (newIndex >= diaryPages.length) {
        var now = new Date();
        diaryPages.push({
            date: '📅 ' + now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: 'entry',
            content: '<p style="color:#9a8a7a;font-style:italic;">— write your thoughts here —</p>',
            editable: true,
            rawDate: now.toISOString()
        });
    }
    if (newIndex < 0) return;
    diaryCurrentPage = newIndex;
    renderDiaryPage(diaryCurrentPage);
    updateDiaryUI(document.getElementById('diaryBook'));
}

// ============================================================
// SAVE DIARY ENTRY
// ============================================================
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
    
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = entry.content;
    var textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    var diaryEntry = { content: textContent.trim(), mood: entry.time || '—', date: entry.rawDate || new Date().toISOString() };
    S.diary.unshift(diaryEntry);
    db.ref('diary/' + S.username).push(diaryEntry);
    saveState();
    showDiaryToast('📝 Entry saved to cloud');
}

function showDiaryToast(msg) {
    var t = document.getElementById('diaryToast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.style.opacity = '0'; }, 2200);
}

// Init on page navigation
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

console.log('📖 Diary module loaded - Blue Book Design');