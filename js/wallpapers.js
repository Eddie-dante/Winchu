// Wallpapers Module - Complete

var ALL_WALLPAPERS = [];
var currentWallpaperFilter = 'all';

var portraitWalls = [
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&q=80',
    'https://images.unsplash.com/photo-1557682224-5b8590cd9ec7?w=600&q=80',
    'https://images.unsplash.com/photo-1557682260-96773eb01377?w=600&q=80',
    'https://images.unsplash.com/photo-1557682204-e53adad40b4a?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
    'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=600&q=80',
    'https://images.unsplash.com/photo-1557683318-eee7a49db2a8?w=600&q=80',
    'https://images.unsplash.com/photo-1557683333-2c5e5ca1c9b7?w=600&q=80',
    'https://images.unsplash.com/photo-1557683350-25fdb2b16e9d?w=600&q=80',
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
    'https://images.unsplash.com/photo-1509316975860-0c2b9a2f5e6e?w=600&q=80',
    'https://images.unsplash.com/photo-1511497588688-9f3c6c6e0e3f?w=600&q=80',
    'https://images.unsplash.com/photo-1553531384-397c884e6f0d?w=600&q=80',
    'https://images.unsplash.com/photo-1523718865-6a5d4a0b7d3e?w=600&q=80',
    'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=600&q=80'
];

var landscapeWalls = [
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
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1200&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80'
];

function initWallpapers() {
    ALL_WALLPAPERS = [];
    
    portraitWalls.forEach(function(url) {
        ALL_WALLPAPERS.push({ url: url, type: 'portrait' });
    });
    
    landscapeWalls.forEach(function(url) {
        ALL_WALLPAPERS.push({ url: url, type: 'landscape' });
    });
    
    console.log('✅ Wallpapers loaded: ' + portraitWalls.length + ' portrait + ' + landscapeWalls.length + ' landscape = ' + ALL_WALLPAPERS.length + ' total');
    renderWallpapers();
}

function filterWallpapers(type) {
    currentWallpaperFilter = type;
    renderWallpapers();
}

function randomWallpaper() {
    var filtered = currentWallpaperFilter === 'all' ? ALL_WALLPAPERS : ALL_WALLPAPERS.filter(function(w) { return w.type === currentWallpaperFilter; });
    
    if (filtered.length === 0) { toast('No wallpapers in this category'); return; }
    
    var randomWall = filtered[Math.floor(Math.random() * filtered.length)];
    setWallpaper(randomWall.url);
}

function setWallpaper(url) {
    if (!url) { console.error('No wallpaper URL provided'); return; }
    
    console.log('Setting wallpaper:', url.substring(0, 50) + '...');
    
    S.wallpaper = url;
    
    document.body.style.backgroundImage = 'url(' + url + ')';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    
    if (S.username) {
        setData('users/' + S.username + '/wallpaper', url).then(function() {
            console.log('Wallpaper saved to Firebase');
        }).catch(function(error) {
            console.error('Error saving wallpaper:', error);
        });
    }
    
    saveState();
    renderWallpapers();
    toast('✅ Wallpaper applied!');
}

function renderWallpapers() {
    var filtered = currentWallpaperFilter === 'all' ? ALL_WALLPAPERS : ALL_WALLPAPERS.filter(function(w) { return w.type === currentWallpaperFilter; });
    
    var countEl = document.getElementById('wpCount');
    if (countEl) countEl.textContent = filtered.length + ' wallpapers available';
    
    var grid = document.getElementById('wpGrid');
    if (!grid) return;
    
    var html = '';
    
    filtered.forEach(function(wallpaper) {
        var selected = S.wallpaper === wallpaper.url;
        var typeClass = wallpaper.type === 'portrait' ? 'portrait' : 'landscape';
        
        html += '<div class="wp-thumb ' + typeClass + (selected ? ' selected' : '') + '" ' +
            'style="background-image:url(' + wallpaper.url + ')" ' +
            'onclick="setWallpaper(\'' + wallpaper.url + '\')" ' +
            'title="Click to apply this wallpaper">';
        html += '</div>';
    });
    
    grid.innerHTML = html;
    
    console.log('Rendered ' + filtered.length + ' wallpapers in grid');
}

function setDefaultWallpaper() {
    var defaultUrl = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80';
    setWallpaper(defaultUrl);
}

function getWallpaperCategories() {
    return [
        { id: 'all', name: 'All', count: ALL_WALLPAPERS.length },
        { id: 'portrait', name: '📱 Portrait', count: portraitWalls.length },
        { id: 'landscape', name: '🖥️ Landscape', count: landscapeWalls.length }
    ];
}

window.initWallpapers = initWallpapers;
window.filterWallpapers = filterWallpapers;
window.randomWallpaper = randomWallpaper;
window.setWallpaper = setWallpaper;
window.renderWallpapers = renderWallpapers;
window.setDefaultWallpaper = setDefaultWallpaper;
window.getWallpaperCategories = getWallpaperCategories;

console.log('🎨 Wallpapers module loaded - ' + portraitWalls.length + ' portrait + ' + landscapeWalls.length + ' landscape');