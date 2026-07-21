// Core Application State and Functions
window.S = {
    username: null,
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
    currentChat: null,
    chatMessages: [],
    videoData: []
};

// AURA Definitions
const AURAS = {
    focus: {
        name: 'Deep Focus',
        emoji: '🧘',
        desc: 'Concentration & clarity',
        accent: '#6366f1',
        tasks: ['Meditate 10 min', 'Read 30 min', 'Deep work session', 'No phone for 1 hour', 'Plan tomorrow']
    },
    energy: {
        name: 'High Energy',
        emoji: '⚡',
        desc: 'Action & momentum',
        accent: '#f59e0b',
        tasks: ['Workout 20 min', 'Dance break', 'Cold shower', 'Power pose 2 min', 'Run 1km']
    },
    calm: {
        name: 'Inner Calm',
        emoji: '🌊',
        desc: 'Peace & balance',
        accent: '#06b6d4',
        tasks: ['Breathe deeply 5 min', 'Stretch 10 min', 'Gratitude journal', 'Nature walk', 'Listen to calm music']
    },
    creative: {
        name: 'Creative Flow',
        emoji: '🎨',
        desc: 'Innovation & expression',
        accent: '#ec4899',
        tasks: ['Sketch 15 min', 'Write freely 20 min', 'Learn something new', 'Brain dump', 'Create playlist']
    },
    social: {
        name: 'Social Connect',
        emoji: '🤝',
        desc: 'Connection & community',
        accent: '#10b981',
        tasks: ['Call a friend', 'Send appreciation', 'Help someone', 'Join a group', 'Compliment stranger']
    },
    growth: {
        name: 'Personal Growth',
        emoji: '🌱',
        desc: 'Learning & development',
        accent: '#8b5cf6',
        tasks: ['Read book 20 min', 'Watch educational video', 'Practice skill', 'Set weekly goals', 'Review progress']
    },
    wellness: {
        name: 'Wellness',
        emoji: '💚',
        desc: 'Health & self-care',
        accent: '#14b8a6',
        tasks: ['Drink 8 glasses water', 'Eat vegetables', 'Sleep by 11pm', 'No caffeine after 2pm', 'Take vitamins']
    },
    adventure: {
        name: 'Adventure',
        emoji: '🗺️',
        desc: 'Exploration & discovery',
        accent: '#f97316',
        tasks: ['Try new route', 'Take a photo', 'Explore new place', 'Try new food', 'Say yes to something']
    }
};

// Navigation System
window.navigate = function(page) {
    // Check auth for protected pages
    const protectedPages = ['home', 'social', 'chat', 'profile', 'diary', 'routine', 'videos', 'wallpapers', 'users'];
    if (protectedPages.includes(page) && !window.S.username) {
        window.toast('Please log in first');
        page = 'landing';
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.animation = 'none';
        targetPage.offsetHeight; // Trigger reflow
        targetPage.style.animation = 'fadeUp 0.4s ease forwards';
    }
    
    // Update bottom navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Show/hide bottom nav
    const nav = document.getElementById('bottomNav');
    if (nav) {
        const showNav = ['home', 'social', 'chat', 'profile', 'diary', 'videos'].includes(page);
        nav.style.display = showNav ? 'flex' : 'none';
    }
    
    // Show/hide wallpaper FAB
    const fab = document.getElementById('wpFab');
    if (fab) {
        fab.style.display = window.S.username ? 'flex' : 'none';
    }
    
    // Update specific pages
    updatePageContent(page);
    
    // Scroll to top
    window.scrollTo(0, 0);
};

function updatePageContent(page) {
    switch(page) {
        case 'social':
            if (window.renderSocial) window.renderSocial();
            break;
        case 'videos':
            if (window.renderVideos) window.renderVideos();
            break;
        case 'chat':
            if (window.renderChatList) window.renderChatList();
            break;
        case 'profile':
            if (window.renderProfile) window.renderProfile();
            break;
        case 'home':
            if (window.renderHome) window.renderHome();
            break;
        case 'users':
            if (window.renderUsers) window.renderUsers();
            break;
        case 'diary':
            if (window.renderDiary) window.renderDiary();
            break;
        case 'wallpapers':
            if (window.renderWallpapers) window.renderWallpapers();
            break;
        case 'select':
            if (window.renderAuraGrid) window.renderAuraGrid();
            break;
    }
}

// Toast Notification System
window.toast = function(message, duration = 2500) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
};

// Background Setter
window.setBg = function(url) {
    if (url) {
        document.body.style.backgroundImage = `url(${url})`;
    } else {
        document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')";
    }
};

// Save User State
function saveUserState() {
    try {
        const state = {
            username: window.S.username,
            bio: window.S.bio,
            wallpaper: window.S.wallpaper,
            selectedAuras: window.S.selectedAuras,
            avatar: window.S.avatar,
            friends: window.S.friends,
            completedTasks: window.S.completedTasks,
            streakData: window.S.streakData,
            diary: window.S.diary,
            routines: window.S.routines
        };
        localStorage.setItem('winchu_user_state', JSON.stringify(state));
    } catch(e) {
        console.error('Error saving state:', e);
    }
}

// Load User State
function loadUserState() {
    try {
        const raw = localStorage.getItem('winchu_user_state');
        if (raw) {
            const state = JSON.parse(raw);
            if (state.username) {
                window.S.username = state.username;
                window.S.bio = state.bio || 'Building my energy. One aura at a time. ⚡';
                window.S.wallpaper = state.wallpaper || null;
                window.S.selectedAuras = state.selectedAuras || [];
                window.S.avatar = state.avatar || null;
                window.S.friends = state.friends || [];
                window.S.completedTasks = state.completedTasks || [];
                window.S.streakData = state.streakData || {};
                window.S.diary = state.diary || [];
                window.S.routines = state.routines || [];
                return true;
            }
        }
    } catch(e) {
        console.error('Error loading state:', e);
    }
    return false;
}

// Dialog System
function showDialog(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('dialogOverlay');
        const emoji = document.getElementById('dialogEmoji');
        const title = document.getElementById('dialogTitle');
        const subtitle = document.getElementById('dialogSubtitle');
        const input = document.getElementById('dialogInput');
        const cancelBtn = document.getElementById('dialogCancel');
        const confirmBtn = document.getElementById('dialogConfirm');
        const backBtn = document.getElementById('dialogBack');

        backBtn.style.display = options.showBack ? 'flex' : 'none';
        input.style.display = options.htmlSubtitle ? 'none' : 'block';
        cancelBtn.style.display = options.noCancel ? 'none' : 'block';

        emoji.textContent = options.emoji || '💬';
        title.textContent = options.title || 'Dialog';
        
        if (options.htmlSubtitle) {
            subtitle.innerHTML = options.htmlSubtitle;
        } else {
            subtitle.textContent = options.subtitle || '';
        }
        
        input.value = options.defaultValue || '';
        input.placeholder = options.placeholder || 'Type here...';
        input.type = options.type || 'text';
        
        cancelBtn.textContent = options.cancelText || 'Cancel';
        confirmBtn.textContent = options.confirmText || 'Confirm';
        confirmBtn.className = options.danger ? 'dialog-danger' : 'dialog-confirm';

        overlay.classList.add('active');
        
        if (!options.htmlSubtitle) {
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        }

        const cleanup = () => {
            overlay.classList.remove('active');
            cancelBtn.onclick = null;
            confirmBtn.onclick = null;
            input.onkeypress = null;
            overlay.onclick = null;
        };

        cancelBtn.onclick = () => { cleanup(); resolve(null); };
        confirmBtn.onclick = () => { 
            cleanup(); 
            if (options.htmlSubtitle) {
                resolve('close');
            } else {
                resolve(input.value);
            }
        };
        
        input.onkeypress = (e) => { 
            if (e.key === 'Enter' && !options.htmlSubtitle) { 
                cleanup(); 
                resolve(input.value); 
            } 
        };
        
        overlay.onclick = (e) => { 
            if (e.target === overlay && !options.noOverlayClose) { 
                cleanup(); 
                resolve(null); 
            } 
        };

        backBtn.onclick = () => { cleanup(); resolve(null); };
    });
}

// Post Detail View
window.viewPostDetail = function(postId) {
    const post = window.S.socialPosts.find(p => p.id === postId);
    if (!post) {
        window.toast('Post not found');
        return;
    }
    
    const overlay = document.getElementById('postDetailOverlay');
    const body = document.getElementById('postDetailBody');
    
    const liked = (post.likes || []).includes(window.S.username);
    const timeAgo = timeSince(new Date(post.time));
    const avatarDisplay = post.avatar || '😊';
    const commentCount = (post.comments || []).length;
    const canDelete = post.author === window.S.username;
    
    let html = `
        <div class="ig-post-header">
            <div class="ig-post-avatar">${avatarDisplay}</div>
            <span class="ig-post-user">${post.author}</span>
            <span class="ig-post-time">${timeAgo}</span>
            ${canDelete ? `<button class="btn-sm btn-danger" onclick="window.deletePost('${post.id}'); window.closePostDetail();">🗑️</button>` : ''}
        </div>
    `;
    
    if (post.image) {
        html += `<img src="${post.image}" class="post-detail-image" alt="Post image" />`;
    }
    
    html += `
        <div style="padding:8px 0;">
            <p style="font-size:15px;margin:4px 0;">${post.text || ''}</p>
        </div>
        <div class="ig-post-actions">
            <button class="ig-post-action ${liked ? 'liked' : ''}" onclick="window.likePost('${post.id}'); window.viewPostDetail('${post.id}');">
                ${liked ? '❤️' : '🤍'}
            </button>
            <span style="font-size:13px;font-weight:600;color:#94a3b8;">${(post.likes || []).length}</span>
            <button class="ig-post-action" onclick="window.commentOnPost('${post.id}'); setTimeout(() => window.viewPostDetail('${post.id}'), 500);">💬</button>
            <span style="font-size:13px;font-weight:600;color:#94a3b8;">${commentCount}</span>
            ${post.image ? `<button class="ig-post-action" onclick="window.downloadMedia('${post.image}', 'winchu-post.jpg')">⬇️</button>` : ''}
        </div>
    `;
    
    // Comments section
    html += '<div style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;"><strong>Comments</strong></div>';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(c => {
            const time = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            html += `<div class="post-detail-comment"><strong>${c.username}</strong> <span class="time">${time}</span><br>${c.text}</div>`;
        });
    } else {
        html += '<div style="color:#94a3b8;text-align:center;padding:12px;">No comments yet. Be the first!</div>';
    }
    
    body.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closePostDetail = function() {
    document.getElementById('postDetailOverlay').classList.remove('active');
    document.body.style.overflow = '';
};

// Time formatting
function timeSince(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString();
}

// Initialize Application
function initApp() {
    // Try to restore session
    const savedUsername = loadAuthState();
    const hasState = loadUserState();
    
    if (savedUsername && window.S.username === savedUsername) {
        // Valid session
        setupPresence();
        loadUserData(savedUsername);
        
        if (window.S.wallpaper) {
            window.setBg(window.S.wallpaper);
        }
        
        const fab = document.getElementById('wpFab');
        if (fab) fab.style.display = 'flex';
        
        if (window.S.selectedAuras.length === 0) {
            window.navigate('select');
        } else {
            window.navigate('social');
        }
        
        // Initialize features
        setTimeout(initAllFeatures, 500);
    } else {
        window.navigate('landing');
    }
    
    console.log('🚀 Winchu · Nexus initialized');
}

function initAllFeatures() {
    if (window.loadVideos) window.loadVideos();
    if (window.loadFriends) window.loadFriends();
    if (window.initWallpapers) window.initWallpapers();
    if (window.setupPostsListener) window.setupPostsListener();
    if (window.renderChatList) window.renderChatList();
    if (window.renderProfile) window.renderProfile();
    if (window.renderHome) window.renderHome();
    if (window.renderSocial) window.renderSocial();
    if (window.renderDiary) window.renderDiary();
    if (window.renderRoutines) window.renderRoutines();
    
    // Update online status periodically
    setInterval(() => {
        if (window.S && window.S.username) {
            setData('users/' + window.S.username + '/last_seen', new Date().toISOString());
        }
    }, 30000);
}

// Expose global functions
window.showDialog = showDialog;
window.closeDialog = () => {
    document.getElementById('dialogOverlay').classList.remove('active');
};
window.saveUserState = saveUserState;
window.loadUserState = loadUserState;
window.timeSince = timeSince;
window.AURAS = AURAS;
window.initAllFeatures = initAllFeatures;

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initApp, 300);
});

console.log('⚡ App core loaded');