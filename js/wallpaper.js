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
    var countEl = document.getElementById('wpCount');
    if (countEl) countEl.textContent = UNSPLASH.length + '+ wallpapers';

    var grid = document.getElementById('wpGrid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < UNSPLASH.length; i++) {
        var url = UNSPLASH[i];
        var selected = window.S.wallpaper === url;
        var cls = 'wp-thumb' + (selected ? ' selected' : '');
        html += '<div class="' + cls + '" style="background-image:url(' + url + ')" onclick="setWallpaper(\'' + url + '\')"></div>';
    }
    grid.innerHTML = html;
}
window.renderWallpapers = renderWallpapers;