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
    } catch (e) { console.error('Load auth error:', e); }
    return false;
}

function saveAuth() {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username: S.username }));
    currentUser = { username: S.username };
}

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const user = document.getElementById('signupUser').value.trim();
    const pass = document.getElementById('signupPass').value.trim();
    if (!name || !user || !pass) { toast('Please fill all fields'); return; }
    if (pass.length < 4) { toast('Password must be at least 4 characters'); return; }

    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        if (users[user]) {
            toast('Username already exists');
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

        S.username = user;
        S.selectedAuras = [];
        S.completedTasks = [];
        S.streakData = {};
        S.diary = [];
        S.routines = [];
        S.socialPosts = [];
        S.likedPosts = [];
        S.bio = 'Building my energy. One aura at a time. ⚡';
        S.wallpaper = DEFAULT_WALLPAPER;
        saveAuth();
        setBg(DEFAULT_WALLPAPER);
        toast('Account created! Welcome ' + name);
        navigate('select');
    });
}

function handleLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) { toast('Enter username and password'); return; }

    const usersRef = getRef('users');
    usersRef.once('value', function(snapshot) {
        const users = snapshot.val() || {};
        if (!users[user] || users[user].password !== pass) {
            toast('Invalid credentials');
            return;
        }
        S.username = user;
        S.bio = users[user].bio || 'Building my energy. One aura at a time. ⚡';
        S.wallpaper = users[user].wallpaper || DEFAULT_WALLPAPER;
        S.selectedAuras = users[user].selected_auras || [];
        saveAuth();
        setBg(S.wallpaper);
        setData(`users/${S.username}/last_seen`, new Date().toISOString());
        loadUserData();
        toast('Welcome back, ' + users[user].name);
        navigate('social');
    });
}

function logout() {
    if (!confirm('Logout?')) return;
    S.username = '';
    localStorage.removeItem(AUTH_KEY);
    document.getElementById('wpFab').style.display = 'none';
    if (messagesListener) messagesListener.off();
    if (postsListener) postsListener.off();
    toast('Logged out');
    navigate('landing');
}

function loadUserData() {
    if (!S.username) return;
    // Load diary
    const diaryRef = getRef(`diary/${S.username}`);
    diaryRef.once('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            S.diary = Object.values(data).reverse();
        }
        renderDiary();
    });
    // Load routines
    const routineRef = getRef(`routines/${S.username}`);
    routineRef.once('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            S.routines = Object.values(data).reverse();
        }
        renderRoutines();
    });
}