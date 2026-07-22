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
    // Check if Firebase is already initialized
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    firebaseReady = true;
    console.log('🔥 Firebase initialized successfully');
    console.log('📡 Database URL:', firebaseConfig.databaseURL);
} catch (e) {
    console.error('❌ Firebase init error:', e.message);
    console.error('Please check your Firebase configuration.');
    firebaseReady = false;
}

// ============================================================
// DATABASE REFERENCE HELPERS
// ============================================================
var db = {
    ref: function(path) {
        if (!database) {
            console.error('Database not initialized. Cannot access:', path);
            return createFallbackRef();
        }
        return database.ref(path);
    }
};

// Create a fallback reference for when database is not available
function createFallbackRef() {
    var fallbackData = {};
    
    return {
        once: function() {
            return Promise.resolve({
                exists: function() { return false; },
                val: function() { return fallbackData; }
            });
        },
        on: function(event, callback) {
            console.log('Fallback listener registered for:', event);
            return this;
        },
        off: function() {
            return this;
        },
        set: function(data) {
            console.log('Fallback set called with:', data);
            return Promise.resolve();
        },
        update: function(data) {
            console.log('Fallback update called with:', data);
            return Promise.resolve();
        },
        push: function(data) {
            var key = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            console.log('Fallback push called with key:', key);
            return {
                key: key,
                set: function(d) {
                    fallbackData[key] = d;
                    return Promise.resolve();
                }
            };
        },
        remove: function() {
            return Promise.resolve();
        },
        orderByChild: function() { return this; },
        orderByKey: function() { return this; },
        limitToLast: function() { return this; },
        limitToFirst: function() { return this; }
    };
}

// ============================================================
// GLOBAL HELPER FUNCTIONS
// ============================================================
function getRef(path) {
    return db.ref(path);
}

function setData(path, data) {
    if (!database) {
        console.warn('Database not available. Data not saved.');
        return Promise.resolve();
    }
    return database.ref(path).set(data).catch(function(error) {
        console.error('setData error at', path, ':', error.message);
        throw error;
    });
}

function pushData(path, data) {
    if (!database) {
        console.warn('Database not available. Data not saved.');
        return Promise.resolve({ key: 'local_' + Date.now() });
    }
    var newRef = database.ref(path).push();
    return newRef.set(data).then(function() {
        return { key: newRef.key, ref: newRef };
    }).catch(function(error) {
        console.error('pushData error at', path, ':', error.message);
        throw error;
    });
}

function updateData(path, data) {
    if (!database) {
        console.warn('Database not available. Data not updated.');
        return Promise.resolve();
    }
    return database.ref(path).update(data).catch(function(error) {
        console.error('updateData error at', path, ':', error.message);
        throw error;
    });
}

function removeData(path) {
    if (!database) {
        console.warn('Database not available. Data not removed.');
        return Promise.resolve();
    }
    return database.ref(path).remove().catch(function(error) {
        console.error('removeData error at', path, ':', error.message);
        throw error;
    });
}

// ============================================================
// CONNECTION MONITORING
// ============================================================
var isConnected = false;
var connectionListeners = [];

function onConnectionChange(callback) {
    connectionListeners.push(callback);
}

function notifyConnectionListeners(status) {
    connectionListeners.forEach(function(callback) {
        try { callback(status); } catch(e) {}
    });
}

if (database) {
    database.ref('.info/connected').on('value', function(snapshot) {
        isConnected = snapshot.val() === true;
        
        if (isConnected) {
            console.log('✅ Connected to Firebase Realtime Database');
        } else {
            console.log('❌ Disconnected from Firebase - attempting to reconnect...');
        }
        
        notifyConnectionListeners(isConnected);
    });
}

// ============================================================
// CONNECTION CHECK
// ============================================================
function checkConnection() {
    if (!database) {
        return Promise.resolve(false);
    }
    
    return new Promise(function(resolve) {
        var timeout = setTimeout(function() {
            resolve(false);
        }, 5000);
        
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
        console.warn('Cannot setup presence - missing database or user');
        return;
    }
    
    var userRef = database.ref('users/' + S.username);
    var connectedRef = database.ref('.info/connected');
    
    connectedRef.on('value', function(snapshot) {
        if (snapshot.val() === true) {
            // Connected - set online status
            userRef.onDisconnect().update({
                online: false,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            
            userRef.update({
                online: true,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('✅ Presence set for:', S.username);
        } else {
            console.log('❌ Cannot set presence - offline');
        }
    });
}

// ============================================================
// RETRY MECHANISM
// ============================================================
var retryAttempts = 0;
var maxRetries = 3;

function retryOperation(operation, path, data) {
    return operation(path, data).catch(function(error) {
        retryAttempts++;
        if (retryAttempts < maxRetries) {
            console.log('Retrying operation (attempt ' + retryAttempts + '/' + maxRetries + ')');
            return new Promise(function(resolve) {
                setTimeout(function() {
                    resolve(retryOperation(operation, path, data));
                }, 1000 * retryAttempts);
            });
        }
        retryAttempts = 0;
        throw error;
    });
}

// ============================================================
// DATABASE STATISTICS
// ============================================================
function getDatabaseStats() {
    if (!database) return Promise.resolve(null);
    
    var stats = {
        users: 0,
        posts: 0,
        videos: 0,
        groups: 0,
        connected: isConnected
    };
    
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
    ]).then(function() {
        return stats;
    });
}

// ============================================================
// CLEANUP OLD DATA (optional utility)
// ============================================================
function cleanupOldData() {
    if (!database) return;
    
    var cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Clean old statuses
    database.ref('statuses').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(function(key) {
                var status = data[key];
                if (status && status.expires && new Date(status.expires) < new Date()) {
                    database.ref('statuses/' + key).remove();
                }
            });
        }
    });
    
    console.log('🧹 Cleanup complete');
}

// ============================================================
// TEST CONNECTION
// ============================================================
function testConnection() {
    if (!database) {
        console.error('❌ Database not initialized');
        return Promise.resolve(false);
    }
    
    var startTime = Date.now();
    
    return database.ref('.info/connected').once('value').then(function(snapshot) {
        var latency = Date.now() - startTime;
        var connected = snapshot.val() === true;
        
        console.log('Connection test:', connected ? '✅ Connected' : '❌ Disconnected');
        console.log('Latency:', latency + 'ms');
        console.log('Database URL:', firebaseConfig.databaseURL);
        
        return {
            connected: connected,
            latency: latency,
            url: firebaseConfig.databaseURL
        };
    }).catch(function(error) {
        console.error('❌ Connection test failed:', error.message);
        return {
            connected: false,
            latency: -1,
            error: error.message
        };
    });
}

// ============================================================
// LOG CONNECTION STATUS
// ============================================================
if (database) {
    database.ref('.info/connected').on('value', function(snapshot) {
        var status = snapshot.val() === true ? '✅ ONLINE' : '❌ OFFLINE';
        console.log('Firebase:', status);
    });
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.db = db;
window.getRef = getRef;
window.setData = setData;
window.pushData = pushData;
window.updateData = updateData;
window.removeData = removeData;
window.setupPresence = setupPresence;
window.checkConnection = checkConnection;
window.onConnectionChange = onConnectionChange;
window.getDatabaseStats = getDatabaseStats;
window.testConnection = testConnection;
window.cleanupOldData = cleanupOldData;
window.isConnected = function() { return isConnected; };

console.log('🔒 Firebase module loaded');
console.log('📡 Status:', firebaseReady ? 'Ready' : 'Not Ready');
console.log('🔗 URL:', firebaseConfig.databaseURL);