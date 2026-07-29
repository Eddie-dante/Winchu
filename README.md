# Winchu · Nexus ⚡

**Shape your presence. Manifest your energy.**

A full-featured progressive web application (PWA) for social networking, wellness tracking, and personal growth.

## 🌟 Features

### Social & Community
- **Social Feed** - Share posts with images and videos
- **Video Feed** - TikTok-style vertical video browsing with likes, comments, shares
- **Stories/Status** - Share 24-hour disappearing statuses
- **Likes & Comments** - Engage with community content
- **Bookmarks** - Save posts and videos for later
- **User Profiles** - View other users' posts and profiles
- **Friend System** - Send and accept friend requests with mutual friendship
- **Notifications** - Real-time alerts for interactions with desktop support

### Communication
- **Private Chats** - One-on-one direct messaging with file attachments
- **Group Chats** - Create and manage WhatsApp-style groups with friends
- **File Attachments** - Share images, videos, and files in chats
- **Location Sharing** - Send your GPS location in chats
- **Global Chat** - Community chat for all users

### Wellness & Productivity
- **Aura System** - Choose 3 energy types that define your daily tasks
- **Dashboard** - Track streaks, tasks, and daily progress with visual calendar
- **Task Management** - Complete daily tasks based on your selected auras
- **📖 Diary** - Beautiful blue book-style diary with PIN protection
- **📋 Routines** - Create, manage, and track daily routines with tags
- **Tags & Search** - Organize routines with hashtags and search functionality

### Personalization
- **🎨 Wallpapers** - 90+ curated wallpapers (portrait & landscape)
- **Custom Avatars** - Upload and compress your profile picture
- **Bio & Name** - Customize your profile display
- **Aura Selection** - Choose from 8 different energy types

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling (Glassmorphism, Animations, Responsive) |
| **Vanilla JavaScript** | Application Logic |
| **Firebase Realtime Database** | Backend & Real-time Data |
| **PWA** | Progressive Web App (Installable) |
| **Service Worker** | Offline Caching |
| **Font Awesome** | Icons |

## 🚀 Getting Started

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database**
4. Set database rules to allow read/write
5. Copy your Firebase config to `js/firebase.js`

### Local Development
```bash
python -m http.server 8000
# or
npx http-server -p 8000