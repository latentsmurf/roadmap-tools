# Security & Privacy

## Public vs Private
- **Public Roadmaps**: Accessible by anyone with the link.
- **Private Workspaces (Future)**: require SSO/Login.
- **Internal Notes**: Items can have "Internal View" fields that are stripped from the API response for public viewers.

## Anti-Spam & Moderation
Since we allow anonymous (email-only) following/voting:
1.  **CAPTCHA**: Invisible Turnstile/reCAPTCHA on "Vote" and "Follow" actions.
2.  **Rate Limiting**: Strict limits per IP for voting endpoints.
3.  **Email Verification**: "Double Opt-In" for the first follow. The user must click a magic link to confirm their subscription. Subsequent follows are automatic if the cookie is present.

## GDPR / Compliance
-   **Right to be Forgotten**: API endpoint to delete a Subscriber and all their PII (email, votes).
-   **Cookie Usage**: Strictly necessary cookies for auth. No tracking pixels by default on the embed.

## Content Safety
-   Public user comments (if enabled) must go through a queue or auto-moderation filter (e.g., OpenAI moderation API) to prevent abuse on public customer pages.
