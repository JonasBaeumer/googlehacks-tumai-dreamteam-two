# googlehacks-tumai-dreamteam-two

## GitHub Actions: Firebase deploy

This repo includes a workflow `.github/workflows/firebase-deploy.yml` that deploys Firestore rules/indexes, Functions, and Hosting on pushes to `main`.

### Required GitHub Secrets
- `FIREBASE_TOKEN`: CI token from Firebase CLI. Generate with:
  ```bash
  firebase login:ci
  ```
  Copy the output token and add it as a GitHub secret.

- `FIREBASE_PROJECT_ID`: Your Firebase project id, e.g. `tum-cdtm25mun-8774`.

### Notes
- The workflow installs deps in `functions/` and `hosting/`, then runs `firebase deploy` with `--non-interactive`.
- Update Node versions in the workflow as needed.