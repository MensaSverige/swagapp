# Manual work worth automating

One line per thing done by hand that a `grit` verb could have done.

- 2026-10-28: minted a Swift S3 key, then handed the owner a copy-paste into
  swagapp-ops GitHub repository secrets plus a workflow run, to get it into the
  cluster — automatable because `grit swift secrets` already mints and stores
  the key, but swagapp-ops seals from GitHub secrets rather than from a vault
  grit can write, so the last hop is a human. A verb that writes a repo secret
  (or a seal path grit can drive for a non-gronitab repo) closes it.
- 2026-10-28: opened pull requests by hand because no GitHub App installation
  covers the MensaSverige org, so a pod can push over SSH but cannot reach the
  GitHub API — automatable because every other repo's PRs are not hand-opened.
  Filed in grit's intake.
