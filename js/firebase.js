// Firebase Configuration for Nexus Project
const firebaseConfig = {
    apiKey: "AIzaSyBxRC99vpLBRpkhXmUiYVXi0lFaN5ayXj8",
    authDomain: "nexus-wegem.firebaseapp.com",
    databaseURL: "https://nexus-wegem-default-rtdb.firebaseio.com",
    projectId: "nexus-wegem",
    storageBucket: "nexus-wegem.firebasestorage.app",
    messagingSenderId: "383870608188",
    appId: "1:383870608188:web:043f97e81bcb6dbb68b439",
    measurementId: "G-GGNFGS1MEL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
        if (snap.val() === true && window.S && window.S.username) {
            const userRef = database.ref('users/' + window.S.username);
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

console.log('🔥 Firebase initialized - Nexus Project');