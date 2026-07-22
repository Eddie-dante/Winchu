function handleLogin() {
    console.log('Login function called');
    
    const usernameEl = document.getElementById('loginUser');
    const passwordEl = document.getElementById('loginPass');
    
    if (!usernameEl || !passwordEl) {
        toast('Form not found. Please refresh.');
        return;
    }
    
    const usernameVal = usernameEl.value.trim();
    const passwordVal = passwordEl.value.trim();
    
    console.log('Login attempt for:', usernameVal);
    
    if (!usernameVal || !passwordVal) {
        toast('Please fill all fields');
        return;
    }
    
    getRef('users/' + usernameVal).once('value').then(function(snapshot) {
        if (!snapshot.exists()) {
            console.log('User not found:', usernameVal);
            toast('User not found. Please check your username.');
            return;
        }
        
        const userData = snapshot.val();
        
        if (userData.password !== passwordVal) {
            console.log('Password incorrect for:', usernameVal);
            toast('Incorrect password. Please try again.');
            return;
        }
        
        console.log('Login successful for:', usernameVal);
        
        S.username = usernameVal;
        S.name = userData.name || '';
        S.bio = userData.bio || 'Building my energy. ⚡';
        S.selectedAuras = userData.selected_auras || [];
        S.avatar = userData.avatar || null;
        S.wallpaper = userData.wallpaper || null;
        S.friends = userData.friends || [];
        S.bookmarks = userData.bookmarks || [];
        S.completedTasks = [];
        S.streakData = {};
        S.diary = [];
        S.routines = [];
        S.notifications = [];
        S.groups = [];
        S.videoData = [];
        S.socialPosts = [];
        
        saveState();
        localStorage.setItem('winchu_auth', JSON.stringify({
            username: usernameVal,
            timestamp: Date.now()
        }));
        
        setupPresence();
        loadUserData(usernameVal);
        
        // Clear form fields
        usernameEl.value = '';
        passwordEl.value = '';
        
        // Apply wallpaper
        if (S.wallpaper) {
            document.body.style.backgroundImage = 'url(' + S.wallpaper + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
        
        toast('Welcome back! ✨');
        
        if (S.selectedAuras.length === 0) {
            navigate('select');
        } else {
            navigate('social');
            // Initialize all features which will load all data
            initAll();
            // Also load all users
            if (typeof loadAllUsers === 'function') loadAllUsers();
        }
    }).catch(function(error) {
        console.error('Login error:', error);
        toast('Error logging in. Please check your connection.');
    });
}