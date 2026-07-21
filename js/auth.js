// js/auth.js - Auth Functions
const Auth = {
    handleSignup() {
        const name = document.getElementById('signupName').value.trim();
        const user = document.getElementById('signupUser').value.trim();
        const pass = document.getElementById('signupPass').value.trim();
        if (!name  !user  !pass) { App.toast('Please fill all fields'); return; }
        if (pass.length < 4) { App.toast('Password must be at least 4 characters'); return; }

        const usersRef = getRef('users');
        usersRef.once('value', function(snapshot) {
            const users = snapshot.val()  {};
            if (users[user]) { App.toast('Username already exists'); return; }
            users[user] = {
                name: name,
                password: pass,
                bio: 'Building my energy. One aura at a time. ⚡️',
                wallpaper: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
                selected_auras: [],
                created: new Date().toISOString(),
                last_seen: new Date().toISOString()
            };
            usersRef.set(users);

            App.state.username = user;
            App.state.selectedAuras = [];
            App.state.completedTasks = [];
            App.state.streakData = {};
            App.state.diary = [];
            App.state.routines = [];
            App.state.socialPosts = [];
            App.state.likedPosts = [];
            App.state.bio = 'Building my energy. One aura at a time. ⚡️';
            App.state.wallpaper = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80';
            App.state.friends = [];
            App.state.friendRequests = [];
            App.saveAuth();
            App.setBg(App.state.wallpaper);
            App.toast('Account created! Welcome ' + name);
            document.getElementById('wpFab').style.display = 'flex';
            App.navigate('select');
        });
    },

    handleLogin() {
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        if (!user  !pass) { App.toast('Enter username and password'); return; }

        const usersRef = getRef('users');
        usersRef.once('value', function(snapshot) {
            const users = snapshot.val()  {};
            if (!users[user]  users[user].password !== pass) {
                App.toast('Invalid credentials');
                return;
            }
            App.state.username = user;
            App.state.bio = users[user].bio  'Building my energy. One aura at a time. ⚡️';
            App.state.wallpaper = users[user].wallpaper  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80';
            App.state.selectedAuras = users[user].selected_auras || [];
            App.saveAuth();
            App.setBg(App.state.wallpaper);
            setData(users/${App.state.username}/last_seen, new Date().toISOString());
            document.getElementById('wpFab').style.display = 'flex';
            
            // Load data
            if (window.Chat) Chat.loadUserData();
            if (window.Diary) Diary.load();
            if (window.Routine) Routine.load();
            if (window.Social) Social.setupListeners();
            if (window.Friends) Friends.loadFriendsList();
            if (window.Friends) Friends.loadFriendRequests();

            App.toast('Welcome back, ' + users[user].name);
            App.navigate('social');
        });
    }
};

window.handleSignup = Auth.handleSignup;
window.handleLogin = Auth.handleLogin;