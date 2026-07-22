// Firebase Configuration - Secure without anonymous auth
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
console.log('🔥 Firebase initialized');

// Firebase helper functions
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

// Initialize online presence
function setupPresence() {
    if (!S || !S.username) return;
    
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

// Test connection
database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log('✅ Connected to Firebase');
    } else {
        console.log('❌ Disconnected');
    }
});

console.log('🔒 Firebase loaded');