// ============================================================
// FIREBASE CONFIGURATION - COMPLETE FIX
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
    // Check if Firebase is already initialized
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        console.log('🔥 Firebase already initialized');
        database = firebase.database();
    } else {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase initialized');
        database = firebase.database();
    }
    firebaseReady = true;
    console.log('📡 Database URL:', firebaseConfig.databaseURL);
    console.log('📡 Database:', database ? '✅ Connected' : '❌ Not connected');
} catch (e) {
    console.error('❌ Firebase init error:', e.message);
    firebaseReady = false;
}

// ============================================================
// DATABASE HELPER FUNCTIONS
// ============================================================
function getRef(path) {
    if (!database) {
        console.error('❌ Database not initialized');
        return null;
    }
    return database.ref(path);
}

function setData(path, data) {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.reject('Database not initialized');
    }
    console.log('📝 Setting data at:', path);
    return database.ref(path).set(data);
}

function pushData(path, data) {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.reject('Database not initialized');
    }
    console.log('📝 Pushing data to:', path);
    var newRef = database.ref(path).push();
    return newRef.set(data).then(function() {
        console.log('✅ Data pushed successfully');
        return { key: newRef.key, ref: newRef };
    });
}

function updateData(path, data) {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.reject('Database not initialized');
    }
    console.log('📝 Updating data at:', path);
    return database.ref(path).update(data);
}

function removeData(path) {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.reject('Database not initialized');
    }
    console.log('📝 Removing data at:', path);
    return database.ref(path).remove();
}

function onceData(path) {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.reject('Database not initialized');
    }
    console.log('📝 Reading data from:', path);
    return database.ref(path).once('value');
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
// ONLINE PRESENCE
// ============================================================
function setupPresence() {
    if (!database || !S || !S.username) {
        console.warn('⚠️ Cannot setup presence');
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
// EXPOSE GLOBALLY
// ============================================================
window.getRef = getRef;
window.setData = setData;
window.pushData = pushData;
window.updateData = updateData;
window.removeData = removeData;
window.onceData = onceData;
window.setupPresence = setupPresence;

console.log('🔒 Firebase module loaded');
console.log('📡 Status:', firebaseReady ? '✅ Ready' : '❌ Not Ready');