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
let database = null;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('🔥 Firebase initialized');
} catch (e) {
    console.error('Firebase init error:', e);
}

// Helper functions - simple and direct
function getRef(path) {
    if (!database) {
        console.error('Database not initialized');
        return null;
    }
    return database.ref(path);
}

function setData(path, data) {
    if (!database) return Promise.reject('No database');
    return database.ref(path).set(data);
}

function pushData(path, data) {
    if (!database) return Promise.reject('No database');
    var newRef = database.ref(path).push();
    return newRef.set(data).then(function() {
        return newRef;
    });
}

function updateData(path, data) {
    if (!database) return Promise.reject('No database');
    return database.ref(path).update(data);
}

function removeData(path) {
    if (!database) return Promise.reject('No database');
    return database.ref(path).remove();
}

// Online presence
function setupPresence() {
    if (!database || !S || !S.username) return;
    
    var connectedRef = database.ref('.info/connected');
    connectedRef.on('value', function(snap) {
        if (snap.val() === true && S.username) {
            var userRef = database.ref('users/' + S.username);
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

// Monitor connection
if (database) {
    database.ref('.info/connected').on('value', function(snap) {
        if (snap.val() === true) {
            console.log('✅ Connected to Firebase');
        } else {
            console.log('❌ Disconnected');
        }
    });
}

console.log('🔒 Firebase ready');