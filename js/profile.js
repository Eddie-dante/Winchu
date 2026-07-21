@"
// ==================== PROFILE LOGIC ====================
function handleAvatarSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        window.selectedAvatarData = e.target.result;
        window.S.avatar = window.selectedAvatarData;
        if (window.S.username) {
            setData(`users/${window.S.username}/avatar`, window.selectedAvatarData);
        }
        renderProfile();
        window.toast('✅ Avatar updated!');
    };
    reader.readAsDataURL(file);
}
window.handleAvatarSelect = handleAvatarSelect;

function renderProfile() {
    const avatarEmoji = window.S.selectedAuras.length > 0 ? window.S.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';

    const avatarEl = document.getElementById('profileAvatarEmoji');
    if (avatarEl) avatarEl.textContent = avatarEmoji;

    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = window.S.username || '—';

    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = '@' + (window.S.username || '—');

    const postsEl = document.getElementById('profilePosts');
    if (postsEl) postsEl.textContent = window.S.socialPosts.filter(p => p.author === window.S.username).length;

    const followersEl = document.getElementById('profileFollowers');
    if (followersEl) followersEl.textContent = Math.floor(Math.random() * 100) + 10;

    const followingEl = document.getElementById('profileFollowing');
    if (followingEl) followingEl.textContent = Math.floor(Math.random() * 50) + 5;

    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = window.S.bio || 'Building my energy. One aura at a time. ⚡';

    const grid = document.getElementById('profilePostsGrid');
    if (!grid) return;
    const userPosts = window.S.socialPosts.filter(p => p.author === window.S.username);
    if (userPosts.length === 0) {
        grid.innerHTML = '<p style=\"color:#94a3b8;text-align:center;grid-column:1/-1;padding:16px 0;\">No posts yet.</p>';
        return;
    }
    grid.innerHTML = userPosts.map(p =>
        `<div style=\"aspect-ratio:1;background-image:url('${p.image || UNSPLASH[Math.floor(Math.random() * UNSPLASH.length)]}');background-size:cover;background-position:center;border-radius:4px;cursor:pointer;\" onclick=\"window.toast('${p.text.substring(0, 30)}...')\"></div>`
    ).join('');
}
window.renderProfile = renderProfile;

function editProfile() {
    const newBio = prompt('Edit your bio:', window.S.bio || '');
    if (newBio !== null) {
        window.S.bio = newBio.trim() || 'Building my energy. One aura at a time. ⚡';
        if (window.S.username) {
            setData(`users/${window.S.username}/bio`, window.S.bio);
        }
        renderProfile();
        window.toast('✅ Bio updated');
    }
}
window.editProfile = editProfile;
"@ | Out-File -FilePath js/profile.js -Encoding utf8