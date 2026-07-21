// js/profile.js - Profile Logic
const Profile = {
    render() {
        const avatarEmoji = App.state.selectedAuras.length > 0 ? App.state.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';
        document.getElementById('profileAvatarEmoji').textContent = avatarEmoji;
        document.getElementById('profileName').textContent = App.state.username  '—';
        document.getElementById('profileUsername').textContent = '@' + (App.state.username  '—');
        document.getElementById('profilePosts').textContent = Social ? Social.posts.filter(p => p.author === App.state.username).length : 0;
        document.getElementById('profileFollowers').textContent = (App.state.friends  []).length;
        document.getElementById('profileFollowing').textContent = (App.state.friends  []).length;
        document.getElementById('profileBio').textContent = App.state.bio  'Building my energy. One aura at a time. ⚡️';

        const grid = document.getElementById('profilePostsGrid');
        const userPosts = Social ? Social.posts.filter(p => p.author === App.state.username) : [];
        if (userPosts.length === 0) {
            grid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px 0;">No posts yet.</p>';
            return;
        }
        grid.innerHTML = userPosts.map(p =>
            `<div style="aspect-ratio:1;background-image:url('${p.image  UNSPLASH[Math.floor(Math.random() * UNSPLASH.length)]}');background-size:cover;background-position:center;border-radius:4px;cursor:pointer;" onclick="App.toast('${p.text.substring(0, 30)}...')"></div>`
        ).join('');
    },

    edit() {
        const newBio = prompt('Edit your bio:', App.state.bio  '');
        if (newBio !== null) {
            App.state.bio = newBio.trim()  'Building my energy. One aura at a time. ⚡️';
            if (App.state.username) setData(users/${App.state.username}/bio, App.state.bio);
            this.render();
            App.toast('✅ Bio updated');
        }
    },

    handleAvatarSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            App.state.avatar = data;
            if (App.state.username) setData(users/${App.state.username}/avatar, data);
            Profile.render();
            App.toast('✅ Avatar updated!');
        };
        reader.readAsDataURL(file);
    }
};

window.Profile = Profile;
window.editProfile = Profile.edit.bind(Profile);
window.handleAvatarSelect = Profile.handleAvatarSelect.bind(Profile);