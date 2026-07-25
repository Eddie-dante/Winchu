// Diary Module - Does NOT auto-redirect. Only redirects when diary page is clicked.

// ============================================================
// RENDER DIARY - Only redirects when diary page is active
// ============================================================
function renderDiary() {
    // Check if we're actually on the diary page before redirecting
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage && diaryPage.classList.contains('active')) {
        window.location.href = 'page/diary.html';
    }
}

// ============================================================
// SAVE DIARY
// ============================================================
function saveDiary() {
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage && diaryPage.classList.contains('active')) {
        window.location.href = 'page/diary.html';
    }
}

// ============================================================
// INIT DIARY
// ============================================================
function initDiary() {
    var diaryPage = document.getElementById('page-diary');
    if (diaryPage && diaryPage.classList.contains('active')) {
        window.location.href = 'page/diary.html';
    }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderDiary = renderDiary;
window.saveDiary = saveDiary;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - no auto-redirect');