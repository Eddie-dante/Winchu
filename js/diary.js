// Diary Module - Blue Book with PIN, page navigation, and Firebase sync

var diaryPin = null;
var diaryIsLocked = true;
var diaryCurrentPage = 0;
var diaryPages = [];
var diaryUserName = '';
var isOpening = false;

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
            diaryPages.push({ date: '📅 ' + dateStr, time: timeOfDay, content: contentHTML, editable: true, rawDate: entry.date });
        });
    }
    if (diaryPages.length === 0) {
        var today = new Date();
        var todayStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        diaryPages.push({
            date: '📅 ' + todayStr, time: 'late night',
            content: '<p>Dear Diary,</p><p>Today I finally opened the lock. The rain outside sounds like an old song, and I\'m sitting at my desk, turning the pages of this book that holds so many nights.</p><p>I\'ve decided to write more often, to capture these small, fleeting thoughts. Because some words are only for you.</p><p style="margin-top:0.6rem;">— Goodnight, world.</p>',
            editable: false, rawDate: today.toISOString()
        });
    }
}

function renderDiaryBook() {
    var container = document.getElementById('diaryEntries');
    if (!container) return;
    container.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'book-wrapper';
    wrapper.style.cssText = 'width:100%;max-width:820px;aspect-ratio:3/2;perspective:2000px;cursor:default;margin:0 auto;';

    var book = document.createElement('div');
    book.className = 'book ' + (diaryIsLocked ? 'closed' : 'open');
    book.id = 'diaryBook';
    book.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.6s cubic-bezier(0.4,0.2,0.2,1);box-shadow:0 25px 50px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.1) inset;border-radius:16px 4px 4px 16px;';
    book.style.transform = diaryIsLocked ? 'rotateY(-2deg) rotateX(1deg)' : 'rotateY(8deg) rotateX(1deg)';

    // COVER FRONT
    var cf = document.createElement('div');
    cf.className = 'book-cover book-cover-front';
    cf.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;text-align:center;box-sizing:border-box;border:1px solid rgba(255,255,255,0.1);z-index:10;background:linear-gradient(145deg,#1a3a5c,#0d2844);background-image:radial-gradient(circle at 30% 35%,#2a5a7a 1px,transparent 1px),radial-gradient(circle at 70% 75%,#2a5a7a 1px,transparent 1px);background-size:48px 48px;box-shadow:inset 0 0 0 1px #3a6a8a,inset 0 0 40px rgba(0,20,40,0.6);color:#e8f0f8;';
    cf.innerHTML = '<div style="position:absolute;inset:20px;border:1px solid rgba(180,215,255,0.2);border-radius:12px;pointer-events:none;"></div>' +
        '<div style="font-size:3rem;margin-bottom:0.2rem;">📘</div>' +
        '<div id="coverUserName" style="font-size:2rem;font-weight:400;letter-spacing:2px;border-bottom:1px solid rgba(180,215,255,0.2);padding-bottom:6px;margin-bottom:4px;">' + (diaryUserName || '—') + '</div>' +
        '<div style="font-size:1.6rem;letter-spacing:8px;font-weight:300;color:#8ab4d0;">diary</div>' +
        '<div style="font-size:0.8rem;opacity:0.5;font-weight:300;letter-spacing:4px;">· private ·</div>' +
        '<div style="margin-top:14px;font-size:0.65rem;border-top:1px solid rgba(180,215,255,0.15);padding-top:10px;width:50%;letter-spacing:2px;opacity:0.4;">✦ ' + (diaryIsLocked ? 'locked pages' : 'open pages') + ' ✦</div>';

    // COVER BACK
    var cb = document.createElement('div');
    cb.className = 'book-cover book-cover-back';
    cb.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px 4px 4px 16px;transform:rotateY(180deg);background:linear-gradient(145deg,#0d2844,#081a2e);box-shadow:inset 0 0 50px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
    cb.innerHTML = '<span style="font-size:2rem;letter-spacing:8px;color:#4a7a9a;opacity:0.3;">✦ diary ✦</span>';

    // SPINE
    var spine = document.createElement('div');
    spine.style.cssText = 'position:absolute;left:-8px;top:6px;width:16px;height:96%;background:#0a1e32;border-radius:8px 2px 2px 8px;box-shadow:inset -2px 0 10px rgba(0,0,0,0.8),inset 2px 0 4px #3a6a8a;z-index:20;border-left:1px solid #3a6a8a;';

    // PAGES
    var pages = document.createElement('div');
    pages.className = 'book-pages';
    pages.id = 'bookPages';
    pages.style.cssText = 'position:absolute;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden;border-radius:12px 2px 2px 12px;background:#f8f5f0;box-shadow:inset 0 0 0 1px #d0c8b8,inset 0 0 30px rgba(100,80,60,0.06);padding:2rem 2.5rem;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Georgia,serif;color:#2a241e;line-height:1.7;';
    if (diaryIsLocked) { pages.style.transform = 'rotateY(-180deg)'; pages.style.boxShadow = 'inset 0 0 0 1px #c6b8a4,inset 0 0 40px rgba(0,0,0,0.2)'; }

    var lines = document.createElement('div');
    lines.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(transparent 0px,transparent 27px,#ece6dc 27px,#ece6dc 28px);opacity:0.25;pointer-events:none;';
    pages.appendChild(lines);

    var pc = document.createElement('div');
    pc.className = 'page-content';
    pc.style.cssText = 'position:relative;z-index:5;height:100%;display:flex;flex-direction:column;justify-content:space-between;';

    var hdr = document.createElement('div');
    hdr.className = 'diary-header';
    hdr.style.cssText = 'border-bottom:1px solid #d0c8b8;padding-bottom:0.4rem;margin-bottom:0.8rem;display:flex;justify-content:space-between;font-size:0.8rem;color:#7a6e5e;text-transform:uppercase;';
    hdr.innerHTML = '<span id="pageDate">📅 —</span><span id="pageTime">✎ <span id="timeInput">entry</span></span>';

    var entry = document.createElement('div');
    entry.className = 'diary-entry';
    entry.id = 'diaryEntryContent';
    entry.contentEditable = 'false';
    entry.style.cssText = 'flex:1;font-size:1.05rem;background:rgba(255,250,240,0.4);padding:0.8rem 1rem;border-radius:12px;overflow-y:auto;border-left:3px solid #c6b8a4;color:#2c241c;min-height:70px;outline:none;white-space:pre-wrap;word-wrap:break-word;line-height:1.8;';

    var ftr = document.createElement('div');
    ftr.className = 'diary-footer';
    ftr.style.cssText = 'margin-top:0.8rem;display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:#8f826e;border-top:1px solid #ddd6c8;padding-top:0.5rem;';
    ftr.innerHTML = '<span id="editHint" style="font-size:0.65rem;color:#a0907a;opacity:0.6;">🔒 locked</span>' +
        '<button class="btn-sm" onclick="saveDiaryEntry()" style="font-size:10px;background:#4a7a9a;color:#fff;border:none;padding:4px 12px;border-radius:20px;cursor:pointer;">💾 Save</button>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
        '<button id="prevPage" disabled style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.75rem;padding:4px 16px;border-radius:30px;cursor:pointer;">◀ prev</button>' +
        '<span id="pageIndicator" style="font-size:0.75rem;color:#6a5e4e;">1 / ' + diaryPages.length + '</span>' +
        '<button id="nextPage" style="background:transparent;border:1px solid #c6b8a4;color:#3d342b;font-size:0.75rem;padding:4px 16px;border-radius:30px;cursor:pointer;">+ new ▶</button></div>';

    pc.appendChild(hdr); pc.appendChild(entry); pc.appendChild(ftr);
    pages.appendChild(pc);

    // LOCK
    var lock = document.createElement('div');
    lock.className = 'lock-area';
    lock.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(10,20,35,0.85);backdrop-filter:blur(8px);padding:10px 24px 12px;border-radius:40px 40px 28px 28px;border:1px solid rgba(180,215,255,0.2);box-shadow:0 4px 20px rgba(0,0,0,0.4);pointer-events:auto;';
    lock.innerHTML = '<div id="lockIcon" style="font-size:1.6rem;background:#4a7a9a;padding:0 14px;border-radius:20px;cursor:pointer;color:#e8f0f8;box-shadow:inset 0 -2px 0 #1a3a5c;">' + (diaryIsLocked ? '🔒' : '🔓') + '</div>' +
        '<button id="lockToggle" style="background:#4a7a9a;border:none;color:#e8f0f8;font-size:0.7rem;padding:5px 18px;border-radius:20px;cursor:pointer;text-transform:uppercase;box-shadow:0 2px 0 #1a3a5c;">' + (diaryIsLocked ? 'unlock' : 'lock') + '</button>' +
        '<span id="lockStatus" style="font-size:0.5rem;color:#e8f0f8;background:#0a1e32;padding:2px 12px;border-radius:12px;border:1px solid #3a6a8a;">' + (diaryIsLocked ? 'locked' : 'unlocked') + '</span>';

    // PIN MODAL
    var pm = document.createElement('div');
    pm.id = 'pinModal';
    pm.style.cssText = 'position:absolute;inset:0;z-index:50;background:rgba(10,20,35,0.85);backdrop-filter:blur(8px);display:' + (!diaryPin ? 'flex' : 'none') + ';justify-content:center;align-items:center;border-radius:16px 4px 4px 16px;';
    pm.innerHTML = '<div style="background:#f0ece6;padding:2rem;border-radius:24px;box-shadow:0 30px 50px rgba(0,0,0,0.5);text-align:center;max-width:340px;width:100%;border:1px solid #c6d0dc;">' +
        '<h2 style="color:#1a3a5c;font-weight:400;font-size:1.4rem;">🔐 ' + (!diaryPin ? 'set PIN' : 'enter PIN') + '</h2>' +
        '<p style="color:#5a6a7a;font-size:0.8rem;">4-digit code for your diary</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;margin-bottom:1rem;">' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '<input type="password" maxlength="1" class="pin-digit" style="width:48px;height:56px;text-align:center;font-size:1.6rem;border:1px solid #b0bcc8;border-radius:12px;background:#fff;outline:none;" />' +
        '</div>' +
        '<button id="pinSubmit" style="background:#4a7a9a;border:none;color:#e8f0f8;font-size:0.85rem;padding:10px 20px;border-radius:40px;cursor:pointer;box-shadow:0 3px 0 #1a3a5c;width:100%;">' + (!diaryPin ? 'set PIN & open' : 'unlock') + '</button>' +
        '<div id="pinError" style="color:#b55a4a;font-size:0.75rem;margin-top:0.4rem;min-height:1.2rem;"></div></div>';

    book.appendChild(cf); book.appendChild(cb); book.appendChild(spine);
    book.appendChild(pages); book.appendChild(lock); book.appendChild(pm);
    wrapper.appendChild(book);
    container.appendChild(wrapper);

    renderDiaryPage(diaryCurrentPage);
    setupDiaryEvents(book, pm);
}

function renderDiaryPage(index) {
    if (index < 0 || index >= diaryPages.length) return;
    diaryCurrentPage = index;
    var p = diaryPages[index];
    var de = document.getElementById('diaryEntryContent');
    var ti = document.getElementById('timeInput');
    var eh = document.getElementById('editHint');
    if (document.getElementById('pageDate')) document.getElementById('pageDate').textContent = p.date;
    if (ti) ti.textContent = p.time || 'entry';
    if (de) de.innerHTML = p.content;
    if (document.getElementById('pageIndicator')) document.getElementById('pageIndicator').textContent = (index+1)+' / '+diaryPages.length;
    if (document.getElementById('prevPage')) document.getElementById('prevPage').disabled = index===0;
    if (document.getElementById('nextPage')) document.getElementById('nextPage').textContent = index===diaryPages.length-1 ? '+ new ▶' : 'next ▶';
    if (!diaryIsLocked && p.editable !== false) {
        if (de) { de.contentEditable = 'true'; de.style.borderLeftColor = '#4a7a9a'; de.style.cursor = 'text'; }
        if (ti) ti.contentEditable = 'true';
        if (eh) eh.textContent = '✎ click to edit';
    } else {
        if (de) { de.contentEditable = 'false'; de.style.borderLeftColor = '#c6b8a4'; de.style.cursor = 'default'; }
        if (ti) ti.contentEditable = 'false';
        if (eh) eh.textContent = p.editable===false ? '🔒 sample' : '🔒 locked';
    }
}

function setupDiaryEvents(book, pm) {
    function toggleLock() {
        if (diaryIsLocked) { if (!diaryPin) { pm.style.display = 'flex'; return; } diaryIsLocked = false; isOpening = true; book.classList.add('opening'); setTimeout(function() { book.classList.remove('opening','closed'); book.classList.add('open'); isOpening = false; updateDiaryUI(book); }, 900); showDiaryToast('🔓 Unlocked'); }
        else { saveCurrentDiaryEntry(); diaryIsLocked = true; book.classList.remove('open'); book.classList.add('closed'); book.style.transform = 'rotateY(-2deg) rotateX(1deg)'; updateDiaryUI(book); showDiaryToast('🔒 Locked'); }
    }
    document.getElementById('lockToggle').addEventListener('click', toggleLock);
    document.getElementById('lockIcon').addEventListener('click', toggleLock);
    document.getElementById('prevPage').addEventListener('click', function() { navigateDiaryPage(-1); });
    document.getElementById('nextPage').addEventListener('click', function() { navigateDiaryPage(1); });

    var pins = pm.querySelectorAll('.pin-digit');
    pins.forEach(function(inp, idx) {
        inp.addEventListener('input', function() { if (this.value.length===1 && idx<3) pins[idx+1].focus(); });
        inp.addEventListener('keydown', function(e) { if (e.key==='Backspace' && this.value==='' && idx>0) pins[idx-1].focus(); if (e.key==='Enter') document.getElementById('pinSubmit').click(); });
    });
    document.getElementById('pinSubmit').addEventListener('click', function() {
        var code = ''; pins.forEach(function(inp) { if (inp.value && /[0-9]/.test(inp.value)) code += inp.value; });
        var pe = document.getElementById('pinError');
        if (code.length !== 4) { if (pe) pe.textContent = '❌ enter 4 digits'; return; }
        if (!diaryPin) { diaryPin = code; localStorage.setItem('winchu_diary_pin', diaryPin); pm.style.display = 'none'; diaryIsLocked = false; isOpening = true; book.classList.add('opening'); setTimeout(function() { book.classList.remove('opening','closed'); book.classList.add('open'); isOpening = false; updateDiaryUI(book); }, 900); pins.forEach(function(inp) { inp.value = ''; }); showDiaryToast('🔓 PIN set'); }
        else if (code === diaryPin) { pm.style.display = 'none'; diaryIsLocked = false; isOpening = true; book.classList.add('opening'); setTimeout(function() { book.classList.remove('opening','closed'); book.classList.add('open'); isOpening = false; updateDiaryUI(book); }, 900); pins.forEach(function(inp) { inp.value = ''; }); showDiaryToast('🔓 Unlocked'); }
        else { if (pe) pe.textContent = '❌ incorrect'; pins.forEach(function(inp) { inp.value = ''; }); pins[0].focus(); }
    });

    var de = document.getElementById('diaryEntryContent');
    if (de) { var st; de.addEventListener('input', function() { if (diaryIsLocked) return; clearTimeout(st); st = setTimeout(function() { saveCurrentDiaryEntry(); }, 500); }); }
}

function updateDiaryUI(book) {
    var li = document.getElementById('lockIcon'), ls = document.getElementById('lockStatus'), lt = document.getElementById('lockToggle');
    if (diaryIsLocked) { book.classList.remove('open'); book.classList.add('closed'); if(li)li.textContent='🔒'; if(ls)ls.textContent='locked'; if(lt)lt.textContent='unlock'; }
    else { book.classList.remove('closed'); book.classList.add('open'); if(li)li.textContent='🔓'; if(ls)ls.textContent='unlocked'; if(lt)lt.textContent='lock'; }
    renderDiaryPage(diaryCurrentPage);
}

function navigateDiaryPage(direction) {
    if (diaryIsLocked) return;
    saveCurrentDiaryEntry();
    var ni = diaryCurrentPage + direction;
    if (ni >= diaryPages.length) { var now = new Date(); diaryPages.push({ date: '📅 '+now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}), time: 'entry', content: '<p style="color:#9a8a7a;font-style:italic;">— write here —</p>', editable: true, rawDate: now.toISOString() }); }
    if (ni < 0) return;
    diaryCurrentPage = ni;
    renderDiaryPage(diaryCurrentPage);
    updateDiaryUI(document.getElementById('diaryBook'));
}

function saveCurrentDiaryEntry() {
    var de = document.getElementById('diaryEntryContent'), ti = document.getElementById('timeInput');
    if (!de || diaryIsLocked) return;
    if (diaryCurrentPage >= 0 && diaryCurrentPage < diaryPages.length && diaryPages[diaryCurrentPage].editable !== false) {
        diaryPages[diaryCurrentPage].content = de.innerHTML;
        diaryPages[diaryCurrentPage].time = ti ? ti.textContent.trim() : 'entry';
        var eh = document.getElementById('editHint'); if (eh) { eh.textContent = '✓ saved'; setTimeout(function() { if (eh && !diaryIsLocked) eh.textContent = '✎ click to edit'; }, 800); }
    }
}

function saveDiaryEntry() {
    saveCurrentDiaryEntry();
    if (!S.username || diaryIsLocked) return;
    var entry = diaryPages[diaryCurrentPage];
    if (!entry || entry.editable === false) return;
    var d = document.createElement('div'); d.innerHTML = entry.content;
    var tc = d.textContent || d.innerText || '';
    var de = { content: tc.trim(), mood: entry.time || '—', date: entry.rawDate || new Date().toISOString() };
    S.diary.unshift(de);
    db.ref('diary/' + S.username).push(de);
    saveState();
    showDiaryToast('📝 Saved');
}

function showDiaryToast(msg) {
    var t = document.getElementById('diaryToast');
    if (!t) { t = document.createElement('div'); t.id = 'diaryToast'; t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#0a1e32;color:#e8f0f8;padding:10px 28px;border-radius:40px;font-size:0.85rem;box-shadow:0 6px 20px rgba(0,0,0,0.3);border:1px solid #3a6a8a;opacity:0;transition:opacity 0.3s;z-index:9999;pointer-events:none;'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._timer); t._timer = setTimeout(function() { t.style.opacity = '0'; }, 2200);
}

document.addEventListener('DOMContentLoaded', function() {
    var dp = document.getElementById('page-diary');
    if (dp) { var ob = new MutationObserver(function(ms) { ms.forEach(function(m) { if (m.target.classList.contains('active')) initDiary(); }); }); ob.observe(dp, { attributes: true, attributeFilter: ['class'] }); }
});

window.renderDiary = function() { loadDiaryEntries(); renderDiaryBook(); };
window.saveDiary = saveDiaryEntry;
window.initDiary = initDiary;

console.log('📖 Blue Diary loaded');