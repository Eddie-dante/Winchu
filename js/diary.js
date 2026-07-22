// Diary Module - Shimmering Blue Book with PIN, editable pages, and new page creation

var diaryPin = null;
var diaryIsLocked = true;
var diaryCurrentPage = 0;
var diaryPages = [];
var diaryUserName = '';

// Initialize diary
function initDiary() {
    var savedPin = localStorage.getItem('winchu_diary_pin');
    if (savedPin) diaryPin = savedPin;
    
    diaryUserName = S.name || S.username || '';
    loadDiaryEntries();
    renderDiaryBook();
}

// Load diary entries from state
function loadDiaryEntries() {
    diaryPages = [];
    
    if (S.diary && S.diary.length > 0) {
        S.diary.forEach(function(entry, index) {
            var date = new Date(entry.date);
            var dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            var timeOfDay = entry.mood && entry.mood !== '—' ? entry.mood : 'entry';
            
            var contentHTML = '<p>Dear Diary,</p>';
            contentHTML += '<p>' + escapeHtml(entry.content) + '</p>';
            if (entry.mood && entry.mood !== '—') {
                contentHTML += '<p style="margin-top:0.6rem; color:#4a6a7a; font-style:italic;">Mood: ' + escapeHtml(entry.mood) + '</p>';
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

// Render the diary book
function renderDiaryBook() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    
    var coverName = document.getElementById('coverUserName');
    if (coverName) coverName.textContent = diaryUserName || '—';
    
    container.innerHTML = '';
    
    // Book wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'book-wrapper';
    wrapper.style.cssText = 'width:100%;max-width:820px;aspect-ratio:3/2;perspective:2500px;cursor:default;margin:0 auto;';
    
    // Book
    var book = document.createElement('div');
    book.className = 'book ' + (diaryIsLocked ? 'closed' : 'open');
    book.id = 'diaryBook';
    book.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.8s cubic-bezier(0.4,0.2,0.2,1);box-shadow:0 30px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.1) inset;border-radius:16px 4px 4px 16px;';
    
    if (diaryIsLocked) {
        book.style.transform = 'rotateY(-2deg) rotateX(1deg)';
    } else {
        book.style.transform = 'rotateY(8deg) rotateX(1deg)';
    }
    
    // Cover Front
    var coverFront = document.createElement('div');
    coverFront.className = 'book-cover book-cover-front';
    coverFront.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;text-align:center;box-sizing:border-box;border:1px solid rgba(255,255,255,0.08);z-index:10;background:linear-gradient(145deg,#0a1e3a,#0d2a4a,#0a1e3a);background-size:200% 200%;animation:shimmerBlue 4s ease-in-out infinite;box-shadow:inset 0 0 0 1px rgba(100,180,255,0.2),inset 0 0 60px rgba(30,80,150,0.3),0 0 40px rgba(30,80,180,0.15);color:#e8f0f8;position:relative;overflow:hidden;';
    coverFront.innerHTML = '<div class="shimmer-overlay" style="position:absolute;inset:0;background:linear-gradient(105deg,transparent 0%,transparent 30%,rgba(255,255,255,0.05) 45%,rgba(200,230,255,0.1) 50%,rgba(255,255,255,0.05) 55%,transparent 70%,transparent 100%);background-size:300% 100%;animation:shimmerMove 6s ease-in-out infinite;pointer-events:none;border-radius:16px 4px 4px 16px;"></div>' +
        '<div style="position:absolute;inset:20px;border:1px solid rgba(100,200,255,0.15);border-radius:12px;pointer-events:none;box-shadow:inset 0 0 30px rgba(60,150,255,0.05);"></div>' +
        '<div style="font-size:3rem;margin-bottom:0.2rem;filter:drop-shadow(0 0 30px rgba(60,150,255,0.2));z-index:1;">📘</div>' +
        '<div class="user-name-display" id="coverUserName" style="font-size:2.2rem;font-weight:400;letter-spacing:3px;border-bottom:1px solid rgba(100,200,255,0.15);padding-bottom:6px;margin-bottom:4px;font-family:Playfair Display,serif;text-shadow:0 0 30px rgba(60,150,255,0.2);z-index:1;">' + (diaryUserName || '—') + '</div>' +
        '<div class="cover-title" style="font-family:Mr De Haviland,Playfair Display,cursive;font-size:3.5rem;color:#c8e4f0;text-shadow:0 0 40px rgba(60,180,255,0.3),0 0 80px rgba(60,150,255,0.1);letter-spacing:2px;margin-bottom:-0.2rem;z-index:1;">diary</div>' +
        '<div class="cover-sub" style="font-size:0.8rem;opacity:0.4;font-weight:300;letter-spacing:5px;font-family:Playfair Display,serif;text-shadow:0 0 20px rgba(60,150,255,0.1);z-index:1;">· private ·</div>' +
        '<div style="margin-top:14px;font-size:0.65rem;border-top:1px solid rgba(100,200,255,0.1);padding-top:10px;width:50%;letter-spacing:2px;opacity:0.3;font-family:Playfair Display,serif;z-index:1;">✦ ' + (diaryIsLocked ? 'locked pages' : 'open pages') + ' ✦</div>';
    
    // Cover Back
    var coverBack = document.createElement('div');
    coverBack.className = 'book-cover book-cover-back';
    coverBack.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;display:flex;align-items:center;justify-content:center;transform:rotateY(180deg);background:linear-gradient(145deg,#06142a,#0a1e3a);box-shadow:inset 0 0 50px rgba(0,0,0,0.7);';
    coverBack.innerHTML = '<span style="font-size:2rem;letter-spacing:8px;color:#4a8aaa;opacity:0.2;font-weight:300;">✦ diary ✦</span>';
    
    // Spine
    var spine = document.createElement('div');
    spine.className = 'book-spine';
    spine.style.cssText = 'position:absolute;left:-8px;top:6px;width:16px;height:96%;background:#06142a;border-radius:8px 2px 2px 8px;box-shadow:inset -2px 0 10px rgba(0,0,0,0.8),inset 2px 0 4px #4a8aaa;transform:rotateY(0deg) translateZ(2px);z-index:20;border-left:1px solid #4a8aaa;';
    
    // Pages
    var bookPages = document.createElement('div');
    bookPages.className = 'book-pages';
    bookPages.id = 'bookPages';
    bookPages.style.cssText = 'position:absolute;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden;border-radius:12px 2px 2px 12px;background:#f8f5f0;box-shadow:inset 0 0 0 1px #d0c8b8,inset 0 0 30px rgba(100,80,60,0.06);padding:2rem 2.5rem;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Cormorant Garamond,Georgia,serif;color:#2a241e;line-height:1.8;';
    
    if (diaryIsLocked) {
        bookPages.style.transform = 'rotateY(-180deg)';
        bookPages.style.boxShadow = 'inset 0 0 0 1px #c6b8a4,inset 0 0 40px rgba(0,0,0,0.2)';
    }
    
    // Ruled lines
    var ruledLines = document.createElement('div');
    ruledLines.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(transparent 0px,transparent 27px,#ece6dc 27px,#ece6dc 28px);opacity:0.2;pointer-events:none;';
    bookPages.appendChild(ruledLines);
    
    // Page content
    var pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.cssText = 'position:relative;z-index:5;height:100%;display:flex;flex-direction:column;justify-content:space-between;';
    
    // Header
    var header = document.createElement('div');
    header.className = 'diary-header';
    header.style.cssText = 'border-bottom:1px solid #d0c8b8;padding-bottom:0.4rem;margin-bottom:0.8rem;display:flex;justify-content:space-between;font-size:0.85rem;font-weight:400;letter-spacing:0.5px;color:#7a6e5e;text-transform:uppercase;font-family:Playfair Display,serif;font-style:italic;';
    header.innerHTML = '<span id="pageDate">📅 —</span><span id="pageTime">✎ <span contenteditable="false" id="timeInput">entry</span></span>';
    
    // Entry
    var entry = document.createElement('div');
    entry.className = 'diary-entry';
    entry.id = 'diaryEntryContent';
    entry.contentEditable = 'false';
    entry.spellcheck = true;
    entry.style.cssText = 'flex:1;font-size:1.2rem;font-family:Cormorant Garamond,Georgia,serif;background:rgba(255,250,240,0.3);padding:0.8rem 1rem;border-radius:12px;box-shadow:inset 0 1px 4px rgba(0,0,0,0.02);overflow-y:auto;border-left:3px solid #c6b8a4;font-weight:400;color:#2c241c;min-height:70px;outline:none;cursor:text;user-select:text;white-space:pre-wrap;word-wrap:break-word;line-height:2;';
    
    // Footer
    var footer = document.createElement('div');
    footer.className = 'diary-footer';
    footer.style.cssText = 'margin-top:0.8rem;display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:#8f826e;border-top:1px solid #ddd6c8;padding-top:0.5rem;font-weight:400;letter-spacing:0.3px;font-family:Playfair Display,serif;';
    footer.innerHTML = '<span class="edit-hint" id="editHint" style="font-size:0.7rem;color:#a0907a;font-weight:400;letter-spacing:0.5px;opacity:0.6;font-family:Playfair Display,serif;font-style:italic;">🔒 locked</span>' +
        '<div class="page-nav" style="display:flex;gap:10px;align-items:center;">' +
        '<button id="prevPage" disabled style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-weight:400;font-size:0.8rem;padding:4px 16px;border-radius:30px;cursor:pointer;font-family:Playfair Display,serif;transition:all 0.15s;letter-spacing:0.3px;background:rgba(255,250,240,0.3);backdrop-filter:blur(2px);">◀ prev</button>' +
        '<span class="page-indicator" id="pageIndicator" style="font-size:0.8rem;font-weight:400;color:#6a5e4e;min-width:50px;text-align:center;font-family:Playfair Display,serif;">1 / ' + diaryPages.length + '</span>' +
        '<button id="nextPage" style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-weight:400;font-size:0.8rem;padding:4px 16px;border-radius:30px;cursor:pointer;font-family:Playfair Display,serif;transition:all 0.15s;letter-spacing:0.3px;background:rgba(255,250,240,0.3);backdrop-filter:blur(2px);">+ new page ▶</button>' +
        '</div>';
    
    // Save button
    var saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save';
    saveBtn.style.cssText = 'background:#1a4a6a;border:none;color:#e8f0f8;font-weight:400;font-size:0.7rem;padding:5px 14px;border-radius:20px;cursor:pointer;font-family:Playfair Display,serif;letter-spacing:1px;transition:0.12s;border:1px solid rgba(100,200,255,0.1);box-shadow:0 2px 0 #0a2a4a;margin-left:8px;';
    saveBtn.onclick = function(e) { e.stopPropagation(); saveDiaryEntry(); };
    footer.querySelector('.edit-hint').after(saveBtn);
    
    pageContent.appendChild(header);
    pageContent.appendChild(entry);
    pageContent.appendChild(footer);
    bookPages.appendChild(pageContent);
    
    // Lock area
    var lockArea = document.createElement('div');
    lockArea.className = 'lock-area';
    lockArea.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(6,20,42,0.9);backdrop-filter:blur(8px);padding:10px 24px 12px;border-radius:40px 40px 28px 28px;border:1px solid rgba(100,200,255,0.15);box-shadow:0 4px 20px rgba(0,0,0,0.4),inset 0 0 20px rgba(60,150,255,0.05);pointer-events:auto;';
    lockArea.innerHTML = '<div class="lock-icon" id="lockIcon" style="font-size:1.6rem;filter:drop-shadow(0 2px 8px rgba(60,150,255,0.3));background:#1a4a6a;padding:0 14px;border-radius:20px;line-height:1.2;box-shadow:inset 0 -2px 0 #0a2a4a,0 0 20px rgba(60,150,255,0.1);cursor:pointer;transition:0.15s;color:#e8f0f8;">' + (diaryIsLocked ? '🔒' : '🔓') + '</div>' +
        '<button class="lock-btn" id="lockToggle" style="background:#1a4a6a;border:none;color:#e8f0f8;font-weight:400;font-size:0.7rem;padding:5px 18px;border-radius:20px;cursor:pointer;font-family:Playfair Display,serif;letter-spacing:1px;text-transform:uppercase;transition:0.12s;border:1px solid rgba(100,200,255,0.1);box-shadow:0 2px 0 #0a2a4a,0 0 15px rgba(60,150,255,0.05);">' + (diaryIsLocked ? 'unlock' : 'lock') + '</button>' +
        '<span class="lock-status" id="lockStatus" style="font-size:0.5rem;font-weight:400;color:#e8f0f8;background:#06142a;padding:2px 12px;border-radius:12px;border:1px solid #4a8aaa;letter-spacing:0.5px;text-transform:uppercase;font-family:Playfair Display,serif;">' + (diaryIsLocked ? 'locked' : 'unlocked') + '</span>';
    
    // PIN Modal
    var pinModal = document.createElement('div');
    pinModal.className = 'pin-modal';
    pinModal.id = 'pinModal';
    pinModal.style.cssText = 'position:absolute;inset:0;z-index:50;background:rgba(6,20,42,0.9);backdrop-filter:blur(8px);display:' + (!diaryPin ? 'flex' : 'none') + ';justify-content:center;align-items:center;border-radius:16px 4px 4px 16px;padding:2rem;';
    pinModal.innerHTML = '<div class="pin-box" style="background:#f0ece6;padding:2rem 2.2rem;border-radius:24px;box-shadow:0 30px 50px rgba(0,0,0,0.5),0 0 0 1px rgba(100,200,255,0.2);text-align:center;max-width:340px;width:100%;border:1px solid #c6d0dc;">' +
        '<h2 style="color:#0a1e3a;font-family:Playfair Display,serif;font-weight:400;letter-spacing:1px;margin-bottom:0.2rem;font-size:1.6rem;">🔐 ' + (!diaryPin ? 'set PIN' : 'enter PIN') + '</h2>' +
        '<p style="color:#5a6a7a;font-size:0.9rem;margin-bottom:1rem;font-weight:400;">4-digit code for your diary</p>' +
        '<div class="pin-input-group" style="display:flex;gap:10px;justify-content:center;margin-bottom:1rem;">' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="0" style="width:48px;height:56px;text-align:center;font-size:1.6rem;font-family:Playfair Display,serif;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#0a1e3a;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="1" style="width:48px;height:56px;text-align:center;font-size:1.6rem;font-family:Playfair Display,serif;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#0a1e3a;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="2" style="width:48px;height:56px;text-align:center;font-size:1.6rem;font-family:Playfair Display,serif;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#0a1e3a;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="3" style="width:48px;height:56px;text-align:center;font-size:1.6rem;font-family:Playfair Display,serif;border:1px solid #b0bcc8;border-radius:12px;background:#fff;color:#0a1e3a;outline:none;" />' +
        '</div>' +
        '<button class="pin-submit" id="pinSubmit" style="background:#1a4a6a;border:none;color:#e8f0f8;font-weight:400;font-size:0.9rem;padding:10px 20px;border-radius:40px;cursor:pointer;font-family:Playfair Display,serif;letter-spacing:1px;transition:0.12s;border:1px solid rgba(255,255,255,0.1);box-shadow:0 3px 0 #0a2a4a;width:100%;">' + (!diaryPin ? 'set PIN & open' : 'unlock') + '</button>' +
        '<div class="pin-error" id="pinError" style="color:#b55a4a;font-size:0.8rem;margin-top:0.4rem;min-height:1.2rem;font-weight:400;"></div>' +
        '</div>';
    
    // Assemble
    book.appendChild(coverFront);
    book.appendChild(coverBack);
    book.appendChild(spine);
    book.appendChild(bookPages);
    book.appendChild(lockArea);
    book.appendChild(pinModal);
    wrapper.appendChild(book);
    container.appendChild(wrapper);
    
    // Render page
    renderDiaryPage(diaryCurrentPage);
    
    // Setup events
    setupDiaryEvents(book, wrapper, pinModal);
}

// Render page
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
    if (nextBtn) nextBtn.textContent = index === diaryPages.length - 1 ? '+ new page ▶' : 'next ▶';
    
    // Set editable state
    if (!diaryIsLocked && page.editable !== false) {
        if (diaryEntry) {
            diaryEntry.contentEditable = 'true';
            diaryEntry.style.borderLeftColor = '#4a7a9a';
            diaryEntry.style.cursor = 'text';
        }
        if (timeInput) timeInput.contentEditable = 'true';
        if (editHint) editHint.textContent = '✎ click to edit';
    } else {
        if (diaryEntry) {
            diaryEntry.contentEditable = 'false';
            diaryEntry.style.borderLeftColor = '#c6b8a4';
            diaryEntry.style.cursor = 'default';
        }
        if (timeInput) timeInput.contentEditable = 'false';
        if (editHint) editHint.textContent = page.editable === false ? '🔒 sample page' : '🔒 locked';
    }
}

// Setup events
function setupDiaryEvents(book, wrapper, pinModal) {
    var lockToggle = document.getElementById('lockToggle');
    var lockIcon = document.getElementById('lockIcon');
    
    function toggleLock() {
        if (diaryIsLocked) {
            if (!diaryPin) { pinModal.style.display = 'flex'; return; }
            diaryIsLocked = false;
            openBookWithAnimation(book);
            setTimeout(function() { showDiaryToast('🔓 Diary unlocked · you can edit'); }, 600);
        } else {
            saveCurrentDiaryEntry();
            diaryIsLocked = true;
            book.classList.remove('open'); book.classList.add('closed');
            book.style.transform = 'rotateY(-2deg) rotateX(1deg)';
            updateDiaryUI(book);
            showDiaryToast('🔒 Diary locked');
        }
    }
    
    if (lockToggle) lockToggle.addEventListener('click', toggleLock);
    if (lockIcon) lockIcon.addEventListener('click', toggleLock);
    
    // Page navigation
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.addEventListener('click', function() { navigateDiaryPage(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { navigateDiaryPage(1); });
    
    // PIN
    var pinInputs = pinModal.querySelectorAll('.pin-digit');
    pinInputs.forEach(function(inp, idx) {
        inp.addEventListener('input', function() {
            if (this.value.length === 1 && idx < 3) pinInputs[idx + 1].focus();
        });
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && idx > 0) pinInputs[idx - 1].focus();
            if (e.key === 'Enter') document.getElementById('pinSubmit').click();
        });
    });
    
    var pinSubmit = document.getElementById('pinSubmit');
    if (pinSubmit) {
        pinSubmit.addEventListener('click', function() {
            var code = '';
            pinInputs.forEach(function(inp) { if (inp.value && /[0-9]/.test(inp.value)) code += inp.value; });
            var pinError = document.getElementById('pinError');
            
            if (code.length !== 4) { if (pinError) pinError.textContent = '❌ enter exactly 4 digits'; return; }
            
            if (!diaryPin) {
                diaryPin = code;
                localStorage.setItem('winchu_diary_pin', diaryPin);
                if (pinError) pinError.textContent = '';
                pinModal.style.display = 'none';
                diaryIsLocked = false;
                openBookWithAnimation(book);
                pinInputs.forEach(function(inp) { inp.value = ''; });
                showDiaryToast('🔓 PIN set · diary open for editing');
            } else {
                if (code === diaryPin) {
                    if (pinError) pinError.textContent = '';
                    pinModal.style.display = 'none';
                    diaryIsLocked = false;
                    openBookWithAnimation(book);
                    pinInputs.forEach(function(inp) { inp.value = ''; });
                    showDiaryToast('🔓 Diary unlocked');
                } else {
                    if (pinError) pinError.textContent = '❌ incorrect PIN';
                    pinInputs.forEach(function(inp) { inp.value = ''; });
                    pinInputs[0].focus();
                }
            }
        });
    }
    
    // Mouse tilt
    wrapper.addEventListener('mousemove', function(e) {
        var rect = wrapper.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotY = 6 + x * 12;
        var rotX = 1 + y * 4;
        if (diaryIsLocked) book.style.transform = 'rotateY(' + (rotY - 2) + 'deg) rotateX(' + rotX + 'deg)';
        else book.style.transform = 'rotateY(' + (rotY + 4) + 'deg) rotateX(' + rotX + 'deg)';
    });
    
    wrapper.addEventListener('mouseleave', function() {
        book.style.transform = diaryIsLocked ? 'rotateY(-2deg) rotateX(1deg)' : 'rotateY(8deg) rotateX(1deg)';
    });
    
    // Save entry on input
    var diaryEntry = document.getElementById('diaryEntryContent');
    if (diaryEntry) {
        var saveTimeout;
        diaryEntry.addEventListener('input', function() {
            if (diaryIsLocked) return;
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() { saveCurrentDiaryEntry(); }, 500);
        });
    }
}

// Open book animation
function openBookWithAnimation(book) {
    book.classList.add('opening');
    setTimeout(function() {
        book.classList.remove('opening');
        book.classList.remove('closed');
        book.classList.add('open');
        book.style.transform = 'rotateY(8deg) rotateX(1deg)';
        updateDiaryUI(book);
    }, 1000);
}

// Update UI
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

// Navigate
function navigateDiaryPage(direction) {
    if (diaryIsLocked) return;
    saveCurrentDiaryEntry();
    var newIndex = diaryCurrentPage + direction;
    if (newIndex >= diaryPages.length) {
        // Add new page
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

// Save entry
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

// Save to Firebase
function saveDiaryEntry() {
    saveCurrentDiaryEntry();
    if (!S.username || diaryIsLocked) return;
    var entry = diaryPages[diaryCurrentPage];
    if (!entry || entry.editable === false) return;
    
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = entry.content;
    var textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    var diaryEntry = {
        content: textContent.trim(),
        mood: entry.time || '—',
        date: entry.rawDate || new Date().toISOString()
    };
    
    S.diary.unshift(diaryEntry);
    db.ref('diary/' + S.username).push(diaryEntry);
    saveState();
    showDiaryToast('📝 Entry saved to cloud');
}

// Toast
function showDiaryToast(msg) {
    var t = document.getElementById('diaryToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'diaryToast';
        t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#06142a;color:#e8f0f8;padding:10px 28px;border-radius:40px;font-size:0.9rem;box-shadow:0 6px 20px rgba(0,0,0,0.3),0 0 30px rgba(60,150,255,0.05);border:1px solid #4a8aaa;opacity:0;transition:opacity 0.3s;z-index:9999;pointer-events:none;white-space:nowrap;';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.style.opacity = '0'; }, 2200);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.classList.contains('active')) initDiary();
            });
        });
        observer.observe(diaryPage, { attributes: true, attributeFilter: ['class'] });
    }
});

window.renderDiary = function() { loadDiaryEntries(); renderDiaryBook(); };
window.saveDiary = saveDiaryEntry;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - Shimmering Blue Book');