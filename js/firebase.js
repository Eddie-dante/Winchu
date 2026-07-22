// Firebase Configuration - Fixed for all devices
const firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439"
};

// Initialize Firebase with error handling
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('🔥 Firebase initialized successfully');
} catch (e) {
    console.error('Firebase init error:', e);
}

// Test database connection
if (database) {
    database.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log('✅ Connected to Firebase Realtime Database');
        } else {
            console.log('❌ Disconnected from Firebase');
        }
    });
}

// Firebase helper functions with error handling
function getRef(path) {
    if (!database) {
        console.error('Database not initialized');
        return { once: () => Promise.resolve({ exists: () => false, val: () => null }), on: () => {}, off: () => {}, set: () => Promise.reject('No DB'), update: () => Promise.reject('No DB'), push: () => Promise.reject('No DB'), remove: () => Promise.reject('No DB'), orderByChild: () => ({ limitToLast: () => ({ on: () => {}, off: () => {} }) }), orderByKey: () => ({ limitToLast: () => ({ once: () => Promise.resolve({ val: () => null }) }) }) };
    }
    return database.ref(path);
}

function setData(path, data) {
    if (!database) return Promise.reject('No DB');
    return database.ref(path).set(data);
}

function pushData(path, data) {
    if (!database) return Promise.reject('No DB');
    return database.ref(path).push(data);
}

function updateData(path, data) {
    if (!database) return Promise.reject('No DB');
    return database.ref(path).update(data);
}

function removeData(path) {
    if (!database) return Promise.reject('No DB');
    return database.ref(path).remove();
}

// Initialize online presence
function setupPresence() {
    if (!database || !S || !S.username) return;
    
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            const userRef = database.ref('users/' + S.username);
            userRef.onDisconnect().update({
                online: false,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            userRef.update({
                online: true,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

console.log('🔥 Firebase module loaded');