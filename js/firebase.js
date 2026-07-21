// js/firebase.js - Firebase Config
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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Firebase Helpers
function getRef(path) { return database.ref(path); }

function setData(path, data) {
    const ref = getRef(path);
    ref.set(data);
}

function pushData(path, data) {
    const ref = getRef(path);
    const newRef = ref.push();
    newRef.set(data);
    return newRef.key;
}

function getData(path) {
    const ref = getRef(path);
    return ref.once('value').then(s => s.val());
}

console.log('🔥 Firebase initialized!');