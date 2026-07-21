// ==================== MAIN APP STATE ====================
const S = {
    selectedAuras: [],
    completedTasks: [],
    streakData: {},
    wallpaper: DEFAULT_WALLPAPER,
    diary: [],
    routines: [],
    socialPosts: [],
    likedPosts: [],
    username: '',
    bio: 'Building my energy. One aura at a time. ⚡',
    avatar: null
};

window.S = S;

let chatMessages = [];
let selectedFile = null;
let selectedFileData = null;
let selectedAvatarData = null;
let messagesListener = null;
let postsListener = null;
let usersListener = null;

window.chatMessages = chatMessages;
window.messagesListener = messagesListener;
window.postsListener = postsListener;

// ==================== TOAST ====================
function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(t);
    } else {
        document.body.appendChild(t);
    }
    setTimeout(() => t.remove(), 2200);
}
window.toast = toast;

// ==================== WALLPAPER ====================
function setBg(url) {
    S.wallpaper = url;
    const s = document.createElement('style');
    s.textContent = 'body::before{background-image:url(' + url + ')!important}';
    const o = document.querySelector('style[data-bg]');
    if (o) o.remove();
    s.setAttribute('data-bg', '');
    document.head.appendChild(s);
    if (S.username) {
        setData('users/' + S.username + '/wallpaper', url);
    }
}
window.setBg = setBg;

// ==================== NAVIGATION ====================
function navigate(page) {
    document.querySelectorAll('.page').forEach(function(x) {
        x.classList.remove('active');
    });
    var target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(function(b) {
        b.classList.remove('active');
        if (b.dataset.page === page) b.classList.add('active');
    });

    var nav = document.getElementById('bottomNav');
    if (nav) {
        var hideNav = ['landing', 'login', 'signup', 'select'];
        nav.style.display = hideNav.indexOf(page) > -1 ? 'none' : 'flex';
    }

    // Call render functions if they exist
    try {
        if (page === 'select' && typeof renderAuraGrid === 'function') renderAuraGrid();
        if (page === 'home' && typeof renderHome === 'function') renderHome();
        if (page === 'users' && typeof renderUsers === 'function') renderUsers();
        if (page === 'diary' && typeof renderDiary === 'function') renderDiary();
        if (page === 'routine' && typeof renderRoutines === 'function') renderRoutines();
        if (page === 'chat' && typeof renderChat === 'function') renderChat();
        if (page === 'social' && typeof renderSocial === 'function') renderSocial();
        if (page === 'profile' && typeof renderProfile === 'function') renderProfile();
        if (page === 'wallpapers' && typeof renderWallpapers === 'function') renderWallpapers();
    } catch (e) {
        console.warn('Render function not ready yet:', e.message);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.navigate = navigate;

// ==================== INIT ====================
function init() {
    console.log('🚀 Winchu starting with Firebase Realtime!');
    var loggedIn = typeof loadAuth === 'function' ? loadAuth() : false;
    
    if (loggedIn) {
        var fab = document.getElementById('wpFab');
        if (fab) fab.style.display = 'flex';
        
        setBg(S.wallpaper);
        
        var usernameEl = document.getElementById('myUsername');
        if (usernameEl) usernameEl.textContent = S.username;
        
        if (typeof loadUserData === 'function') loadUserData();
        if (typeof setupMessagesListener === 'function') setupMessagesListener();
        if (typeof setupPostsListener === 'function') setupPostsListener();
        
        setInterval(function() {
            if (S.username) {
                setData('users/' + S.username + '/last_seen', new Date().toISOString());
            }
        }, 30000);
        
        navigate('social');
    } else {
        var fab = document.getElementById('wpFab');
        if (fab) fab.style.display = 'none';
        navigate('landing');
    }
    console.log('⚡ Winchu · Nexus with Firebase Realtime ✅');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}