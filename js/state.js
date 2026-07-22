var AURAS = {
    focus: { name: 'Deep Focus', emoji: '🧘', desc: 'Concentration', accent: '#6366f1', tasks: ['Meditate', 'Read', 'Deep work'] },
    energy: { name: 'High Energy', emoji: '⚡', desc: 'Action', accent: '#f59e0b', tasks: ['Workout', 'Dance', 'Cold shower'] },
    calm: { name: 'Inner Calm', emoji: '🌊', desc: 'Peace', accent: '#06b6d4', tasks: ['Breathe', 'Stretch', 'Journal'] },
    creative: { name: 'Creative', emoji: '🎨', desc: 'Expression', accent: '#ec4899', tasks: ['Sketch', 'Write', 'Learn'] }
};

var S = {
    username: null, name: '', bio: 'Building my energy.', wallpaper: null,
    selectedAuras: [], avatar: null, friends: [], completedTasks: [],
    streakData: {}, socialPosts: [], diary: [], routines: [],
    videoData: [], bookmarks: [], notifications: [], groups: []
};

var currentChat = null, chatMessages = [], chatListener = null;
var postsListener = null, videosListener = null, notifListener = null;
var ALL_WALLPAPERS = [], currentWallpaperFilter = 'all';
var viewingProfile = null;

function saveState() {
    try { localStorage.setItem('ws', JSON.stringify({
        username: S.username, name: S.name, bio: S.bio, wallpaper: S.wallpaper,
        selectedAuras: S.selectedAuras, avatar: S.avatar, friends: S.friends,
        completedTasks: S.completedTasks, streakData: S.streakData,
        diary: S.diary, routines: S.routines, bookmarks: S.bookmarks
    })); } catch(e) {}
}

function loadState() {
    try {
        var r = localStorage.getItem('ws');
        if (r) {
            var s = JSON.parse(r);
            if (s.username) {
                S.username = s.username; S.name = s.name || ''; S.bio = s.bio || '';
                S.wallpaper = s.wallpaper; S.selectedAuras = s.selectedAuras || [];
                S.avatar = s.avatar; S.friends = s.friends || [];
                S.completedTasks = s.completedTasks || []; S.streakData = s.streakData || {};
                S.diary = s.diary || []; S.routines = s.routines || [];
                S.bookmarks = s.bookmarks || [];
                return true;
            }
        }
    } catch(e) {}
    return false;
}

function toast(m, d) {
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = m;
    c.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.remove(); }, d || 2500);
}

function timeSince(date) {
    var diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return Math.floor(diff/60) + 'm';
    if (diff < 86400) return Math.floor(diff/3600) + 'h';
    return Math.floor(diff/86400) + 'd';
}

function escapeHtml(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getColor(u) {
    var c = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7B787','#FF8A80','#B388FF'];
    return c[(u||'').length % c.length];
}