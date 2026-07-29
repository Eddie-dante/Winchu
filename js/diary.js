// Diary Module - Opens diary.html inside the app container

var diaryLoaded = false;

// ============================================================
// RENDER DIARY - Loads diary.html into the page container
// ============================================================
function renderDiary() {
    var diaryPage = document.getElementById('page-diary');
    if (!diaryPage) return;
    
    // Check if we're on the diary page
    if (!diaryPage.classList.contains('active')) {
        return;
    }
    
    // If diary is already loaded, don't reload
    if (diaryLoaded) {
        return;
    }
    
    // Get or create diary container
    var container = document.getElementById('diaryContainer');
    if (!container) {
        // Create container if it doesn't exist
        container = document.createElement('div');
        container.id = 'diaryContainer';
        container.style.cssText = 'width:100%;height:100%;min-height:580px;border-radius:16px;overflow:hidden;';
        diaryPage.querySelector('.container').appendChild(container);
    }
    
    // Clear container and add iframe
    container.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.src = 'page/diary.html';
    iframe.style.cssText = 'width:100%;height:100%;min-height:580px;border:none;border-radius:16px;background:#d4dce8;';
    iframe.allow = 'fullscreen';
    iframe.loading = 'lazy';
    
    // Handle iframe load
    iframe.onload = function() {
        diaryLoaded = true;
        console.log('📖 Diary loaded inside app');
    };
    
    container.appendChild(iframe);
}

// ============================================================
// SAVE DIARY - Triggers save in the iframe
// ============================================================
function saveDiary() {
    var iframe = document.querySelector('#diaryContainer iframe');
    if (iframe && iframe.contentWindow) {
        try {
            // Try to call save function inside diary.html
            iframe.contentWindow.postMessage({ action: 'saveDiary' }, '*');
            toast('📖 Diary saved!');
        } catch(e) {
            console.log('Could not save diary:', e);
            toast('Please save diary manually');
        }
    } else {
        toast('Please open diary first');
    }
}

// ============================================================
// INIT DIARY - Set up observer for diary page activation
// ============================================================
function initDiary() {
    var diaryPage = document.getElementById('page-diary');
    if (!diaryPage) return;
    
    // If diary page is already active, render it
    if (diaryPage.classList.contains('active')) {
        renderDiary();
    }
    
    // Set up observer for diary page activation
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('active')) {
                renderDiary();
            }
        });
    });
    
    observer.observe(diaryPage, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// ============================================================
// HANDLE POST MESSAGES FROM DIARY IFRAME
// ============================================================
window.addEventListener('message', function(event) {
    // Handle messages from diary iframe
    if (event.data && event.data.action === 'diarySaved') {
        toast('📖 Diary saved successfully!');
        // Update diary count in dashboard
        var diaryCount = document.getElementById('diaryCount');
        if (diaryCount) {
            var current = parseInt(diaryCount.textContent) || 0;
            diaryCount.textContent = current + 1;
        }
    }
    
    if (event.data && event.data.action === 'diaryUpdated') {
        // Update diary count
        if (event.data.count !== undefined) {
            var diaryCount = document.getElementById('diaryCount');
            if (diaryCount) {
                diaryCount.textContent = event.data.count;
            }
        }
    }
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.renderDiary = renderDiary;
window.saveDiary = saveDiary;
window.initDiary = initDiary;

console.log('📖 Diary module loaded - opens diary inside app');