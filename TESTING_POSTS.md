# Testing Post Creation and Tags

Steps to manually test post creation and tags:

1. Ensure database migration `scripts/006_add_tags_to_posts.sql` has been applied.
2. Start the app locally and sign in as a test user.
3. Visit `/dashboard/create-post`.
4. Enter content, add up to 6 media files, and add tags using the tag input (press Enter to add).
5. Click Post and ensure you're redirected to `/dashboard/feed`.
6. Verify the post appears in the feed and that tags are displayed as `#tag` badges.
7. Confirm `posts.tags` column contains the tags in the database.
8. Try edge cases: duplicate tags (should be ignored), long tags, and special characters.

Notes:
- The posts feed and component `ThreadPost` were updated to render tags when present.
- If tags do not display, check the `createPost` call in `app/dashboard/create-post/page.tsx` to ensure tags are passed.

Expected behavior: tags appear under post content as badges and are stored in the `posts.tags` text[] column.
