// Call render functions
                        if (page === 'select' && typeof Auras !== 'undefined') Auras.render();
                        if (page === 'home' && typeof Dashboard !== 'undefined') Dashboard.render();
                        if (page === 'users' && typeof Users !== 'undefined') Users.render();
                        if (page === 'diary' && typeof Diary !== 'undefined') Diary.render();
                        if (page === 'routine' && typeof Routine !== 'undefined') Routine.render();
                        if (page === 'chat' && typeof Chat !== 'undefined') Chat.render();
                        if (page === 'social' && typeof Social !== 'undefined') Social.render();
                        if (page === 'profile' && typeof Profile !== 'undefined') Profile.render();
                        if (page === 'wallpapers' && typeof Wallpapers !== 'undefined') Wallpapers.render();

                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    })
                    .catch(err => {
                        console.error('Failed to load page:', err);
                        container.innerHTML = <div class="page active"><div class="container"><p style="color:red;">Failed to load page: ${page}</p></div></div>;
                    });
                return;
            }
            
            // Page already loaded
            document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
            pageEl.classList.add('active');

            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active');
                if (b.dataset.page === page) b.classList.add('active');
            });

            const nav = document.getElementById('bottomNav');
            const hideNav = ['landing', 'login', 'signup', 'select'];
            nav.style.display = hideNav.includes(page) ? 'none' : 'flex';

            if (page === 'select' && typeof Auras !== 'undefined') Auras.render();
            if (page === 'home' && typeof Dashboard !== 'undefined') Dashboard.render();
            if (page === 'users' && typeof Users !== 'undefined') Users.render();
            if (page === 'diary' && typeof Diary !== 'undefined') Diary.render();
            if (page === 'routine' && typeof Routine !== 'undefined') Routine.render();
            if (page === 'chat' && typeof Chat !== 'undefined') Chat.render();
            if (page === 'social' && typeof Social !== 'undefined') Social.render();
            if (page === 'profile' && typeof Profile !== 'undefined') Profile.render();
            if (page === 'wallpapers' && typeof Wallpapers !== 'undefined') Wallpapers.render();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    logout() {
        if (!confirm('Logout?')) return;
        this.state.username = '';
        localStorage.removeItem(this.AUTH_KEY);
        document.getElementById('wpFab').style.display = 'none';
        if (window.Chat && Chat.cleanup) Chat.cleanup();
        if (window.Social && Social.cleanup) Social.cleanup();
        this.toast('Logged out');
        this.navigate('landing');
    }
};

// Make globally available
window.App = App;
window.navigate = App.navigate.bind(App);
window.toast = App.toast.bind(App);
window.logout = App.logout.bind(App);