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

let chatMessages = [];
let selectedFile = null;
let selectedFileData = null;
let selectedAvatarData = null;
let messagesListener = null;
let postsListener = null;
let usersListener = null;

// ==================== TOAST ====================
function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 2200);
}

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

    if (page === 'select') renderAuraGrid();
    if (page === 'home') renderHome();
    if (page === 'users') renderUsers();
    if (page === 'diary') renderDiary();
    if (page === 'routine') renderRoutines();
    if (page === 'chat') renderChat();
    if (page === 'social') renderSocial();
    if (page === 'profile') renderProfile();
    if (page === 'wallpapers') renderWallpapers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== INIT ====================
function init() {
    console.log('🚀 Winchu starting with Firebase Realtime!');
    const loggedIn = loadAuth();
    if (loggedIn) {
        document.getElementById('wpFab').style.display = 'flex';
        setBg(S.wallpaper);
        document.getElementById('myUsername').textContent = S.username;
        loadUserData();
        setupMessagesListener();
        setupPostsListener();
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

// ==================== EXPOSE TO WINDOW ====================
window.navigate = navigate;
window.toast = toast;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.setBg = setBg;
window.loadUserData = loadUserData;

// Start
init();