# Quick Testing Guide: Duplicate Key & 404 Fix

## 5-Minute Verification

### Setup
1. Open the messages/chat page in your browser
2. Open DevTools: `F12` or Right-click → Inspect
3. Go to **Console** tab
4. Keep console visible while testing

---

## Test 1: Send Text Message (30 seconds)

**Steps:**
1. Select a conversation
2. Type: "Testing text message"
3. Press Enter or click Send button
4. Observe the message appears in chat

**Expected Results:**
- ✅ Message appears ONCE in chat
- ✅ Message appears immediately (optimistic update)
- ✅ No console errors
- ✅ Console shows: "Skipping message we just sent"

**If it fails:**
- ❌ Message appears twice → Duplicate key error not fixed
- ❌ Message has 404 error → API endpoint issue
- ❌ Console shows errors → Check error messages

---

## Test 2: Send Image with Caption (60 seconds)

**Steps:**
1. Select a conversation  
2. Click the **Image** button (📷 icon)
3. Choose an image from your computer
4. **Image preview appears with caption input**
5. Type caption: "Test image caption"
6. Click **Send** button
7. Observe image appears in chat with caption

**Expected Results:**
- ✅ Input area **HIDES** when image is selected
- ✅ Image preview shows with caption input field
- ✅ Image appears ONCE in chat with caption
- ✅ No duplicate key errors
- ✅ Console shows: "Skipping message we just sent"

**If it fails:**
- ❌ Input area still shows with image → Hide logic not working
- ❌ Image appears twice → Duplicate key error
- ❌ Caption doesn't show in chat → Caption logic broken
- ❌ 404 error in console → API error

---

## Test 3: Send Audio with Description (90 seconds)

**Steps:**
1. Select a conversation
2. Click the **Microphone** button (🎤 icon)
3. **Click again to start recording**
4. Speak into microphone for 3-5 seconds
5. Click microphone button again to **stop recording**
6. **Audio preview appears with description input**
7. Type description: "My test audio message"
8. Click **Send** button
9. Observe audio appears in chat with description

**Expected Results:**
- ✅ Input area **HIDES** when audio is recorded
- ✅ Audio preview shows with play button
- ✅ Description input field appears below audio
- ✅ Audio appears ONCE in chat with description
- ✅ No duplicate key errors
- ✅ Console shows: "Skipping message we just sent"

**If it fails:**
- ❌ Input area still shows with audio → Hide logic not working
- ❌ Audio appears twice → Duplicate key error
- ❌ Description doesn't show → Description logic broken

---

## Test 4: Concurrent Media Uploads (This was the MAIN BUG)

**Steps:**
1. Select a conversation
2. Type a message: "Hello there!"
3. Click image button
4. Select an image
5. Type image caption: "Check this out"
6. **WITHOUT canceling image, try to send**
7. Observer what happens

**Expected Results:**
- ✅ Message appears ONCE in chat
- ✅ Image appears ONCE below the text
- ✅ Caption appears below image
- ✅ Input hides during preview
- ✅ No duplicate key error
- ✅ Console shows no errors

**This is the exact scenario from the bug report!**

---

## Test 5: Real-time Messages from Other User

**Setup (requires 2 devices/browsers):**
1. Open chat on **Device A** (your main device)
2. Open same chat on **Device B** (phone, other browser tab, etc.)
3. From Device B, send a message
4. Watch Device A's chat

**Expected Results:**
- ✅ Message appears instantly on Device A
- ✅ Message appears ONCE (no duplicate)
- ✅ Console on Device A shows: "Adding new message from realtime"
- ✅ Caption displays correctly if sent with media

**If it fails:**
- ❌ No message appears → Realtime subscription not working
- ❌ Message appears twice → Duplicate logic broken
- ❌ Takes 5+ seconds to appear → Realtime delay issue

---

## Console Debugging

### Look for These Messages ✅

```javascript
// Normal successful send
"Sending message payload: {matchId: '...', content: '...', mediaUrl: '...', messageType: 'image'}"
"Realtime message received: 11c7515c-9bc3-485a-9c31-2394baa5f5bc Is in justSentIds? true"
"Skipping message we just sent"
```

### Bad Messages ❌

```javascript
// 404 Error
"API error: 404 {error: 'Not authorized for this match'}"
"Failed to send message: 404"

// Missing response
"No message returned from API"
"Message created but not returned"

// Duplicate from realtime
"Realtime message received: ... Is in justSentIds? false"
"Adding new message from realtime"  // This is GOOD if ID not in sent
// But then appears TWICE in chat = BAD
```

---

## Step-by-Step Console Check

### When Sending a Message:

1. **Type message:** "Hello"
2. **Press Enter** → Check console
3. You should see:
   ```
   Sending message payload: {
     matchId: "abc-123",
     content: "Hello",
     mediaUrl: null,
     messageType: "text"
   }
   ```
4. **Within 1-2 seconds:** 
   ```
   Realtime message received: 11c7515c-... Is in justSentIds? true
   Skipping message we just sent
   ```
5. **Message appears in chat**

### If You See 404:

```
API error: 404 {error: '...'}
```

This means:
- API route might not be configured correctly
- Session might not be valid (try refreshing page)
- Check that `/api/messages` route file exists

---

## Mobile Testing Checklist

- [ ] Text message sends without error
- [ ] Image upload works and shows preview
- [ ] Input hides when image is selected
- [ ] Image caption input appears
- [ ] Image sends with caption
- [ ] Audio recording works
- [ ] Audio preview shows with description input
- [ ] Input hides when audio is selected  
- [ ] Audio sends with description
- [ ] No "key" errors appear on mobile
- [ ] Realtime messages show immediately

---

## Performance Check

### Send Time Should Be:
- **Text message:** < 1 second
- **Image message:** 2-4 seconds (includes upload)
- **Audio message:** 3-5 seconds (includes upload)

If sending takes > 5 seconds for text, there may be API issues.

---

## Failed Test Troubleshooting

### "Message appears twice"
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Refresh page: `F5`
3. Check console for duplicate logs
4. Verify `justSentMessageIds` timeout is working
5. The fix may not be applied correctly

### "Input doesn't hide on media upload"
1. Check `selectedImage` or `audioPreview` state
2. Verify conditional is: `{!selectedImage && !audioPreview && (`
3. Inspect element to see if div is hidden (CSS) or removed (conditional)
4. The fix may not be applied correctly

### "Still getting 404"
1. Check `/api/messages` route file exists
2. Verify POST handler is in the route file
3. Check session is valid (refresh page)
4. Open DevTools Network tab
5. Check request headers and response
6. Look at response error message

### "Realtime not working"
1. Check browser console for errors
2. Verify Supabase subscription is active
3. Try opening chat again
4. Check network connection
5. Look for WebSocket connection errors

---

## Success Criteria ✅

All of these must pass:

- [ ] Text messages appear once
- [ ] Image messages appear once
- [ ] Audio messages appear once
- [ ] Captions/descriptions show with media
- [ ] Input hides during media preview
- [ ] No "Encountered two children with the same key" errors
- [ ] No 404 errors in console
- [ ] Realtime messages appear instantly
- [ ] Mobile experience is smooth
- [ ] All console logs show expected flow

---

## Rollback Instructions

If fixes don't work and you need to rollback:

1. In `app/dashboard/messages/page.tsx`:
   - Remove `justSentMessageIds` state line
   - Simplify `sendMessage()` function (remove timeout logic)
   - Remove filter from realtime subscription
   - Remove conditional on input area
   - Remove console.log() statements

2. Redeploy application

3. No database changes to revert - all application code

---

## Need Help?

### Check These Files:
1. [DUPLICATE_KEY_AND_404_FIX.md](DUPLICATE_KEY_AND_404_FIX.md) - Technical details
2. [DUPLICATE_KEY_FIX_VISUAL_GUIDE.md](DUPLICATE_KEY_FIX_VISUAL_GUIDE.md) - Visual explanation
3. Console logs (F12 → Console) - Real-time debugging

### Common Issues:
- **See duplicate keys?** Check justSentMessageIds cleanup timeout
- **See 404?** Check API endpoint and session validity  
- **Input not hiding?** Check conditional render is applied
- **Captions not showing?** Check database schema has content field

---

## Quick Summary

**What was fixed:**
1. ✅ Duplicate message key error (race condition)
2. ✅ Input area now hides when media previewing
3. ✅ Better error logging for 404 debugging

**How to verify:**
1. Send message with image + caption
2. Check message appears ONCE
3. Check no console errors
4. Check input area hided during preview

**Time to test:** ~5 minutes
**Risk level:** Very Low (isolated changes)
**Rollback time:** ~30 seconds

Let's test! 🚀
