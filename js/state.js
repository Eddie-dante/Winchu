// Global State
const AURAS = {
    focus: { name: 'Deep Focus', emoji: '🧘', desc: 'Concentration & clarity', accent: '#6366f1', tasks: ['Meditate 10 min', 'Read 30 min', 'Deep work session', 'No phone for 1 hour'] },
    energy: { name: 'High Energy', emoji: '⚡', desc: 'Action & momentum', accent: '#f59e0b', tasks: ['Workout 20 min', 'Dance break', 'Cold shower', 'Power pose 2 min'] },
    calm: { name: 'Inner Calm', emoji: '🌊', desc: 'Peace & balance', accent: '#06b6d4', tasks: ['Breathe deeply 5 min', 'Stretch 10 min', 'Gratitude journal', 'Nature walk'] },
    creative: { name: 'Creative Flow', emoji: '🎨', desc: 'Innovation & expression', accent: '#ec4899', tasks: ['Sketch 15 min', 'Write freely 20 min', 'Learn something new', 'Brain dump'] },
    social: { name: 'Social Connect', emoji: '🤝', desc: 'Connection & community', accent: '#10b981', tasks: ['Call a friend', 'Send appreciation', 'Help someone', 'Join a group'] },
    growth: { name: 'Personal Growth', emoji: '🌱', desc: 'Learning & development', accent: '#8b5cf6', tasks: ['Read book 20 min', 'Watch educational video', 'Practice skill', 'Set weekly goals'] },
    wellness: { name: 'Wellness', emoji: '💚', desc: 'Health & self-care', accent: '#14b8a6', tasks: ['Drink 8 glasses water', 'Eat vegetables', 'Sleep by 11pm', 'No caffeine after 2pm'] },
    adventure: { name: 'Adventure', emoji: '🗺️', desc: 'Exploration & discovery', accent: '#f97316', tasks: ['Try new route', 'Take a photo', 'Explore new place', 'Try new food'] }
};

let S = {
    username: null,
    name: '',
    bio: 'Building my energy. ⚡',
    wallpaper: null,
    selectedAuras: [],
    avatar: null,
    friends: [],
    completedTasks: [],
    streakData: {},
    socialPosts: [],
    diary: [],
    routines: [],
    videoData: [],
    bookmarks: [],
    notifications: [],
    groups: []
};

let currentChat = null;
let chatMessages = [];
let chatListener = null;
let postsListener = null;
let videosListener = null;
let notifListener = null;
let selectedFile = null;
let selectedFileData = null;
let currentWallpaperFilter = 'all';
let ALL_WALLPAPERS = [];
let viewingProfile = null;

// State helpers
function saveState() {
    try {
        localStorage.setItem('winchu_state', JSON.stringify({
            username: S.username, name: S.name, bio: S.bio, wallpaper: S.wallpaper,
            selectedAuras: S.selectedAuras, avatar: S.avatar, friends: S.friends,
            completedTasks: S.completedTasks, streakData: S.streakData,
            diary: S.diary, routines: S.routines, bookmarks: S.bookmarks
        }));
    } catch (e) {}
}

function loadState() {
    try {
        const raw = localStorage.getItem('winchu_state');
        if (raw) {
            const state = JSON.parse(raw);
            if (state.username) {
                S.username = state.username;
                S.name = state.name || '';
                S.bio = state.bio || 'Building my energy. ⚡';
                S.wallpaper = state.wallpaper || null;
                S.selectedAuras = state.selectedAuras || [];
                S.avatar = state.avatar || null;
                S.friends = state.friends || [];
                S.completedTasks = state.completedTasks || [];
                S.streakData = state.streakData || {};
                S.diary = state.diary || [];
                S.routines = state.routines || [];
                S.bookmarks = state.bookmarks || [];
                return true;
            }
        }
    } catch (e) {}
    return false;
}

// Utility functions
function toast(msg, duration) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, duration || 2500);
}

function timeSince(date) {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getColor(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B787', '#FF8A80', '#B388FF', '#82B1FF', '#B9F6CA', '#FFE57F', '#FF80AB', '#EA80FC', '#8C9EFF'];
    return colors[(username || '').length % colors.length];
}