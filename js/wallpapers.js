// Wallpapers Module

function initWallpapers() {
    ALL_WALLPAPERS = [];
    
    // Portrait wallpapers (40 wallpapers)
    const portraitIds = [
        '1557682250', '1506905925346', '1464822759023', '1441974231531',
        '1507525428034', '1518837695005', '1454496522488', '1484480974693',
        '1470071459606', '1440589473619', '1500382017468', '1533050487297',
        '1541697411518', '1523712999613', '1497436072909', '1469475937061',
        '1504198453319', '1532270912911', '1541807084', '1559827299',
        '1507525428034', '1518837695005', '1454496522488', '1484480974693',
        '1506905925346', '1464822759023', '1441974231531', '1557682250',
        '1470071459606', '1440589473619', '1500382017468', '1533050487297',
        '1541697411518', '1523712999613', '1497436072909', '1469475937061',
        '1504198453319', '1532270912911', '1541807084', '1559827299'
    ];
    
    // Landscape wallpapers (30 wallpapers)
    const landscapeIds = [
        '1506744038136', '1501785888041', '1470071459606', '1440589473619',
        '1500382017468', '1518837695005', '1507525428034', '1441974231531',
        '1557682250', '1464822759023', '1454496522488', '1484480974693',
        '1506905925346', '1533050487297', '1541697411518', '1523712999613',
        '1497436072909', '1469475937061', '1504198453319', '1532270912911',
        '1541807084', '1559827299', '1507525428034', '1518837695005',
        '1454496522488', '1484480974693', '1506905925346', '1464822759023',
        '1441974231531', '1557682250'
    ];
    
    portraitIds.forEach(id => {
        ALL_WALLPAPERS.push({
            url: `https://images.unsplash.com/photo-${id}?w=1080&q=80`,
            type: 'portrait'
        });
    });
    
    landscapeIds.forEach(id => {
        ALL_WALLPAPERS.push({
            url: `https://images.unsplash.com/photo-${id}?w=1920&q=80`,
            type: 'landscape'
        });
    });
    
    renderWallpapers();
}

function filterWallpapers(type) {
    currentWallpaperFilter = type;
    renderWallpapers();
}

function randomWallpaper() {
    const filtered = currentWallpaperFilter === 'all' ?
        ALL_WALLPAPERS :
        ALL_WALLPAPERS.filter(w => w.type === currentWallpaperFilter);
    
    if (filtered.length === 0) {
        toast('No wallpapers in this category');
        return;
    }
    
    setWallpaper(filtered[Math.floor(Math.random() * filtered.length)].url);
}

function setWallpaper(url) {
    S.wallpaper = url;
    
    // Apply wallpaper to body
    document.body.style.backgroundImage = `url(${url})`;
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
    const filtered = currentWallpaperFilter === 'all' ?
        ALL_WALLPAPERS :
        ALL_WALLPAPERS.filter(w => w.type === currentWallpaperFilter);
    
    const countEl = document.getElementById('wpCount');
    if (countEl) countEl.textContent = filtered.length + ' wallpapers available';
    
    const grid = document.getElementById('wpGrid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(w => {
        const selected = S.wallpaper === w.url;
        return `<div class="wp-thumb ${w.type}${selected ? ' selected' : ''}" 
            style="background-image:url(${w.url})" 
            onclick="setWallpaper('${w.url}')" 
            title="Click to apply"></div>`;
    }).join('');
}