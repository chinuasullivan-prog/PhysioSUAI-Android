// ============================================================
// PHYSIO SUAI – HYBRID CONFIG
// Firebase = Auth + Realtime DB  |  Supabase = FREE Storage
// ============================================================

// ─── FIREBASE ────────────────────────────────────────────────
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA8YSCRPDDOO1aiVXdhdwBbVsosmyktZZk",
  authDomain:        "physio-suai.firebaseapp.com",
  databaseURL:       "https://physio-suai-default-rtdb.firebaseio.com",
  projectId:         "physio-suai",
  storageBucket:     "physio-suai.firebasestorage.app",
  messagingSenderId: "316528709010",
  appId:             "1:316528709010:web:07fd170c8c2efeae67454b"
};

// Only init once
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

// ✅ var = true window globals, visible from every script on every page
var auth        = firebase.auth();
var db          = firebase.database();
var currentUser = null;

auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    console.log("✅ Signed in:", user.email);
  } else {
    currentUser = null;
    var p = window.location.pathname;
    var onPublic = p.includes("index.html") || p.endsWith("/") || p.endsWith("/physio-suai-complete/");
    if (!onPublic) {
      window.location.href = p.includes("/pages/") ? "../index.html" : "index.html";
    }
  }
});

// ─── SUPABASE (Storage ONLY) ─────────────────────────────────
var SUPABASE_URL = "https://cnljatyxdqphdrcdmdph.supabase.co";
var SUPABASE_KEY = "sb_publishable_LVgOxezqX3kYpXqOEIeB8g_GzFB6WpR";
var supabase     = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── BUCKET MAP (your buckets from screenshot) ────────────────
var BUCKET_MAP = {
  profiles:    "profile-photos",
  chat:        "chat-images",
  posts:       "post-images",
  stories:     "post-images",
  groups:      "group-images",
  assignments: "Physio-assets",
  novels:      "Physio-assets",
  books:       "Physio-assets",
  businesses:  "Physio-assets",
  lectures:    "Physio-assets",
  payments:    "Physio-assets"
};

// ─── UPLOAD: Supabase storage → URL saved in Firebase DB ──────
async function uploadFile(file, category) {
  try {
    var bucket   = BUCKET_MAP[category] || "Physio-assets";
    var ext      = file.name.split(".").pop();
    var fileName = Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;

    var upResult = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (upResult.error) throw upResult.error;

    var urlResult = supabase.storage.from(bucket).getPublicUrl(fileName);
    var publicUrl = urlResult.data.publicUrl;

    console.log("📤 Uploaded to " + bucket + ":", publicUrl);
    return { success: true, url: publicUrl };

  } catch (err) {
    console.error("❌ uploadFile:", err);
    return { success: false, error: err.message };
  }
}

// ─── FIREBASE DB HELPERS ──────────────────────────────────────
async function saveToFirebase(path, data) {
  try {
    var ref = await db.ref(path).push(data);
    return { success: true, id: ref.key };
  } catch (err) {
    console.error("❌ saveToFirebase:", err);
    return { success: false, error: err.message };
  }
}

async function getFromFirebase(path, limit) {
  limit = limit || 100;
  try {
    var snap = await db.ref(path).limitToLast(limit).once("value");
    var rows = [];
    snap.forEach(function(c) { rows.push(Object.assign({ id: c.key }, c.val())); });
    return rows.reverse();
  } catch (err) {
    console.error("❌ getFromFirebase:", err);
    return [];
  }
}

async function updateFirebase(path, updates) {
  try {
    await db.ref(path).update(updates);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function deleteFromFirebase(path) {
  try {
    await db.ref(path).remove();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listenToFirebase(path, callback) {
  db.ref(path).on("value", function(snap) {
    var rows = [];
    snap.forEach(function(c) { rows.push(Object.assign({ id: c.key }, c.val())); });
    callback(rows.reverse());
  });
}

// ─── USER PROFILE ─────────────────────────────────────────────
async function getUserProfile(uid) {
  try {
    var id   = uid || (currentUser && currentUser.uid);
    if (!id) return null;
    var snap = await db.ref("users/" + id).once("value");
    return snap.val();
  } catch (err) {
    return null;
  }
}

async function updateUserProfile(updates) {
  try {
    if (!currentUser) return { success: false, error: "Not logged in" };
    await db.ref("users/" + currentUser.uid).update(updates);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function sendNotification(userId, message) {
  db.ref("notifications/" + userId).push({ message: message, timestamp: Date.now(), read: false });
}

function generateFileName(name) {
  var ext = name.split(".").pop();
  return Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;
}

console.log("✅ hybrid-config: Firebase (Auth+DB) + Supabase (Storage) ready");
