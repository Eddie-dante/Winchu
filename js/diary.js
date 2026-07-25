// Diary Module - Redirects to standalone diary page

// ============================================================
// RENDER DIARY (Redirect)
// ============================================================
function renderDiary() {
    // Redirect to the standalone diary page
    window.location.href = 'page/diary.html';
}

// ============================================================
// SAVE DIARY (Redirect)
// ============================================================
function saveDiary() {
    window.location.href = 'page/diary.html';
}

// ============================================================
// INIT DIARY (Redirect)
// ============================================================
function initDiary() {
    window.location.href = 'page/diary.html';
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderDiary = renderDiary;
window.saveDiary = saveDiary;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - redirects to page/diary.html');