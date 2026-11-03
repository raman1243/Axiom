# Admin moderation runbook

## Starter workflow
1. Keep `ADMIN_TOKEN` only as a Cloudflare Worker secret or local `.dev.vars`.
2. Review pending records using `GET /api/admin/pending` with `Authorization: Bearer <token>`.
3. Approve or reject a submission using `POST /api/admin/listings/<uuid>/review` with JSON:
   `{"decision":"publish","note":"Contact details checked with submitter"}`
4. Only set `verification_status='verified'` after actual verification checks. Publishing and verification are separate concepts.
5. Keep notes factual; never put passwords or unnecessary personal information in moderator notes.

## Example with curl
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://YOUR-WORKER.workers.dev/api/admin/pending

curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"publish","note":"Listing details reviewed"}' \
  https://YOUR-WORKER.workers.dev/api/admin/listings/UUID/review
```

## Production requirements
The static bearer token is suitable only for a private MVP operator workflow. Do not build a public browser admin page that stores this token. For production, use an identity provider, short-lived sessions, role-based permissions, CSRF protection where cookie sessions are used, persistent rate limits, and moderator-specific audit identities.
