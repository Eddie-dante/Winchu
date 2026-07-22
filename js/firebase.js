// Firebase Configuration - Fixed connection
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
let database;
let firebaseReady = false;

try {
    // Check if Firebase is already initialized
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    firebaseReady = true;
    console.log('🔥 Firebase initialized successfully');
} catch (e) {
    console.error('Firebase init error:', e);
    firebaseReady = false;
}

// Helper functions with connection check
function getRef(path) {
    if (!database) {
        console.error('Database not initialized');
        return null;
    }
    return database.ref(path);
}

function setData(path, data) {
    if (!database) return Promise.reject('No database connection');
    return database.ref(path).set(data).catch(function(error) {
        console.error('setData error:', error);
        throw error;
    });
}

function pushData(path, data) {
    if (!database) return Promise.reject('No database connection');
    return database.ref(path).push(data).catch(function(error) {
        console.error('pushData error:', error);
        throw error;
    });
}

function updateData(path, data) {
    if (!database) return Promise.reject('No database connection');
    return database.ref(path).update(data).catch(function(error) {
        console.error('updateData error:', error);
        throw error;
    });
}

function removeData(path) {
    if (!database) return Promise.reject('No database connection');
    return database.ref(path).remove().catch(function(error) {
        console.error('removeData error:', error);
        throw error;
    });
}

// Check connection status
function checkConnection() {
    if (!database) return Promise.resolve(false);
    
    return new Promise(function(resolve) {
        database.ref('.info/connected').once('value').then(function(snap) {
            const connected = snap.val() === true;
            console.log('Firebase connection check:', connected ? 'ONLINE' : 'OFFLINE');
            resolve(connected);
        }).catch(function() {
            resolve(false);
        });
    });
}

// Online presence
function setupPresence() {
    if (!database || !S || !S.username) return;
    
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
            console.log('✅ Presence set for:', S.username);
        }
    });
}

// Monitor connection
if (database) {
    database.ref('.info/connected').on('value', function(snap) {
        if (snap.val() === true) {
            console.log('✅ Connected to Firebase Realtime Database');
        } else {
            console.log('❌ Disconnected from Firebase - trying to reconnect...');
        }
    });
}

console.log('🔒 Firebase module loaded - ready:', firebaseReady);