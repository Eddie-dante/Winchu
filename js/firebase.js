// Firebase Configuration - Simplified
var firebaseConfig = {
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
var database = firebase.database();
console.log('Firebase initialized');

// Simple helper functions
function getRef(path) {
    return database.ref(path);
}

function setData(path, data) {
    return database.ref(path).set(data);
}

function pushData(path, data) {
    var newRef = database.ref(path).push();
    return newRef.set(data).then(function() {
        return { key: newRef.key };
    });
}

function updateData(path, data) {
    return database.ref(path).update(data);
}

function removeData(path) {
    return database.ref(path).remove();
}

// Setup presence
function setupPresence() {
    if (!S || !S.username) return;
    
    database.ref('.info/connected').on('value', function(snap) {
        if (snap.val() === true && S.username) {
            database.ref('users/' + S.username).onDisconnect().update({
                online: false,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            database.ref('users/' + S.username).update({
                online: true,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

// Log connection status
database.ref('.info/connected').on('value', function(snap) {
    console.log('Firebase:', snap.val() ? 'ONLINE' : 'OFFLINE');
});