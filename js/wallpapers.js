@"
// ==================== WALLPAPER LOGIC ====================
function randomWallpaper() {
    setWallpaper(UNSPLASH[Math.floor(Math.random() * UNSPLASH.length)]);
}
window.randomWallpaper = randomWallpaper;

function setWallpaper(url) {
    window.S.wallpaper = url;
    window.setBg(url);
    renderWallpapers();
    window.toast('✅ Applied');
}
window.setWallpaper = setWallpaper;

function renderWallpapers() {
    const countEl = document.getElementById('wpCount');
    if (countEl) countEl.textContent = UNSPLASH.length + '+ wallpapers';

    const grid = document.getElementById('wpGrid');
    if (!grid) return;
    grid.innerHTML = UNSPLASH.map(url => {
        const selected = window.S.wallpaper === url;
        return `<div class=\"wp-thumb${selected ? ' selected' : ''}\" style=\"background-image:url('${url}')\" onclick=\"setWallpaper('${url}')\"></div>`;
    }).join('');
}
window.renderWallpapers = renderWallpapers;
"@ | Out-File -FilePath js/wallpapers.js -Encoding utf8