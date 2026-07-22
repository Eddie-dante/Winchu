// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized');
} catch (e) {
    console.error('Firebase init error:', e);
}

const database = firebase.database();

// Helper functions
function getRef(path) {
    return database.ref(path);
}

function setData(path, data) {
    return database.ref(path).set(data);
}

function pushData(path, data) {
    return database.ref(path).push(data);
}

function updateData(path, data) {
    return database.ref(path).update(data);
}

function removeData(path) {
    return database.ref(path).remove();
}

// Online presence
function setupPresence() {
    if (!S || !S.username) return;
    
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', function(snap) {
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

// Test connection
database.ref('.info/connected').on('value', function(snap) {
    if (snap.val() === true) {
        console.log('✅ Connected to Firebase');
    } else {
        console.log('❌ Disconnected from Firebase');
    }
});