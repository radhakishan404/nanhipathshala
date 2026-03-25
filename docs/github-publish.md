# GitHub Publish Guide

## Local Repo

This project has already been initialized as a local Git repository.

## Suggested Next Commands

```bash
cd /Volumes/CodeDrive/OpenSourceGithub/nanhipathshala
git status
git add .
git commit -m "Initial NanhiPathshala MVP"
```

## Create GitHub Remote

After creating an empty GitHub repository, connect it like this:

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## What The Repo Already Contains

- ADK backend
- mobile-first frontend
- Cloud Run deploy scripts
- submission docs
- editable slide deck source and generated `.pptx`

## Notes

- `node_modules/`, `dist/`, `.venv/`, and similar local build outputs are already ignored in [.gitignore](/Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/.gitignore).
- If you want a cleaner repo before commit, keep only source, docs, and required assets.
