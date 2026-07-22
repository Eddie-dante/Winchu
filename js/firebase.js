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
let database;
let firebaseReady = false;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseReady = true;
    console.log('🔥 Firebase initialized');
} catch (e) {
    console.error('Firebase init error:', e);
    firebaseReady = false;
}

// Helper functions
function getRef(path) {
    if (!database) {
        console.error('Database not initialized');
        return {
            once: function() { return Promise.resolve({ exists: function() { return false; }, val: function() { return null; } }); },
            on: function() {},
            off: function() {},
            set: function() { return Promise.reject('No DB'); },
            update: function() { return Promise.reject('No DB'); },
            push: function() { return { set: function() { return Promise.reject('No DB'); }, key: 'local_' + Date.now() }; },
            remove: function() { return Promise.reject('No DB'); },
            orderByChild: function() { return this; },
            orderByKey: function() { return this; },
            limitToLast: function() { return this; }
        };
    }
    return database.ref(path);
}

function setData(path, data) {
    if (!database) return Promise.resolve();
    return database.ref(path).set(data).catch(function(err) {
        console.error('setData error:', err);
    });
}

function pushData(path, data) {
    if (!database) {
        return Promise.resolve();
    }
    return database.ref(path).push(data).catch(function(err) {
        console.error('pushData error:', err);
    });
}

function updateData(path, data) {
    if (!database) return Promise.resolve();
    return database.ref(path).update(data).catch(function(err) {
        console.error('updateData error:', err);
    });
}

function removeData(path) {
    if (!database) return Promise.resolve();
    return database.ref(path).remove().catch(function(err) {
        console.error('removeData error:', err);
    });
}

// Connection check - less strict
function checkConnection() {
    if (!database) {
        return Promise.resolve(false);
    }
    
    return new Promise(function(resolve) {
        var timeout = setTimeout(function() {
            resolve(false);
        }, 3000);
        
        database.ref('.info/connected').once('value').then(function(snap) {
            clearTimeout(timeout);
            resolve(snap.val() === true);
        }).catch(function() {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// Online presence
function setupPresence() {
    if (!database || !S || !S.username) return;
    
    database.ref('.info/connected').on('value', function(snap) {
        if (snap.val() === true && S.username) {
            database.ref('users/' + S.username).update({
                online: true,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            database.ref('users/' + S.username).onDisconnect().update({
                online: false,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

// Monitor connection
if (database) {
    database.ref('.info/connected').on('value', function(snap) {
        console.log(snap.val() === true ? '✅ Firebase Connected' : '❌ Firebase Disconnected');
    });
}

console.log('🔒 Firebase ready');