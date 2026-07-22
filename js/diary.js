// Diary Module - Book-style with openable cover and PIN protection

var diaryPin = null;
var diaryIsLocked = true;
var diaryCurrentPage = 0;
var diaryPages = [];
var diaryUserName = '';

// Initialize diary
function initDiary() {
    // Load saved PIN from localStorage
    var savedPin = localStorage.getItem('winchu_diary_pin');
    if (savedPin) {
        diaryPin = savedPin;
    }
    
    // Load user name
    diaryUserName = S.name || S.username || '';
    
    // Load diary entries
    loadDiaryEntries();
    
    // Render the diary
    renderDiaryBook();
}

// Load diary entries from state
function loadDiaryEntries() {
    diaryPages = [];
    
    if (S.diary && S.diary.length > 0) {
        S.diary.forEach(function(entry, index) {
            var date = new Date(entry.date);
            var dateStr = date.toLocaleDateString('en', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            var timeStr = date.toLocaleTimeString('en', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            var timeOfDay = 'evening';
            var hour = date.getHours();
            if (hour < 12) timeOfDay = 'morning';
            else if (hour < 17) timeOfDay = 'afternoon';
            
            var contentHTML = '<p>Dear Diary,</p>';
            contentHTML += '<p>' + escapeHtml(entry.content) + '</p>';
            if (entry.mood && entry.mood !== '—') {
                contentHTML += '<p style="margin-top:0.8rem;">Mood: ' + escapeHtml(entry.mood) + '</p>';
            }
            contentHTML += '<p style="margin-top:0.8rem;">— ' + (S.name || 'Me') + '</p>';
            
            diaryPages.push({
                date: '📅 ' + dateStr,
                time: '✎ ' + timeOfDay + ' · ' + timeStr,
                content: contentHTML,
                mood: entry.mood || '—',
                rawDate: entry.date
            });
        });
    }
    
    // If no entries, add a welcome page
    if (diaryPages.length === 0) {
        diaryPages.push({
            date: '📅 ' + new Date().toLocaleDateString('en', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: '✎ welcome',
            content: '<p>Dear Diary,</p><p>This is your personal diary. A safe space for your thoughts, dreams, and memories.</p><p>Write something today. Even a single line can become a treasure tomorrow.</p><p style="margin-top:0.8rem;">— Your future self will thank you.</p>',
            mood: '✨',
            rawDate: new Date().toISOString()
        });
    }
}

// Render the complete diary book
function renderDiaryBook() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    
    // Update cover name
    var coverName = document.getElementById('coverUserName');
    if (coverName) {
        coverName.textContent = diaryUserName || '—';
    }
    
    container.innerHTML = '';
    
    // Create book wrapper
    var bookWrapper = document.createElement('div');
    bookWrapper.className = 'book-wrapper';
    bookWrapper.style.cssText = 'perspective:2000px;width:100%;max-width:820px;aspect-ratio:3/2;cursor:default;transition:filter 0.3s;margin:0 auto;';
    
    // Create book
    var book = document.createElement('div');
    book.className = 'book ' + (diaryIsLocked ? 'locked' : 'unlocked');
    book.id = 'diaryBook';
    book.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.3s cubic-bezier(0.2,0.9,0.3,1.1);box-shadow:0 30px 50px rgba(0,0,0,0.7),0 0 0 2px #5a3f28 inset;border-radius:12px 4px 4px 12px;';
    
    if (diaryIsLocked) {
        book.style.transform = 'rotateY(-4deg) rotateX(2deg)';
    } else {
        book.style.transform = 'rotateY(8deg) rotateX(1deg)';
    }
    
    // --- COVER FRONT ---
    var coverFront = document.createElement('div');
    coverFront.className = 'book-cover book-cover-front';
    coverFront.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:12px 4px 4px 12px;background:#5d3e27;background-image:radial-gradient(circle at 30% 40%,#8b6742 1px,transparent 1px),radial-gradient(circle at 70% 80%,#8b6742 1px,transparent 1px);background-size:40px 40px;box-shadow:inset 0 0 0 2px #b48b5a,inset 0 0 20px rgba(0,0,0,0.4);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;text-align:center;color:#f5e7c8;text-shadow:2px 2px 0 #2d1c0e;border:4px solid #b28b5c;box-sizing:border-box;z-index:10;';
    
    coverFront.innerHTML = '<div style="font-size:3rem;margin-bottom:0.2rem;">📖</div>' +
        '<div class="user-name-display" id="coverUserName" style="font-size:1.8rem;letter-spacing:4px;font-weight:300;border-bottom:1px solid #dbbd94;padding-bottom:6px;margin-bottom:6px;font-family:Georgia,serif;">' + (diaryUserName || '—') + '</div>' +
        '<div style="font-size:1.6rem;letter-spacing:6px;font-weight:400;">diary</div>' +
        '<div class="cover-sub" style="font-size:0.9rem;opacity:0.7;font-style:italic;">· private ·</div>' +
        '<div style="margin-top:12px;font-size:0.8rem;border-top:1px solid #b48b5a;padding-top:10px;width:60%;">✨ ' + (diaryIsLocked ? 'locked memories' : 'open book') + ' ✨</div>';
    
    // Cover front pseudo-element
    var coverBefore = document.createElement('div');
    coverBefore.style.cssText = 'content:\'\';position:absolute;inset:20px;border:3px double #dbbd94;opacity:0.5;border-radius:8px;pointer-events:none;';
    coverFront.appendChild(coverBefore);
    
    // --- COVER BACK ---
    var coverBack = document.createElement('div');
    coverBack.className = 'book-cover book-cover-back';
    coverBack.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:12px 4px 4px 12px;background:#4d321e;background-image:linear-gradient(135deg,#6b4a2e 25%,#3f2818 80%);box-shadow:inset 0 0 30px #1f1308;display:flex;align-items:center;justify-content:center;transform:rotateY(180deg);';
    coverBack.innerHTML = '<span style="font-size:2.2rem;letter-spacing:6px;color:#dac29c;opacity:0.3;font-family:Georgia,serif;">✧ diary ✧</span>';
    
    // --- SPINE ---
    var spine = document.createElement('div');
    spine.className = 'book-spine';
    spine.style.cssText = 'position:absolute;left:-10px;top:4px;width:20px;height:96%;background:#3d2817;border-radius:8px 2px 2px 8px;box-shadow:inset -2px 0 8px #1b0f05,inset 2px 0 4px #a77b4e;transform:rotateY(0deg) translateZ(2px);z-index:20;border-left:2px solid #b48b5a;';
    
    // --- PAGES ---
    var bookPages = document.createElement('div');
    bookPages.className = 'book-pages';
    bookPages.id = 'bookPages';
    bookPages.style.cssText = 'position:absolute;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden;border-radius:8px 2px 2px 8px;background:#fcf3e0;box-shadow:inset 0 0 0 2px #dac09a,inset 0 0 30px rgba(90,60,30,0.3);padding:2.5rem 2.8rem;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Georgia,Times New Roman,serif;color:#2d1f12;line-height:1.7;';
    
    if (diaryIsLocked) {
        bookPages.style.transform = 'rotateY(-180deg)';
        bookPages.style.boxShadow = 'inset 0 0 0 2px #b48b5a,inset 0 0 40px rgba(0,0,0,0.5)';
    }
    
    // Ruled lines background
    var ruledLines = document.createElement('div');
    ruledLines.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(transparent 0px,transparent 28px,#e8dccc 28px,#e8dccc 29px);opacity:0.2;pointer-events:none;';
    bookPages.appendChild(ruledLines);
    
    // Page content
    var pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.cssText = 'position:relative;z-index:5;height:100%;display:flex;flex-direction:column;justify-content:space-between;';
    
    // Diary header
    var diaryHeader = document.createElement('div');
    diaryHeader.className = 'diary-header';
    diaryHeader.style.cssText = 'border-bottom:2px dashed #b28a5c;padding-bottom:0.5rem;margin-bottom:1rem;display:flex;justify-content:space-between;font-size:0.9rem;color:#7a5d3a;letter-spacing:1px;';
    diaryHeader.innerHTML = '<span id="pageDate">📅 —</span><span id="pageTime">✎ —</span>';
    
    // Diary entry
    var diaryEntryDiv = document.createElement('div');
    diaryEntryDiv.className = 'diary-entry';
    diaryEntryDiv.id = 'diaryEntryContent';
    diaryEntryDiv.style.cssText = 'flex:1;font-size:1.05rem;background:rgba(255,247,230,0.3);padding:0.8rem 1rem;border-radius:12px;box-shadow:inset 0 2px 6px rgba(90,60,30,0.1);overflow-y:auto;border-left:4px solid #b28a5c;font-style:italic;min-height:100px;';
    
    // Diary footer
    var diaryFooter = document.createElement('div');
    diaryFooter.className = 'diary-footer';
    diaryFooter.style.cssText = 'margin-top:1rem;display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:#997d5a;border-top:1px solid #dac09a;padding-top:0.6rem;font-family:Segoe UI,sans-serif;';
    diaryFooter.innerHTML = '<span>🔏 just for me</span>' +
        '<div class="page-nav" style="display:flex;gap:12px;align-items:center;">' +
        '<button id="prevPage" disabled style="background:#b48b5a;border:none;color:#1f140a;font-weight:bold;font-size:0.9rem;padding:6px 16px;border-radius:30px;cursor:pointer;font-family:Georgia,serif;box-shadow:0 3px 0 #5f3f26;transition:all 0.08s linear;border:1px solid #dbbd94;letter-spacing:0.5px;">◀ prev</button>' +
        '<span class="page-indicator" id="pageIndicator" style="font-size:0.85rem;color:#5f3f26;font-weight:bold;min-width:60px;text-align:center;">1 / ' + diaryPages.length + '</span>' +
        '<button id="nextPage" style="background:#b48b5a;border:none;color:#1f140a;font-weight:bold;font-size:0.9rem;padding:6px 16px;border-radius:30px;cursor:pointer;font-family:Georgia,serif;box-shadow:0 3px 0 #5f3f26;transition:all 0.08s linear;border:1px solid #dbbd94;letter-spacing:0.5px;">next ▶</button>' +
        '</div>';
    
    // Add new entry button
    var addBtn = document.createElement('button');
    addBtn.textContent = '+ New Entry';
    addBtn.style.cssText = 'background:#b48b5a;border:none;color:#1f140a;font-weight:bold;font-size:0.8rem;padding:6px 14px;border-radius:30px;cursor:pointer;font-family:Georgia,serif;box-shadow:0 3px 0 #5f3f26;transition:all 0.08s linear;border:1px solid #dbbd94;margin-left:8px;';
    addBtn.onclick = function(e) {
        e.stopPropagation();
        showNewEntryDialog();
    };
    diaryFooter.querySelector('span').after(addBtn);
    
    pageContent.appendChild(diaryHeader);
    pageContent.appendChild(diaryEntryDiv);
    pageContent.appendChild(diaryFooter);
    bookPages.appendChild(pageContent);
    
    // --- LOCK AREA ---
    var lockArea = document.createElement('div');
    lockArea.className = 'lock-area';
    lockArea.style.cssText = 'position:absolute;bottom:25px;right:30px;z-index:30;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(40,25,12,0.7);backdrop-filter:blur(4px);padding:12px 18px 14px;border-radius:60px 60px 30px 30px;border:2px solid #b48b5a;box-shadow:0 6px 12px rgba(0,0,0,0.5);';
    lockArea.innerHTML = '<div class="lock-icon" id="lockIcon" style="font-size:2rem;filter:drop-shadow(0 2px 4px #1f0f05);background:#e3d4b0;padding:4px 12px;border-radius:40px;line-height:1;box-shadow:inset 0 -3px 0 #a7855a;cursor:pointer;transition:transform 0.2s;">' + (diaryIsLocked ? '🔒' : '🔓') + '</div>' +
        '<button class="lock-btn" id="lockToggle" style="background:#b48b5a;border:none;color:#1f140a;font-weight:bold;font-size:0.9rem;padding:8px 20px;border-radius:40px;cursor:pointer;font-family:Georgia,serif;letter-spacing:1px;box-shadow:0 3px 0 #5f3f26,0 4px 8px rgba(0,0,0,0.3);transition:all 0.08s linear;text-transform:uppercase;border:1px solid #dbbd94;">' + (diaryIsLocked ? 'unlock' : 'lock') + '</button>' +
        '<span class="lock-status" id="lockStatus" style="font-size:0.65rem;color:#f5e7c8;background:#2d1c0e;padding:2px 12px;border-radius:30px;border:1px solid #b48b5a;letter-spacing:0.5px;">' + (diaryIsLocked ? 'locked' : 'unlocked') + '</span>';
    
    // --- PIN MODAL ---
    var pinModal = document.createElement('div');
    pinModal.className = 'pin-modal';
    pinModal.id = 'pinModal';
    pinModal.style.cssText = 'position:absolute;inset:0;z-index:50;background:rgba(30,18,8,0.85);backdrop-filter:blur(6px);display:' + (!diaryPin ? 'flex' : 'none') + ';justify-content:center;align-items:center;border-radius:12px 4px 4px 12px;padding:2rem;';
    pinModal.innerHTML = '<div class="pin-box" style="background:#fcf3e0;padding:2rem 2.5rem;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.7),0 0 0 2px #b48b5a;text-align:center;max-width:340px;width:100%;border:3px solid #dbbd94;">' +
        '<h2 style="color:#3d2817;font-family:Georgia,serif;font-weight:400;letter-spacing:2px;margin-bottom:0.3rem;">🔐 ' + (!diaryPin ? 'set your PIN' : 'enter PIN') + '</h2>' +
        '<p style="color:#7a5d3a;font-size:0.9rem;margin-bottom:1.2rem;">' + (!diaryPin ? 'enter a 4-digit code to protect your diary' : 'enter your 4-digit code to unlock') + '</p>' +
        '<div class="pin-input-group" style="display:flex;gap:10px;justify-content:center;margin-bottom:1.2rem;">' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="0" style="width:50px;height:60px;text-align:center;font-size:1.8rem;font-family:Georgia,serif;border:2px solid #b28a5c;border-radius:12px;background:#fffdf5;color:#2d1f12;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="1" style="width:50px;height:60px;text-align:center;font-size:1.8rem;font-family:Georgia,serif;border:2px solid #b28a5c;border-radius:12px;background:#fffdf5;color:#2d1f12;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="2" style="width:50px;height:60px;text-align:center;font-size:1.8rem;font-family:Georgia,serif;border:2px solid #b28a5c;border-radius:12px;background:#fffdf5;color:#2d1f12;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" data-index="3" style="width:50px;height:60px;text-align:center;font-size:1.8rem;font-family:Georgia,serif;border:2px solid #b28a5c;border-radius:12px;background:#fffdf5;color:#2d1f12;outline:none;" />' +
        '</div>' +
        '<button class="pin-submit" id="pinSubmit" style="background:#b48b5a;border:none;color:#1f140a;font-weight:bold;font-size:1rem;padding:10px 30px;border-radius:40px;cursor:pointer;font-family:Georgia,serif;letter-spacing:2px;box-shadow:0 4px 0 #5f3f26;transition:all 0.08s linear;border:1px solid #dbbd94;width:100%;">' + (!diaryPin ? 'set PIN & open' : 'unlock') + '</button>' +
        '<div class="pin-error" id="pinError" style="color:#a33;font-size:0.8rem;margin-top:0.5rem;min-height:1.2rem;"></div>' +
        '</div>';
    
    // Assemble book
    book.appendChild(coverFront);
    book.appendChild(coverBack);
    book.appendChild(spine);
    book.appendChild(bookPages);
    book.appendChild(lockArea);
    book.appendChild(pinModal);
    bookWrapper.appendChild(book);
    container.appendChild(bookWrapper);
    
    // Render current page
    renderDiaryPage(diaryCurrentPage);
    
    // Setup event listeners
    setupDiaryEvents(book, bookWrapper, pinModal);
}

// Render a specific diary page
function renderDiaryPage(index) {
    if (index < 0 || index >= diaryPages.length) return;
    
    diaryCurrentPage = index;
    var page = diaryPages[index];
    
    var pageDate = document.getElementById('pageDate');
    var pageTime = document.getElementById('pageTime');
    var diaryEntry = document.getElementById('diaryEntryContent');
    var pageIndicator = document.getElementById('pageIndicator');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');
    
    if (pageDate) pageDate.textContent = page.date;
    if (pageTime) pageTime.textContent = page.time;
    if (diaryEntry) diaryEntry.innerHTML = page.content;
    if (pageIndicator) pageIndicator.textContent = (index + 1) + ' / ' + diaryPages.length;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === diaryPages.length - 1;
}

// Setup all diary event listeners
function setupDiaryEvents(book, bookWrapper, pinModal) {
    // Lock toggle
    var lockToggle = document.getElementById('lockToggle');
    var lockIcon = document.getElementById('lockIcon');
    
    function toggleLock() {
        if (diaryIsLocked) {
            if (!diaryPin) {
                pinModal.style.display = 'flex';
                return;
            }
            diaryIsLocked = false;
        } else {
            diaryIsLocked = true;
        }
        updateDiaryUI(book);
    }
    
    if (lockToggle) lockToggle.addEventListener('click', toggleLock);
    if (lockIcon) lockIcon.addEventListener('click', toggleLock);
    
    // Page navigation
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (diaryIsLocked) return;
            flipDiaryPage(-1, book);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (diaryIsLocked) return;
            flipDiaryPage(1, book);
        });
    }
    
    // PIN input handling
    var pinInputs = pinModal.querySelectorAll('.pin-digit');
    pinInputs.forEach(function(inp, idx) {
        inp.addEventListener('input', function() {
            if (this.value.length === 1 && idx < 3) {
                pinInputs[idx + 1].focus();
            }
        });
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                pinInputs[idx - 1].focus();
            }
            if (e.key === 'Enter') {
                document.getElementById('pinSubmit').click();
            }
        });
    });
    
    // PIN submit
    var pinSubmit = document.getElementById('pinSubmit');
    if (pinSubmit) {
        pinSubmit.addEventListener('click', function() {
            var code = '';
            pinInputs.forEach(function(inp) {
                var val = inp.value.trim();
                if (val.length === 1 && /[0-9]/.test(val)) {
                    code += val;
                }
            });
            
            var pinError = document.getElementById('pinError');
            
            if (code.length !== 4) {
                if (pinError) pinError.textContent = '❌ please enter exactly 4 digits';
                return;
            }
            
            if (!diaryPin) {
                // Set new PIN
                diaryPin = code;
                localStorage.setItem('winchu_diary_pin', diaryPin);
                
                if (pinError) pinError.textContent = '';
                pinModal.style.display = 'none';
                diaryIsLocked = false;
                updateDiaryUI(book);
                
                // Clear inputs
                pinInputs.forEach(function(inp) { inp.value = ''; });
            } else {
                // Verify PIN
                if (code === diaryPin) {
                    if (pinError) pinError.textContent = '';
                    pinModal.style.display = 'none';
                    diaryIsLocked = false;
                    updateDiaryUI(book);
                    pinInputs.forEach(function(inp) { inp.value = ''; });
                } else {
                    if (pinError) pinError.textContent = '❌ incorrect PIN';
                    pinInputs.forEach(function(inp) { inp.value = ''; });
                    pinInputs[0].focus();
                }
            }
        });
    }
    
    // Mouse movement for book tilt
    bookWrapper.addEventListener('mousemove', function(e) {
        var rect = bookWrapper.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotY = 6 + x * 12;
        var rotX = 1 + y * 4;
        
        if (diaryIsLocked) {
            book.style.transform = 'rotateY(' + (rotY - 2) + 'deg) rotateX(' + rotX + 'deg)';
        } else {
            book.style.transform = 'rotateY(' + (rotY + 4) + 'deg) rotateX(' + rotX + 'deg)';
        }
    });
    
    bookWrapper.addEventListener('mouseleave', function() {
        if (diaryIsLocked) {
            book.style.transform = 'rotateY(-4deg) rotateX(2deg)';
        } else {
            book.style.transform = 'rotateY(8deg) rotateX(1deg)';
        }
    });
}

// Update diary UI based on lock state
function updateDiaryUI(book) {
    var lockIcon = document.getElementById('lockIcon');
    var lockStatus = document.getElementById('lockStatus');
    var lockToggle = document.getElementById('lockToggle');
    
    if (diaryIsLocked) {
        book.classList.remove('unlocked');
        book.classList.add('locked');
        book.style.transform = 'rotateY(-4deg) rotateX(2deg)';
        if (lockIcon) lockIcon.textContent = '🔒';
        if (lockStatus) lockStatus.textContent = 'locked';
        if (lockToggle) lockToggle.textContent = 'unlock';
        
        var bookPages = document.getElementById('bookPages');
        if (bookPages) {
            bookPages.style.transform = 'rotateY(-180deg)';
            bookPages.style.boxShadow = 'inset 0 0 0 2px #b48b5a,inset 0 0 40px rgba(0,0,0,0.5)';
        }
    } else {
        book.classList.remove('locked');
        book.classList.add('unlocked');
        book.style.transform = 'rotateY(8deg) rotateX(1deg)';
        if (lockIcon) lockIcon.textContent = '🔓';
        if (lockStatus) lockStatus.textContent = 'unlocked';
        if (lockToggle) lockToggle.textContent = 'lock';
        
        var bookPages = document.getElementById('bookPages');
        if (bookPages) {
            bookPages.style.transform = 'rotateY(0deg)';
            bookPages.style.boxShadow = 'inset 0 0 0 2px #b48b5a,inset 0 0 30px rgba(150,100,50,0.2)';
        }
    }
    
    renderDiaryPage(diaryCurrentPage);
}

// Flip diary page with animation
function flipDiaryPage(direction, book) {
    if (diaryIsLocked) return;
    
    var newIndex = diaryCurrentPage + direction;
    if (newIndex < 0 || newIndex >= diaryPages.length) return;
    
    book.classList.add('flipping');
    
    setTimeout(function() {
        diaryCurrentPage = newIndex;
        renderDiaryPage(diaryCurrentPage);
        book.classList.remove('flipping');
    }, 300);
}

// Show dialog to create new diary entry
function showNewEntryDialog() {
    showDialog({
        emoji: '📝',
        title: 'New Diary Entry',
        subtitle: 'Write your thoughts...',
        placeholder: 'Dear diary...',
        confirmText: 'Next →'
    }).then(function(content) {
        if (!content || !content.trim()) return;
        
        showDialog({
            emoji: '😊',
            title: 'Your Mood',
            subtitle: 'How are you feeling?',
            placeholder: 'e.g., Happy, Thoughtful, Grateful...',
            confirmText: '💾 Save Entry'
        }).then(function(mood) {
            var entry = {
                content: content.trim(),
                mood: (mood && mood.trim()) ? mood.trim() : '—',
                date: new Date().toISOString()
            };
            
            // Save to state
            S.diary.unshift(entry);
            
            // Save to Firebase
            if (S.username) {
                db.ref('diary/' + S.username).push(entry);
            }
            
            saveState();
            
            // Reload diary
            loadDiaryEntries();
            diaryCurrentPage = 0;
            renderDiaryBook();
            
            toast('📝 Entry saved!');
        });
    });
}

// Save diary (called from main diary page)
function saveDiary() {
    showNewEntryDialog();
}

// Initialize diary when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize when navigating to diary page
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.classList.contains('active')) {
                    initDiary();
                }
            });
        });
        
        observer.observe(diaryPage, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});

// Expose functions globally
window.renderDiary = function() {
    loadDiaryEntries();
    renderDiaryBook();
};
window.saveDiary = saveDiary;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - Book style with PIN protection');