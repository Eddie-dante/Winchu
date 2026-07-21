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
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80'
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