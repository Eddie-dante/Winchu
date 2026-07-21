// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439",
    measurementId: "G-GGNFGS1MEL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log('🔥 Firebase initialized!');

// ==================== HELPERS ====================
function getRef(path) {
    return database.ref(path);
}

async function pushData(path, data) {
    const ref = getRef(path);
    const newRef = ref.push();
    await newRef.set(data);
    return newRef.key;
}

async function setData(path, data) {
    const ref = getRef(path);
    await ref.set(data);
}

async function getData(path) {
    const ref = getRef(path);
    const snapshot = await ref.once('value');
    return snapshot.val();
}

// ==================== AURAS ====================
const AURAS = {
    focus: { name: 'Focus', emoji: '🎯', accent: '#ff6b6b', desc: 'Concentration', tasks: ['Deep work 25 min', 'No phone 1 hour', 'Single-task', 'Clear desk', 'Pomodoro'] },
    creativity: { name: 'Creativity', emoji: '🎨', accent: '#f06595', desc: 'Imagination', tasks: ['Free-write 10 min', 'Sketch/doodle', 'Brainstorm', 'New music', 'Rearrange'] },
    discipline: { name: 'Discipline', emoji: '🧘', accent: '#748ffc', desc: 'Self-control', tasks: ['Wake up on time', 'Morning routine', 'Say no', 'Priority task', 'Reflection'] },
    vitality: { name: 'Vitality', emoji: '⚡', accent: '#ffd43b', desc: 'Energy', tasks: ['Exercise 30 min', '8 glasses water', 'Whole foods', 'Cold shower', 'Stretch'] },
    empathy: { name: 'Empathy', emoji: '🤝', accent: '#ff8787', desc: 'Connection', tasks: ['Listen fully', 'Ask feelings', 'Validate', 'Active listening', 'Compliment'] },
    resilience: { name: 'Resilience', emoji: '🛡️', accent: '#20c997', desc: 'Bounce back', tasks: ['Reframe', 'Gratitude', 'Do hard thing', 'Journal', 'Mental break'] },
    clarity: { name: 'Clarity', emoji: '🔮', accent: '#b197fc', desc: 'Clear mind', tasks: ['Meditate', 'Top priorities', 'Declutter', 'Digital detox', 'Review goals'] },
    charisma: { name: 'Charisma', emoji: '✨', accent: '#f783ac', desc: 'Presence', tasks: ['Smile', 'Tell story', 'Eye contact', 'Open posture', 'Make laugh'] },
    courage: { name: 'Courage', emoji: '🦁', accent: '#ff922b', desc: 'Face fears', tasks: ['Do scary thing', 'Speak up', 'Try new', 'Admit mistake', 'Stand up'] },
    patience: { name: 'Patience', emoji: '⏳', accent: '#a9e34b', desc: 'Steady', tasks: ['Wait', 'Let others', 'Deep breath', 'Accept delays', 'Count to 10'] },
    gratitude: { name: 'Gratitude', emoji: '🙏', accent: '#e599f7', desc: 'Appreciate', tasks: ['3 gratitudes', 'Thank someone', 'Notice joys', 'Nature', 'Reflect'] },
    ambition: { name: 'Ambition', emoji: '🚀', accent: '#f03e3e', desc: 'Drive', tasks: ['Bold goal', 'Take action', 'Network', 'Learn skill', 'Visualize'] },
    mindfulness: { name: 'Mindfulness', emoji: '🧘‍♀️', accent: '#63e6be', desc: 'Present', tasks: ['Body scan', 'Eat mindfully', '5 senses', 'Mindful walk', 'Observe'] },
    leadership: { name: 'Leadership', emoji: '👑', accent: '#f59e0b', desc: 'Inspire', tasks: ['Delegate', 'Give direction', 'Recognize', 'Decide', 'Lead'] },
    adventure: { name: 'Adventure', emoji: '🏔️', accent: '#3b82f6', desc: 'Explore', tasks: ['New place', 'New food', 'Say yes', 'Break routine', 'Plan'] }
};

// ==================== WALLPAPERS ====================
const UNSPLASH = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1920&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1920&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1920&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=80',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1920&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1920&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1920&q=80',
    'https://images.unsplash.com/photo-1647811867884-b14ab4f81b36?w=1920&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1920&q=80',
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1920&q=80',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1920&q=80',
    'https://images.unsplash.com/photo-1575377501614-f1d565d84756?w=1920&q=80',
    'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?w=1920&q=80',
    'https://images.unsplash.com/photo-1736580602088-73d0f3ad8add?w=1920&q=80'
];

const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80';