// Profile Logic
function handleAvatarSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        window.selectedAvatarData = e.target.result;
        window.S.avatar = window.selectedAvatarData;
        if (window.S.username) {
            setData('users/' + window.S.username + '/avatar', window.selectedAvatarData);
        }
        renderProfile();
        window.toast('Avatar updated!');
    };
    reader.readAsDataURL(file);
}
window.handleAvatarSelect = handleAvatarSelect;

function renderProfile() {
    var avatarEmoji = window.S.selectedAuras.length > 0 ? window.S.selectedAuras.map(function(k) { return AURAS[k].emoji; }).join('') : '😊';
    var avatarEl = document.getElementById('profileAvatarEmoji');
    if (avatarEl) avatarEl.textContent = avatarEmoji;
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = window.S.username || '—';
    var usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = '@' + (window.S.username || '—');
    var postsEl = document.getElementById('profilePosts');
    if (postsEl) {
        var userPosts = window.S.socialPosts.filter(function(p) { return p.author === window.S.username; });
        postsEl.textContent = userPosts.length;
    }
    var followersEl = document.getElementById('profileFollowers');
    if (followersEl) followersEl.textContent = Math.floor(Math.random() * 100) + 10;
    var followingEl = document.getElementById('profileFollowing');
    if (followingEl) followingEl.textContent = Math.floor(Math.random() * 50) + 5;
    var bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = window.S.bio || 'Building my energy. One aura at a time.';
    var grid = document.getElementById('profilePostsGrid');
    if (!grid) return;
    var userPosts2 = window.S.socialPosts.filter(function(p) { return p.author === window.S.username; });
    if (userPosts2.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px 0;">No posts yet.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < userPosts2.length; i++) {
        var p = userPosts2[i];
        var img = p.image || UNSPLASH[Math.floor(Math.random() * UNSPLASH.length)];
        var text = p.text.substring(0, 30);
        html += '<div style="aspect-ratio:1;background-image:url(' + img + ');background-size:cover;background-position:center;border-radius:4px;cursor:pointer;" onclick="window.toast(\'' + text + '...\')"></div>';
    }
    grid.innerHTML = html;
}
window.renderProfile = renderProfile;

function editProfile() {
    var newBio = prompt('Edit your bio:', window.S.bio || '');
    if (newBio !== null) {
        window.S.bio = newBio.trim() || 'Building my energy. One aura at a time.';
        if (window.S.username) {
            setData('users/' + window.S.username + '/bio', window.S.bio);
        }
        renderProfile();
        window.toast('Bio updated');
    }
}
window.editProfile = editProfile;