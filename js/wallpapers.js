// Wallpapers Module - Fixed with working URLs

let ALL_WALLPAPERS = [];
let currentWallpaperFilter = 'all';

const portraitWalls = [
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=600&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=600&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=600&q=80',
    'https://images.unsplash.com/photo-1540206395-68808572332f?w=600&q=80',
    'https://images.unsplash.com/photo-1553531384-397c884e6f0d?w=600&q=80',
    'https://images.unsplash.com/photo-1541697411518-77cce4e8a25c?w=600&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=600&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80'
];

const landscapeWalls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1200&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1200&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=1200&q=80',
    'https://images.unsplash.com/photo-1541697411518-77cce4e8a25c?w=1200&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1200&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1200&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&q=80'
];

function initWallpapers() {
    ALL_WALLPAPERS = [];
    
    portraitWalls.forEach(function(url) {
        ALL_WALLPAPERS.push({ url: url, type: 'portrait' });
    });
    
    landscapeWalls.forEach(function(url) {
        ALL_WALLPAPERS.push({ url: url, type: 'landscape' });
    });
    
    console.log('Wallpapers loaded: ' + ALL_WALLPAPERS.length);
    renderWallpapers();
}

function filterWallpapers(type) {
    currentWallpaperFilter = type;
    renderWallpapers();
}

function randomWallpaper() {
    const filtered = currentWallpaperFilter === 'all' ? ALL_WALLPAPERS : ALL_WALLPAPERS.filter(function(w) { return w.type === currentWallpaperFilter; });
    if (filtered.length > 0) {
        setWallpaper(filtered[Math.floor(Math.random() * filtered.length)].url);
    }
}

function setWallpaper(url) {
    console.log('Setting wallpaper:', url);
    S.wallpaper = url;
    
    // Apply to body
    document.body.style.backgroundImage = 'url(' + url + ')';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    
    // Save to Firebase
    if (S.username) {
        setData('users/' + S.username + '/wallpaper', url);
    }
    
    renderWallpapers();
    saveState();
    toast('✅ Wallpaper applied!');
}

function renderWallpapers() {
    const filtered = currentWallpaperFilter === 'all' ? ALL_WALLPAPERS : ALL_WALLPAPERS.filter(function(w) { return w.type === currentWallpaperFilter; });
    
    const countEl = document.getElementById('wpCount');
    if (countEl) countEl.textContent = filtered.length + ' wallpapers';
    
    const grid = document.getElementById('wpGrid');
    if (!grid) return;
    
    let html = '';
    filtered.forEach(function(w) {
        const selected = S.wallpaper === w.url;
        html += '<div class="wp-thumb ' + w.type + (selected ? ' selected' : '') + '" style="background-image:url(' + w.url + ')" onclick="setWallpaper(\'' + w.url + '\')" title="Click to apply"></div>';
    });
    grid.innerHTML = html;
    
    console.log('Rendered ' + filtered.length + ' wallpapers');
}

console.log('🎨 Wallpapers ready: ' + portraitWalls.length + ' portrait + ' + landscapeWalls.length + ' landscape');