// ==================== AUTH STATE ====================
const AUTH_KEY = 'winchu_auth_v3';
let currentUser = null;

function loadAuth() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.username) {
                currentUser = data;
                return true;
            }
        }
    } catch (e) {
        console.error('Load auth error:', e);
    }
    return false;
}

function saveAuth() {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username: window.S.username }));
    currentUser = { username: window.S.username };
}

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const user = document.getElementById('signupUser').value.trim();
    const pass = document.getElementById('signupPass').value.trim();
    if (!name || !user || !pass) {
        window.toast('Please fill all fields');
        return;
    }
    if (pass.length < 4) {
        window.toast('Password must be at least 4 characters');
        return;
    }

    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        if (users[user]) {
            window.toast('Username already exists');
            return;
        }
        users[user] = {
            name: name,
            password: pass,
            bio: 'Building my energy. One aura at a time. ⚡',
            wallpaper: DEFAULT_WALLPAPER,
            selected_auras: [],
            created: new Date().toISOString(),
            last_seen: new Date().toISOString()
        };
        usersRef.set(users);

        window.S.username = user;
        window.S.selectedAuras = [];
        window.S.completedTasks = [];
        window.S.streakData = {};
        window.S.diary = [];
        window.S.routines = [];
        window.S.socialPosts = [];
        window.S.likedPosts = [];
        window.S.bio = 'Building my energy. One aura at a time. ⚡';
        window.S.wallpaper = DEFAULT_WALLPAPER;
        saveAuth();
        window.setBg(DEFAULT_WALLPAPER);
        window.toast('Account created! Welcome ' + name);
        window.navigate('select');
    });
}

function handleLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) {
        window.toast('Enter username and password');
        return;
    }

    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        if (!users[user] || users[user].password !== pass) {
            window.toast('Invalid credentials');
            return;
        }
        window.S.username = user;
        window.S.bio = users[user].bio || 'Building my energy. One aura at a time. ⚡';
        window.S.wallpaper = users[user].wallpaper || DEFAULT_WALLPAPER;
        window.S.selectedAuras = users[user].selected_auras || [];
        saveAuth();
        window.setBg(window.S.wallpaper);
        setData(`users/${window.S.username}/last_seen`, new Date().toISOString());
        window.loadUserData();
        window.toast('Welcome back, ' + users[user].name);
        window.navigate('social');
    });
}

function logout() {
    if (!confirm('Logout?')) return;
    window.S.username = '';
    localStorage.removeItem(AUTH_KEY);
    document.getElementById('wpFab').style.display = 'none';
    if (window.messagesListener) window.messagesListener.off();
    if (window.postsListener) window.postsListener.off();
    window.toast('Logged out');
    window.navigate('landing');
}

function loadUserData() {
    if (!window.S.username) return;
    // Load diary
    const diaryRef = getRef(`diary/${window.S.username}`);
    diaryRef.once('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            window.S.diary = Object.values(data).reverse();
        }
        window.renderDiary();
    });
    // Load routines
    const routineRef = getRef(`routines/${window.S.username}`);
    routineRef.once('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            window.S.routines = Object.values(data).reverse();
        }
        window.renderRoutines();
    });
}

// Expose
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.loadUserData = loadUserData;
window.loadAuth = loadAuth;