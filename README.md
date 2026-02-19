# 📱 Physio SUAI – Android APK Builder

## How to get your APK in 5 minutes (no Android Studio needed!)

### Step 1 – Create a free GitHub account
Go to https://github.com and sign up (free).

---

### Step 2 – Create a new repository
1. Click the **+** button → **New repository**
2. Name it: `physio-suai-android`
3. Set it to **Public**
4. Click **Create repository**

---

### Step 3 – Upload this project folder
**Option A – Drag and drop (easiest):**
1. Open your new empty repository on GitHub
2. Click **"uploading an existing file"** (link on the empty repo page)
3. Drag the entire contents of this ZIP/folder into the page
4. Click **Commit changes**

**Option B – Using Git (if you know it):**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/physio-suai-android.git
git push -u origin main
```

---

### Step 4 – Wait ~5 minutes for GitHub to build
1. Go to your repository on GitHub
2. Click the **Actions** tab at the top
3. You'll see **"Build Physio SUAI APK"** running (yellow circle = in progress)
4. Wait for it to turn green ✅

---

### Step 5 – Download your APK
**Method A – From Releases (easier):**
1. Go to your repo → Click **Releases** (right sidebar)
2. Download **PhysioSUAI-v8.apk**

**Method B – From Actions:**
1. Click the green completed workflow run
2. Scroll down to **Artifacts**
3. Click **PhysioSUAI-APK** to download

---

### Step 6 – Install on your phone
1. Send the APK to your Android phone (WhatsApp, email, Google Drive, USB)
2. On your phone: **Settings → Security → Install unknown apps → Allow**
3. Open the downloaded APK file → **Install**
4. Done! 🎉 **Physio SUAI** is now installed!

---

## ✨ App Features
- Full Physio SUAI web app wrapped as a native Android app
- Works like a real app (no browser bar)
- Back button navigation works
- Pull-to-refresh
- Camera & file picker support
- Dark theme matching the app design

## 🔁 Updating the app
Just upload new files and push to GitHub — a new APK builds automatically!

---

## ❓ Troubleshooting
- **Build failed?** Check the Actions tab → click the failed run → read the error log
- **App won't install?** Make sure "Install from unknown sources" is enabled in settings
- **Blank screen?** Check your internet connection — the app loads Firebase/Supabase from the internet
