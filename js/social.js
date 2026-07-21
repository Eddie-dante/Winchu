// js/social.js - Social Feed
const Social = {
    posts: [],
    postsListener: null,

    setupListeners() {
        if (this.postsListener) this.postsListener.off();
        const postsRef = getRef('posts');
        this.postsListener = postsRef.orderByKey().limitToLast(50);
        this.postsListener.on('child_added', function(snapshot) {
            const post = snapshot.val();
            post.id = snapshot.key;
            if (!Social.posts.find(p => p.id === post.id)) {
                Social.posts.unshift(post);
                if (Social.posts.length > 50) Social.posts.pop();
                Social.render();
            }
        });
    },

    createPost() {
        const input = document.getElementById('postInput');
        const text = input.value.trim();
        const fileData = window.selectedFileData  null;
        if (!text && !fileData) { App.toast('Write something or add media'); return; }

        const avatar = App.state.selectedAuras.length > 0 ? App.state.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';
        const post = {
            author: App.state.username  'You',
            avatar: avatar,
            text: text  '',
            image: fileData  null,
            time: new Date().toISOString(),
            likes: []
        };
        const postsRef = getRef('posts');
        postsRef.push(post);
        input.value = '';
        window.selectedFileData = null;
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('filePreview').innerHTML = '';
        App.toast('📝 Posted!');
    },

    likePost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;
        const likes = post.likes  [];
        const idx = likes.indexOf(App.state.username);
        if (idx > -1) likes.splice(idx, 1);
        else likes.push(App.state.username);
        post.likes = likes;
        const postRef = getRef(`posts/${id}/likes`);
        postRef.set(likes);
        this.render();
    },

    deletePost(id) {
        if (!confirm('Delete this post?')) return;
        const postRef = getRef(`posts/${id}`);
        postRef.remove();
        this.posts = this.posts.filter(p => p.id !== id);
        this.render();
        this.renderStories();
    },

    renderStories() {
        const row = document.getElementById('storyRow');
        if (!row) return;
        const users = [...new Set(this.posts.map(p => p.author))];
        if (users.length === 0) {
            row.innerHTML = '<div style="display:flex;gap:10px;padding:4px 0;color:#94a3b8;font-size:12px;">No stories yet</div>';
            return;
        }
        row.innerHTML = users.slice(0, 10).map(u => {
            const post = this.posts.find(p => p.author === u);
            const emoji = post ? post.avatar : '😊';
            return `<div class="ig-story"><div class="ig-story-avatar"><div class="inner">${emoji}</div></div><span class="ig-story-name">${u}</span></div>`;
        }).join('');
    },

    render() {
        const feed = document.getElementById('socialFeed');
        if (!feed) return;
        const avatarEl = document.getElementById('postAvatarEmoji');
        if (avatarEl) {
            avatarEl.textContent = App.state.selectedAuras.length > 0 ? App.state.selectedAuras.map(k => AURAS[k].emoji).join('') : '😊';
        }

        if (this.posts.length === 0) {
            feed.innerHTML = '<div style="text-align:center;padding:40px 0;color:#94a3b8;"><div style="font-size:48px;margin-bottom:12px;">📸</div><p>No posts yet. Share your journey!</p></div>';
            return;
        }

        feed.innerHTML = this.posts.map(p => {
            const liked = (p.likes  []).includes(App.state.username);
            const timeAgo = timeSince(new Date(p.time));