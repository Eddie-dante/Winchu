// js/wallpapers.js - Wallpaper Logic
const Wallpapers = {
    list: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80',
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
        'https://images.unsplash.com/photo-1470071459606-3b5ec3a7fe05?w=1920&q=80',
        'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=1920&q=80',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
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
        'https://images.unsplash.com/photo-1736580602088-73d0f3ad8add?w=1920&q=80'
    ],

    random() {
        this.set(this.list[Math.floor(Math.random() * this.list.length)]);
    },

    set(url) {
        App.state.wallpaper = url;
        App.setBg(url);
        this.render();
        App.toast('✅ Applied');
    },

    render() {
        document.getElementById('wpCount').textContent = this.list.length + '+ wallpapers';
        document.getElementById('wpGrid').innerHTML = this.list.map(url => {
            const selected = App.state.wallpaper === url;
            return <div class="wp-thumb${selected ? ' selected' : ''}" style="background-image:url('${url}')" onclick="Wallpapers.set('${url}')"></div>;
        }).join('');
    }
};

window.Wallpapers = Wallpapers;
window.randomWallpaper = Wallpapers.random.bind(Wallpapers);
window.setWallpaper = Wallpapers.set.bind(Wallpapers);