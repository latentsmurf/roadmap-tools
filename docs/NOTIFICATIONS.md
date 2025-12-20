# Notification & Feedback Loop

## The "Follow" Engine
The primary engagement action is "Follow". It is distinct from "Upvote".
- **Upvote**: "I want this." (Signal to PM)
- **Follow**: "Tell me when this happens." (Signal to User)

## Triggers
Notifications are sent when:
1.  **Status Change**: Admin moves item from `Building` -> `Shipped`.
2.  **Explicit Update**: Admin posts a comment/update on the card.
3.  **Release**: A "Release Note" is published containing followed items.

## Email Digest Logic
To prevent spamming users, we offer:
1.  **Immediate**: Sent transactional email within 5 mins of change.
2.  **Daily Digest**: Summary of all changes in followed items (sent at 9am user time).
3.  **Weekly Digest**: High level summary.

## Email Templates (Resend/Postmark)
-   `ItemShipped`: "Good news! [Item Name] is live."
-   `StatusUpdate`: "[Item Name] moved to Building."
-   `MagicLink`: "Login to manage your roadmap subscriptions."

## Preference Center
A simple page where users/subscribers can:
-   Unsubscribe from specific items.
-   Unsubscribe from all emails.
-   Toggle Frequency (Instant vs Daily).
