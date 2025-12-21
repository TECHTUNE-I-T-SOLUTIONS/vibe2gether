# Testing Verifications ✅

Quick checklist to test the verification flow locally or on Supabase:

1. Create `verifications` storage bucket (public) in Supabase.
2. Run SQL scripts:
   - `psql -d vibe2gether -f scripts/005_create_user_verifications_table.sql`
   - Or append to your DB via Supabase SQL Editor.
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment for server routes to upload files.
4. From the app: Login → Dashboard → Profile → "Get Verified" → Fill form and submit.
5. Verify a new row is created in `user_verifications` and `users.is_verified` is set when status becomes `verified`.
6. For manual review: Update `user_verifications` status to `rejected` or `verified` and confirm the `users.is_verified` flag updates accordingly.

7. Notifications: On submission, the user should receive a `verification` notification with title "Verification submitted". When the status is updated (e.g., `verified` or `rejected`), the user should receive another `verification` notification reflecting the decision and containing the `decision_reason` if available.

8. Dashboard activity: After submitting the verification, check your Dashboard → Recent Activity — you should see the verification activity listed (and notifications counter should increment).

Notes:
- Current automatic verification uses a basic heuristic (id number regex + presence of files) as an MVP.
- You should add more robust checks (OCR, face-match) with external services for production.
