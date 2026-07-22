// Firebase Configuration
var firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();
console.log('Firebase ready');

// Test connection
db.ref('.info/connected').on('value', function(s) {
    console.log(s.val() ? '✅ ONLINE' : '❌ OFFLINE');
});

function getRef(p) { return db.ref(p); }
function setData(p, d) { return db.ref(p).set(d); }
function pushData(p, d) { return db.ref(p).push(d); }
function updateData(p, d) { return db.ref(p).update(d); }
function removeData(p) { return db.ref(p).remove(); }

function setupPresence() {
    if (!S || !S.username) return;
    db.ref('.info/connected').on('value', function(snap) {
        if (snap.val() === true && S.username) {
            db.ref('users/' + S.username).onDisconnect().update({ online: false });
            db.ref('users/' + S.username).update({ online: true });
        }
    });
}