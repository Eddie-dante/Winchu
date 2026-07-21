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
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 2200);
}
window.toast = toast;

// ==================== WALLPAPER ====================
function setBg(url) {
    S.wallpaper = url;
    const s = document.createElement('style');
    s.textContent = `body::before{background-image:url('${url}')!important}`;
    const o = document.querySelector('style[data-bg]');
    if (o) o.remove();
    s.setAttribute('data-bg', '');
    document.head.appendChild(s);
    if (S.username) {
        setData(`users/${S.username}/wallpaper`, url);
    }
}
window.setBg = setBg;

// ==================== NAVIGATION ====================
function navigate(page) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.page === page) b.classList.add('active');
    });

    const nav = document.getElementById('bottomNav');
    const hideNav = ['landing', 'login', 'signup', 'select'];
    nav.style.display = hideNav.includes(page) ? 'none' : 'flex';

    if (page === 'select' && window.renderAuraGrid) window.renderAuraGrid();
    if (page === 'home' && window.renderHome) window.renderHome();
    if (page === 'users' && window.renderUsers) window.renderUsers();
    if (page === 'diary' && window.renderDiary) window.renderDiary();
    if (page === 'routine' && window.renderRoutines) window.renderRoutines();
    if (page === 'chat' && window.renderChat) window.renderChat();
    if (page === 'social' && window.renderSocial) window.renderSocial();
    if (page === 'profile' && window.renderProfile) window.renderProfile();
    if (page === 'wallpapers' && window.renderWallpapers) window.renderWallpapers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.navigate = navigate;

// ==================== INIT ====================
function init() {
    console.log('🚀 Winchu starting with Firebase Realtime!');
    const loggedIn = loadAuth();
    if (loggedIn) {
        document.getElementById('wpFab').style.display = 'flex';
        setBg(S.wallpaper);
        document.getElementById('myUsername').textContent = S.username;
        loadUserData();
        if (window.setupMessagesListener) window.setupMessagesListener();
        if (window.setupPostsListener) window.setupPostsListener();
        setInterval(function() {
            if (S.username) {
                setData(`users/${S.username}/last_seen`, new Date().toISOString());
            }
        }, 30000);
        navigate('social');
    } else {
        document.getElementById('wpFab').style.display = 'none';
        navigate('landing');
    }
    console.log('⚡ Winchu · Nexus with Firebase Realtime ✅');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);