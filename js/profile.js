// ==================== PROFILE LOGIC ====================
function handleAvatarSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedAvatarData = e.target.result;
        S.avatar = selectedAvatarData;
        if (S.username) {
            setData(`users/${S.username}/avatar`, selectedAvatarData);
        }
        renderProfile();
        toast('✅ Avatar updated!');
    };
    reader.readAsDataURL(file);
}

function renderProfile() {
    const avatarEmoji = S.selectedAuras.length > 0 ? S.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';
    
    const avatarEl = document.getElementById('profileAvatarEmoji');
    if (avatarEl) avatarEl.textContent = avatarEmoji;
    
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = S.username || '—';
    
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = '@' + (S.username || '—');
    
    const postsEl = document.getElementById('profilePosts');
    if (postsEl) postsEl.textContent = S.socialPosts.filter(p => p.author === S.username).length;
    
    const followersEl = document.getElementById('profileFollowers');
    if (followersEl) followersEl.textContent = Math.floor(Math.random() * 100) + 10;
    
    const followingEl = document.getElementById('profileFollowing');
    if (followingEl) followingEl.textContent = Math.floor(Math.random() * 50) + 5;
    
    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = S.bio || 'Building my energy. One aura at a time. ⚡';

    const grid = document.getElementById('profilePostsGrid');
    if (!grid) return;
    const userPosts = S.social