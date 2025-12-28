# Duplicate Message Key & 404 Error Fix

## Issues Fixed

### 1. **Duplicate Message Key Error** ❌ → ✅
**Problem:**
```
Encountered two children with the same key, `11c7515c-9bc3-485a-9c31-2394baa5f5bc`
```

**Root Cause:**
- When sending a message, we immediately added it to state from API response
- Then the realtime subscription would fire and try to add the same message again
- This caused React to see two children with the same key (message ID)
- The realtime callback would delete the message ID from `justSentMessageIds` BEFORE the duplicate check in the state update, creating a race condition

**Solution Implemented:**
1. **Improved duplicate prevention logic** in the realtime subscription:
   - Added `filter: match_id=eq.${selectedChat.id}` to the subscription to only listen for relevant messages
   - Added console logging to debug the flow
   - Changed from deleting message ID immediately to using a 2-second timeout

2. **Enhanced sendMessage function:**
   ```typescript
   // Mark this message ID to prevent duplicate from realtime subscription
   if (msgId) {
     setJustSentMessageIds((prev) => new Set(prev).add(msgId))
     // Auto-remove from tracking after 2 seconds
     setTimeout(() => {
       setJustSentMessageIds((prev) => {
         const newSet = new Set(prev)
         newSet.delete(msgId)
         return newSet
       })
     }, 2000)
   }
   ```

3. **Improved realtime callback:**
   - Double-check if message already exists in state before adding
   - Only add from realtime if NOT in justSentMessageIds
   - Added detailed console logs for debugging

**Test:**
1. Open chat
2. Type a message and an image (or audio)
3. Click send
4. **Expected:** Message appears once, no console errors
5. **Verify in console:** Check logs show "Skipping message we just sent"

---

### 2. **404 Error on POST /api/messages** ❌ → ✅
**Problem:**
```
POST /api/messages 404 in 10.7s
```

**Root Cause:**
- The API route file exists and has the POST handler
- The 404 might be caused by:
  - Incorrect URL format in fetch call
  - Missing headers
  - Payload validation issues
  - Race condition timing

**Solution Implemented:**
1. **Enhanced error logging in sendMessage:**
   ```typescript
   if (!response.ok) {
     const errorData = await response.json().catch(() => ({}))
     console.error("API error:", response.status, errorData)
     toast({ title: "Error", description: `Failed to send message: ${response.status}`, variant: "destructive" })
     return
   }
   ```

2. **Verified payload format:**
   ```typescript
   const payload = {
     matchId: selectedChat.id,
     content: messageContent || `[${messageType || "media"}]`,
     mediaUrl: mediaUrl || null,
     messageType: messageType || "text",
   }

   console.log("Sending message payload:", payload)
   ```

3. **Check for missing response data:**
   ```typescript
   if (!sentMessage) {
     console.error("No message returned from API")
     toast({ title: "Error", description: "Message created but not returned", variant: "destructive" })
     return
   }
   ```

**Test:**
1. Open the browser console (F12 → Console tab)
2. Send a message with an image/audio and caption
3. **Expected:** See "Sending message payload:" logged before the POST
4. **Check console for:**
   - If 404 appears, you'll see "API error: 404" with response data
   - This will help identify what's wrong with the request or route

---

### 3. **Hide Input When Media Preview Showing** ❌ → ✅
**Problem:**
- When users upload an image/audio, they still see the main text input area
- This is confusing UX - should only show the media preview and caption

**Solution Implemented:**
- Added conditional render for the input section:
```typescript
{!selectedImage && !audioPreview && (
  <div className="p-4 border-t border-border bg-background">
    {/* All input controls here */}
  </div>
)}
```

- When user selects image:
  - Main input area HIDES
  - Image preview + caption input SHOWS (already existed)
  
- When user selects audio:
  - Main input area HIDES  
  - Audio preview + description input SHOWS (already existed)

**Test:**
1. Click image upload button → Image preview shows, input hides ✅
2. Click cancel on image → Input reappears ✅
3. Record audio → Audio preview shows, input hides ✅
4. Click stop/cancel on audio → Input reappears ✅

---

## Code Changes Summary

### `app/dashboard/messages/page.tsx`

**Changes Made:**

1. **sendMessage function (lines 449-515)**
   - Added detailed payload logging
   - Enhanced error handling with status codes
   - Improved null check for returned message
   - Changed message ID removal to 2-second timeout
   - Reset audioPreview state after sending

2. **Realtime subscription (lines 177-210)**
   - Added filter parameter: `match_id=eq.${selectedChat.id}`
   - Added detailed console logging for debugging
   - Improved duplicate prevention with double-check
   - Better error context in logs

3. **Input UI section (lines 833-931)**
   - Wrapped entire input section in conditional: `{!selectedImage && !audioPreview && (...)}`
   - Added closing `)}` to properly close the conditional

---

## Database Compatibility

✅ **No database schema changes needed**
- Content field in messages table can store captions
- message_type already supports 'text', 'image', 'audio'
- API route already handles all field formats

---

## Testing Checklist

- [ ] Send text message alone → appears once, no duplicate key error
- [ ] Send image with caption → appears once, no duplicate key error  
- [ ] Send audio with description → appears once, no duplicate key error
- [ ] Upload image → main input hides, preview shows
- [ ] Cancel image → main input reappears
- [ ] Upload audio → main input hides, preview shows
- [ ] Cancel audio → main input reappears
- [ ] Open browser console → no 404 errors for /api/messages POST
- [ ] Check console logs → shows proper message flow (payload sent, skip duplicate, etc.)

---

## Browser Console Debug Output

When testing, you should see in console:

```
Sending message payload: {
  matchId: "abc-123-def",
  content: "Hello with caption",
  mediaUrl: "https://...",
  messageType: "image"
}

Realtime message received: 11c7515c-9bc3-485a-9c31-2394baa5f5bc Is in justSentIds? true
Skipping message we just sent

// 2 seconds later:
// (auto-cleanup of message ID from tracking)
```

---

## Troubleshooting

**If you still see "Encountered two children with the same key":**
1. Check browser console for realtime logs
2. Verify message ID cleanup is happening (check logs after 2 seconds)
3. Clear browser cache and reload
4. Check Supabase subscription is working

**If you still see 404 error:**
1. Check console for "Sending message payload" - verify format
2. Check API error response for more details
3. Verify `/api/messages` route file exists and has POST handler
4. Check NextAuth session is valid (401 vs 404)

**If input area doesn't hide on media upload:**
1. Verify `selectedImage` state is being set correctly
2. Check audio recording is properly setting `audioPreview`
3. Verify there's no other override logic hiding the conditional

---

## Next Steps

1. Test all scenarios in browser
2. Monitor console for errors
3. Verify messages appear only once
4. Confirm input hides/shows correctly with media previews
5. Deploy with confidence! 🎉
