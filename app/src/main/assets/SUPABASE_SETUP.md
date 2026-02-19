# 🚀 SUPABASE SETUP GUIDE

## Why Supabase Instead of Firebase?

Supabase advantages:
- ✅ Better performance
- ✅ PostgreSQL (more powerful than Realtime Database)
- ✅ Built-in authentication
- ✅ Row-level security
- ✅ Real-time subscriptions
- ✅ Free tier is more generous

---

## STEP 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub/Google
4. Click "New Project"
5. Fill in:
   - Name: `physio-suai`
   - Database Password: (choose a strong password, save it!)
   - Region: Choose closest to Nigeria
6. Click "Create new project"
7. Wait 2-3 minutes for setup

---

## STEP 2: Get Your Credentials

1. In your Supabase dashboard, click "Settings" → "API"
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Open `js/supabase-config.js`
4. Replace:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // Paste your URL
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Paste your anon key
```

---

## STEP 3: Create Database Tables

Go to SQL Editor in Supabase and run this:

```sql
-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Assignments table
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  author_id UUID REFERENCES users(id),
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  helpful INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create assignments" ON assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Novels table
CREATE TABLE novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view novels" ON novels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload novels" ON novels FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  account TEXT NOT NULL,
  phone TEXT NOT NULL,
  image_url TEXT,
  seller_id UUID REFERENCES users(id),
  sold BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view books" ON books FOR SELECT USING (true);
CREATE POLICY "Authenticated users can list books" ON books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Businesses table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  phone TEXT NOT NULL,
  image_url TEXT,
  owner_id UUID REFERENCES users(id),
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register businesses" ON businesses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fun Jokes Chat (Anonymous)
CREATE TABLE fun_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  sender_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fun_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fun chat" ON fun_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send fun messages" ON fun_chat FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Private Chat Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) NOT NULL,
  recipient_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Friends table
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  friend_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can add friends" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend Requests table
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id UUID REFERENCES users(id) NOT NULL,
  to_id UUID REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_id, to_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view requests to them" ON friend_requests FOR SELECT USING (auth.uid() = to_id OR auth.uid() = from_id);
CREATE POLICY "Users can send requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = from_id);
CREATE POLICY "Users can update requests to them" ON friend_requests FOR UPDATE USING (auth.uid() = to_id);

-- Stories table
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stories" ON stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lectures table
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL,
  lecturer_name TEXT NOT NULL,
  hall TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lectures" ON lectures FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add lectures" ON lectures FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
```

---

## STEP 4: Create Storage Buckets

1. Go to "Storage" in Supabase
2. Click "Create bucket"
3. Create these buckets (click "Public bucket" for each):
   - `assignments`
   - `novels`
   - `books`
   - `businesses`
   - `chat`
   - `profiles`
   - `stories`

4. For each bucket, set policies:

Go to bucket → Policies → New Policy → Custom

**For public read (all buckets):**
```sql
Policy name: Public read access
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**For authenticated write:**
```sql
Policy name: Authenticated write access
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: true
```

---

## STEP 5: Update Your App

1. Replace in `index.html`:
```html
<!-- Remove Firebase scripts -->
<!-- Add Supabase script -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

2. Update all HTML pages to use Supabase

---

## STEP 6: Test Everything

1. Start server: `python3 server.py`
2. Open: `http://localhost:7700`
3. Create account
4. Test all features
5. Check Supabase dashboard for data

---

## 🎉 Done!

Your app now uses Supabase instead of Firebase!

**Supabase Dashboard**: https://app.supabase.com/project/your-project-id
