# 📱 Turning Physio SUAI into a Facebook Lite / Native App

## The closest route: PWA (Progressive Web App) ⭐⭐⭐⭐⭐

### Why PWA is most like Facebook Lite
Facebook Lite IS a PWA. It's a web app that:
- Installs on the home screen like a real app
- Works offline with cached data
- Sends push notifications
- Has NO browser chrome (address bar disappears)
- Loads in < 1 second

Your app uses the exact same stack. You're already 90% there.

### 3 files to add and you're done:

**1. manifest.json** (paste into root folder):
```json
{
  "name": "Physio SUAI",
  "short_name": "PhysioSUAI",
  "description": "Physiotherapy student platform by SULLIVAN",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#ec4899",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**2. sw.js** (Service Worker — paste into root):
```javascript
var CACHE = 'physio-suai-v1';
var FILES = ['/', '/index.html', '/home.html', '/js/hybrid-config.js', '/js/main.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
```

**3. Add to every HTML `<head>`**:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#ec4899">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icon-192.png">
<script>if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')</script>
```

### Then deploy to HTTPS (free):
1. Push to GitHub
2. Go to https://netlify.com → drag your folder
3. Get a `.netlify.app` HTTPS link
4. Open link on phone → "Add to Home Screen"
5. ✅ Full native-like app installed!

---

## Second option: Capacitor (Web → Real APK) ⭐⭐⭐⭐

Capacitor wraps your HTML/JS into a real Android APK you can upload to Google Play.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Physio SUAI" "com.physiosuai.app"
npx cap add android
npx cap sync
npx cap open android   # Opens Android Studio → Build APK
```

Result: A real .apk file users can install.

---

## Comparison table

| Method      | Time  | Real APK | Offline | Push Notif | Like Facebook Lite? |
|-------------|-------|----------|---------|------------|---------------------|
| PWA         | 1 hr  | No       | ✅      | ✅         | ✅ YES, exactly     |
| Capacitor   | 1 day | ✅       | ✅      | ✅         | Similar             |
| React Native| weeks | ✅       | ✅      | ✅         | Closest to FB main  |

**Recommendation: PWA first (1 hour), Capacitor later (when you want Play Store)**
