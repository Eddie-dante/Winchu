// Wallpapers Module - Fixed with working URLs

const portraitWalls = [
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682224-5b8590cd9ec7?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682260-96773eb01377?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682204-e53adad40b4a?w=1080&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683318-eee7a49db2a8?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683333-2c5e5ca1c9b7?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683350-25fdb2b16e9d?w=1080&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1080&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1080&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=1080&q=80',
    'https://images.unsplash.com/photo-1540206395-68808572332f?w=1080&q=80',
    'https://images.unsplash.com/photo-1509316975860-0c2b9a2f5e6e?w=1080&q=80',
    'https://images.unsplash.com/photo-1511497588688-9f3c6c6e0e3f?w=1080&q=80',
    'https://images.unsplash.com/photo-1553531384-397c884e6f0d?w=1080&q=80',
    'https://images.unsplash.com/photo-1523718865-6a5d4a0b7d3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=1080&q=80',
    'https://images.unsplash.com/photo-1557675858-0f6b5f9e6a7c?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682257-2f9c37a3a5f3?w=1080&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1080&q=80',
    'https://images.unsplash.com/photo-1544961000-1f0c1d6f1c1f?w=1080&q=80',
    'https://images.unsplash.com/photo-1519904985603-4e1a4a4e2b2b?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682204-e53adad40b4a?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683333-2c5e5ca1c9b7?w=1080&q=80',
    'https://images.unsplash.com/photo-1557683350-25fdb2b16e9d?w=1080&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682260-96773eb01377?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682224-5b8590cd9ec7?w=1080&q=80',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1080&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1080&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&q=80',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1080&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1080&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1080&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1080&q=80',
    'https://images.unsplash.com/photo-1647811867884-b14ab4f81b36?w=1080&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1080&q=80',
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1080&q=80',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1080&q=80',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1080&q=80',
    'https://images.unsplash.com/photo-1575377501614-f1d565d84756?w=1080&q=80',
    'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?w=1080&q=80',
    'https://images.unsplash.com/photo-1736580602088-73d0f3ad8add?w=1080&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1080&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1080&q=80',
    'https://images.unsplash.com/photo-1541697411518-77cce4e8a25c?w=1080&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1080&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1080&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=1080&q=80'
];

const landscapeWalls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1920&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1920&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=1920&q=80',
    'https://images.unsplash.com/photo-1541697411518-77cce4e8a25c?w=1920&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1920&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=80',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1920&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1920&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1920&q=80',
    'https://images.unsplash.com/photo-1647811867884-b14ab4f81b36?w=1920&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1920&q=80',
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1920&q=80',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1920&q=80',
    'https://images.unsplash.com/photo-1575377501614-f1d565d84756?w=1920&q=80',
    'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?w=1920&q=80',
    'https://images.unsplash.com/photo-1736580602088-73d0f3ad8add?w=1920&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
    'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1920&q=80',
    'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1920&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
    'https://images.unsplash.com/photo-1533050487297-09b450131914?w=1920&q=80',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    'https://images.unsplash.com/photo-1541697411518-77cce4e8a25c?w=1920&q=80',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1920&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=80',
    'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=1920&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1920&q=80',
    'https://images.unsplash.com/photo-1647811867884-b14ab4f81b36?w=1920&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1920&q=80',
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1920&q=80',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1920&q=80',
    'https://images.unsplash.com/photo-1575377501614-f1d565d84756?w=1920&q=80'
];

function initWallpapers() {
    ALL_WALLPAPERS = [];
    
    portraitWalls.forEach(url => {
        ALL_WALLPAPERS.push({ url: url, type: 'portrait' });
    });
    
    landscapeWalls.forEach(url => {
        ALL_WALLPAPERS.push({ url: url, type: 'landscape' });
    });
    
    console.log(`✅ Wallpapers loaded: ${portraitWalls.length} portrait + ${landscapeWalls.length} landscape = ${ALL_WALLPAPERS.length} total`);
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
    
    const randomWall = filtered[Math.floor(Math.random() * filtered.length)];
    setWallpaper(randomWall.url);
}

function setWallpaper(url) {
    if (!url) {
        console.error('No URL provided');
        return;
    }
    
    S.wallpaper = url;
    
    // Apply wallpaper to body
    document.body.style.backgroundImage = `url('${url}')`;
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
            style="background-image: url('${w.url}')" 
            onclick="setWallpaper('${w.url}')" 
            title="Click to apply this wallpaper">
        </div>`;
    }).join('');
}

console.log(`🎨 Wallpapers ready: ${portraitWalls.length} portrait + ${landscapeWalls.length} landscape`);