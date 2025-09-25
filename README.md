# Secure Examination System

This is a full-stack web app implementing teacher/admin/student flows with blockchain-like exam chunking (SHA-256 hashing + AES-256-CBC encryption).

## Run Backend

- Requires MongoDB running locally.
- In `server/.env`, admin credentials will be printed on first run.

```
cd server
npm run dev
```

## Run Frontend
```
cd client
npm run dev
```

## Security Overview
- Exams are split into 5 chunks; each chunk payload contains prevHash and is hashed with SHA-256.
- Each chunk payload is encrypted with AES-256-CBC using a 32-byte key.
- Chain prevents tampering; decrypt during student access to reconstruct questions.
