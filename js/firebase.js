// Firebase Configuration - Complete

// ============================================================
// FIREBASE CONFIG
// ============================================================
var firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================
var database = null;
var firebaseReady = false;

try {
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    firebaseReady = true;
    console.log('🔥 Firebase initialized');
    console.log('📡 Database:', firebaseConfig.databaseURL);
} catch (e) {
    console.error('❌ Firebase init error:', e.message);
    firebaseReady = false;
}

// ============================================================
// DATABASE HELPER FUNCTIONS
// ============================================================
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
        return { key: newRef.key, ref: newRef };
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

// ============================================================
// CONNECTION MONITORING
// ============================================================
var isConnected = false;

if (database) {
    database.ref('.info/connected').on('value', function(snapshot) {
        isConnected = snapshot.val() === true;
        if (isConnected) {
            console.log('✅ Firebase ONLINE');
        } else {
            console.log('❌ Firebase OFFLINE');
        }
    });
}

// ============================================================
// CHECK CONNECTION
// ============================================================
function checkConnection() {
    if (!database) return Promise.resolve(false);
    return new Promise(function(resolve) {
        var timeout = setTimeout(function() { resolve(false); }, 5000);
        database.ref('.info/connected').once('value').then(function(snapshot) {
            clearTimeout(timeout);
            resolve(snapshot.val() === true);
        }).catch(function() {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// ============================================================
// ONLINE PRESENCE
// ============================================================
function setupPresence() {
    if (!database || !S || !S.username) {
        console.warn('Cannot setup presence');
        return;
    }
    
    var userRef = database.ref('users/' + S.username);
    var connectedRef = database.ref('.info/connected');
    
    connectedRef.on('value', function(snapshot) {
        if (snapshot.val() === true && S.username) {
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

// ============================================================
// TEST CONNECTION
// ============================================================
function testConnection() {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.resolve({ connected: false });
    }
    
    var startTime = Date.now();
    
    return database.ref('.info/connected').once('value').then(function(snapshot) {
        var latency = Date.now() - startTime;
        var connected = snapshot.val() === true;
        console.log('Connection test:', connected ? '✅ Connected' : '❌ Disconnected', '| Latency:', latency + 'ms');
        return { connected: connected, latency: latency };
    }).catch(function(error) {
        console.error('❌ Connection test failed:', error.message);
        return { connected: false, error: error.message };
    });
}

// ============================================================
// DATABASE STATISTICS
// ============================================================
function getDatabaseStats() {
    if (!database) return Promise.resolve(null);
    
    var stats = { users: 0, posts: 0, videos: 0, groups: 0, connected: isConnected };
    
    return Promise.all([
        database.ref('users').once('value').then(function(snap) {
            stats.users = snap.exists() ? Object.keys(snap.val()).length : 0;
        }),
        database.ref('posts').once('value').then(function(snap) {
            stats.posts = snap.exists() ? Object.keys(snap.val()).length : 0;
        }),
        database.ref('videos').once('value').then(function(snap) {
            stats.videos = snap.exists() ? Object.keys(snap.val()).length : 0;
        }),
        database.ref('groups').once('value').then(function(snap) {
            stats.groups = snap.exists() ? Object.keys(snap.val()).length : 0;
        })
    ]).then(function() { return stats; });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.getRef = getRef;
window.setData = setData;
window.pushData = pushData;
window.updateData = updateData;
window.removeData = removeData;
window.setupPresence = setupPresence;
window.checkConnection = checkConnection;
window.testConnection = testConnection;
window.getDatabaseStats = getDatabaseStats;

console.log('🔒 Firebase module loaded');
console.log('📡 Status:', firebaseReady ? 'Ready' : 'Not Ready');