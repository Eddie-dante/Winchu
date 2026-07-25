// State Module - Global state and utility functions

// ============================================================
// AURA DEFINITIONS
// ============================================================
var AURAS = {
    focus: {
        name: 'Deep Focus',
        emoji: '🧘',
        desc: 'Concentration & clarity',
        accent: '#6366f1',
        tasks: ['Meditate 10 min', 'Read 30 min', 'Deep work session', 'No phone for 1 hour']
    },
    energy: {
        name: 'High Energy',
        emoji: '⚡',
        desc: 'Action & momentum',
        accent: '#f59e0b',
        tasks: ['Workout 20 min', 'Dance break', 'Cold shower', 'Power pose 2 min']
    },
    calm: {
        name: 'Inner Calm',
        emoji: '🌊',
        desc: 'Peace & balance',
        accent: '#06b6d4',
        tasks: ['Breathe deeply 5 min', 'Stretch 10 min', 'Gratitude journal', 'Nature walk']
    },
    creative: {
        name: 'Creative Flow',
        emoji: '🎨',
        desc: 'Innovation & expression',
        accent: '#ec4899',
        tasks: ['Sketch 15 min', 'Write freely 20 min', 'Learn something new', 'Brain dump']
    },
    social: {
        name: 'Social Connect',
        emoji: '🤝',
        desc: 'Connection & community',
        accent: '#10b981',
        tasks: ['Call a friend', 'Send appreciation', 'Help someone', 'Join a group']
    },
    growth: {
        name: 'Personal Growth',
        emoji: '🌱',
        desc: 'Learning & development',
        accent: '#8b5cf6',
        tasks: ['Read book 20 min', 'Watch educational video', 'Practice skill', 'Set weekly goals']
    },
    wellness: {
        name: 'Wellness',
        emoji: '💚',
        desc: 'Health & self-care',
        accent: '#14b8a6',
        tasks: ['Drink 8 glasses water', 'Eat vegetables', 'Sleep by 11pm', 'No caffeine after 2pm']
    },
    adventure: {
        name: 'Adventure',
        emoji: '🗺️',
        desc: 'Exploration & discovery',
        accent: '#f97316',
        tasks: ['Try new route', 'Take a photo', 'Explore new place', 'Try new food']
    }
};

// ============================================================
// GLOBAL STATE
// ============================================================
var S = {
    username: null,
    name: '',
    bio: 'Building my energy. One aura at a time. ⚡',
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

// ============================================================
// CHAT STATE
// ============================================================
var currentChat = null;
var chatMessages = [];
var chatListener = null;
var currentChatType = 'dm';
var currentChatParticipants = [];

// ============================================================
// LISTENERS
// ============================================================
var postsListener = null;
var videosListener = null;
var notifListener = null;

// ============================================================
// WALLPAPER STATE
// ============================================================
var ALL_WALLPAPERS = [];
var currentWallpaperFilter = 'all';

// ============================================================
// OTHER STATE
// ============================================================
var viewingProfile = null;
var selectedFile = null;
var selectedFileData = null;
var processedPostIds = {};
var processedMsgIds = {};

// ============================================================
// SAVE STATE TO LOCAL STORAGE
// ============================================================
function saveState() {
    try {
        var stateToSave = {
            username: S.username,
            name: S.name,
            bio: S.bio,
            wallpaper: S.wallpaper,
            selectedAuras: S.selectedAuras,
            avatar: S.avatar,
            friends: S.friends,
            completedTasks: S.completedTasks,
            streakData: S.streakData,
            diary: S.diary,
            routines: S.routines,
            bookmarks: S.bookmarks
        };
        localStorage.setItem('ws', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// ============================================================
// LOAD STATE FROM LOCAL STORAGE
// ============================================================
function loadState() {
    try {
        var raw = localStorage.getItem('ws');
        if (raw) {
            var state = JSON.parse(raw);
            if (state.username) {
                S.username = state.username;
                S.name = state.name || '';
                S.bio = state.bio || 'Building my energy. One aura at a time. ⚡';
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
    } catch (e) {
        console.error('Error loading state:', e);
    }
    return false;
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function toast(message, duration) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    
    var toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.textContent = message;
    container.appendChild(toastElement);
    
    var timeout = duration || 2500;
    setTimeout(function() {
        if (toastElement.parentNode) {
            toastElement.remove();
        }
    }, timeout);
}

// ============================================================
// TIME SINCE FORMATTING
// ============================================================
function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return seconds + 's ago';
    
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    
    var days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    
    if (days < 30) return Math.floor(days / 7) + 'w ago';
    
    return date.toLocaleDateString();
}

// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// GENERATE UNIQUE ID
// ============================================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ============================================================
// GET COLOR FOR USERNAME
// ============================================================
function getColor(username) {
    var colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#98D8C8', '#F7B787', '#FF8A80', '#B388FF', '#82B1FF', '#B9F6CA',
        '#FFE57F', '#FF80AB', '#EA80FC', '#8C9EFF', '#80D8FF', '#CFD8DC',
        '#FFD740', '#69F0AE', '#FF4081', '#7C4DFF', '#00E5FF', '#FF6E40'
    ];
    var index = 0;
    if (username) {
        for (var i = 0; i < username.length; i++) {
            index += username.charCodeAt(i);
        }
    }
    return colors[index % colors.length];
}

// ============================================================
// TRUNCATE TEXT
// ============================================================
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ============================================================
// FORMAT NUMBER (1.2k, 3.4m, etc.)
// ============================================================
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================================
// DEBOUNCE FUNCTION
// ============================================================
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// ============================================================
// GET RANDOM ELEMENT FROM ARRAY
// ============================================================
function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// CHECK IF MOBILE DEVICE
// ============================================================
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ============================================================
// GET DEVICE TYPE
// ============================================================
function getDeviceType() {
    var width = window.innerWidth;
    if (width < 480) return 'phone';
    if (width < 768) return 'tablet';
    if (width < 1200) return 'laptop';
    return 'desktop';
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.S = S;
window.AURAS = AURAS;
window.saveState = saveState;
window.loadState = loadState;
window.toast = toast;
window.timeSince = timeSince;
window.escapeHtml = escapeHtml;
window.generateId = generateId;
window.getColor = getColor;
window.truncateText = truncateText;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.getRandomElement = getRandomElement;
window.isMobileDevice = isMobileDevice;
window.getDeviceType = getDeviceType;

console.log('📦 State module loaded');
console.log('👤 User:', S.username || 'Not logged in');
console.log('🎨 Auras:', Object.keys(AURAS).length);