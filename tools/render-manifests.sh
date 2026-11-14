#!/usr/bin/env bash
# Render every *.yaml.tpl in a swagapp-ops deployment directory into the plain
# .yaml file ArgoCD syncs, substituting the released image tag for VERSION.
#
# The rendered file gets a generated-file header of its own, in place of the
# template's "SOURCE OF TRUTH" header: without it the output claims to be the
# file worth editing, and hand edits there are lost at the next release.
#
# Usage: render-manifests.sh <docker_tag> [deployment_dir]
# Docs: docs/ReleaseRendering.md
set -euo pipefail

tag=${1:?usage: render-manifests.sh <docker_tag> [deployment_dir]}
dir=${2:-.}

cd "$dir"

for template in *.yaml.tpl; do
  rendered=${template%.tpl}
  {
    printf '# GENERATED FILE — DO NOT EDIT.\n'
    printf '# Rendered from %s for release %s by the Update GitOps workflow in\n' "$template" "$tag"
    printf '# MensaSverige/swagapp. An edit here is overwritten by the next release,\n'
    printf '# silently: change %s instead.\n' "$template"
    printf '# Docs: docs/deployment-templates.md\n'
    # Drop the template's own leading comment block; it addresses whoever edits
    # the template, and the header above addresses whoever reads the output.
    awk 'NR == 1 && /^#/ { skipping = 1 } skipping && /^#/ { next } { skipping = 0; print }' "$template" |
      sed "s/VERSION/$tag/"
  } >"$rendered"
  printf 'rendered %s\n' "$rendered" >&2
done
