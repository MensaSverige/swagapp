# Release rendering — how a tag reaches production

A `v*` tag runs `on-release-tag.yml`, which builds the website and backend
images and then calls `update-gitops.yml`. That last job is the only thing in
this repo that writes to `MensaSverige/swagapp-ops`, the GitOps repo ArgoCD
watches.

## What update-gitops does

1. Mints a GitHub App token and clones `swagapp-ops`.
2. Runs `tools/render-manifests.sh <docker_tag> swagapp-ops/deployment`.
3. Commits the rendered `*.yaml` files and pushes. ArgoCD syncs from there.

The docker tag is `<release tag>.<short sha>`, e.g. `v2.1.7.1.47304a8`.

## Templates and rendered files

In `swagapp-ops/deployment`, every `*.yaml.tpl` is hand-maintained and holds
`VERSION` where the image tag goes. The matching `*.yaml` is generated from it
on every release, so **an edit to the rendered file alone is reverted by the
next release, silently** — the template is the file to change.

`tools/render-manifests.sh` makes that visible in the output instead of leaving
it to be remembered:

- it replaces the template's leading comment block, which addresses whoever
  edits the template, with a `GENERATED FILE — DO NOT EDIT` header naming the
  template and the release it came from;
- it substitutes the docker tag for `VERSION`.

Nothing else differs between the two files. A difference that is wanted in
production has to live in the template, because the next release is the only
thing that writes the rendered one.

Run it locally against a clone to see what a release would commit:

```sh
tools/render-manifests.sh v0.0.0.local ../swagapp-ops/deployment
git -C ../swagapp-ops diff
```

The ops repo documents the same rule from its own side in
`docs/deployment-templates.md`.
