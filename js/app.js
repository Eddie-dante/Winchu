// js/app.js - Main Controller
const App = {
    state: {
        username: '',
        selectedAuras: [],
        completedTasks: [],
        streakData: {},
        wallpaper: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
        bio: 'Building my energy. One aura at a time. ⚡️',
        avatar: null,
        friends: [],
        friendRequests: [],
        sentRequests: [],
        currentChatWith: null,
        currentChatType: 'private', // private, group, public
        currentGroup: null,
        diary: [],
        routines: [],
        socialPosts: [],
        likedPosts: []
    },
    AUTH_KEY: 'winchu_auth_v5',

    loadAuth() {
        try {
            const raw = localStorage.getItem(this.AUTH_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.username) {
                    this.state.username = data.username;
                    return true;
                }
            }
        } catch (e) { console.error('Load auth error:', e); }
        return false;
    },

    saveAuth() {
        localStorage.setItem(this.AUTH_KEY, JSON.stringify({ username: this.state.username }));
    },

    toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.getElementById('toastContainer').appendChild(t);
        setTimeout(() => t.remove(), 2200);
    },

    setBg(url) {
        this.state.wallpaper = url;
        const s = document.createElement('style');
        s.textContent = body::before{background-image:url('${url}')!important};
        const o = document.querySelector('style[data-bg]');
        if (o) o.remove();
        s.setAttribute('data-bg', '');
        document.head.appendChild(s);
        if (this.state.username) setData(users/${this.state.username}/wallpaper, url);
    },

    navigate(page) {
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

        // Call page render functions
        if (page === 'select' && typeof Auras !== 'undefined') Auras.render();
        if (page === 'home' && typeof Dashboard !== 'undefined') Dashboard.render();
        if (page === 'users' && typeof Users !== 'undefined') Users.render();
        if (page === 'diary' && typeof Diary !== 'undefined') Diary.render();
        if (page === 'routine' && typeof Routine !== 'undefined') Routine.render();
        if (page === 'chat' && typeof Chat !== 'undefined') Chat.render();
        if (page === 'social' && typeof Social !== 'undefined') Social.render();
        if (page === 'profile' && typeof Profile !== 'undefined') Profile.render();
        if (page === 'wallpapers' && typeof Wallpapers !== 'undefined') Wallpapers.render();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    logout() {
        if (!confirm('Logout?')) return;
        this.state.username = '';
        localStorage.removeItem(this.AUTH_KEY);
        document.getElementById('wpFab').style.display = 'none';
        if (Chat) Chat.cleanup();
        this.toast('Logged out');
        this.navigate('landing');
    }
};

// Make App globally available
window.App = App;
window.navigate = App.navigate.bind(App);
window.toast = App.toast.bind(App);