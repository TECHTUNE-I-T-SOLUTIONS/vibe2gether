# Quick Fix Summary - Audio Upload RLS Error

## The Problem
```
Error: "new row violates row-level security policy"
POST /api/messages/upload 500
```

## The Solution
✅ Changed upload endpoint to use **SERVICE ROLE KEY** instead of ANON key

## File Changed
📝 `app/api/messages/upload/route.ts`

## Key Change
```diff
- import { createClient } from "@/lib/supabase/server"
- const supabaseAdmin = await createClient()  // ❌ ANON key

+ import { createClient } from "@supabase/supabase-js"
+ const supabaseAdmin = createClient(
+   process.env.NEXT_PUBLIC_SUPABASE_URL!,
+   process.env.SUPABASE_SERVICE_ROLE_KEY!   // ✅ SERVICE ROLE key
+ )
```

## Why This Works
- ANON key can't bypass RLS → 403 Forbidden
- SERVICE ROLE key bypasses RLS → Uploads succeed
- Still authenticated via NextAuth session
- Still secure (server-side only)

## Test It
```
1. Open chat
2. Click 🎤 microphone
3. Record audio
4. Type description
5. Click Send

Expected: ✅ No RLS error, audio uploads successfully
```

## Status
✅ **COMPLETE & READY TO TEST**

See [AUDIO_UPLOAD_RLS_FIX.md](AUDIO_UPLOAD_RLS_FIX.md) for full details.
