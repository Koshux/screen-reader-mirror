#!/usr/bin/env bash
#
# setup-github.sh — publish screen-reader-mirror to GitHub and wire up the contribution model.
#
# You chose "scaffold locally first", so nothing here runs automatically. Run it (or individual
# steps) when you're ready to go public. It is safe to re-run; most steps are idempotent.
#
# Prerequisites:
#   - gh CLI installed and authenticated:  gh auth login
#   - gh has the 'project' scope (for the board):  gh auth refresh -s project,read:project
#   - run from the repo root, with at least one commit made.
#
# Usage:
#   scripts/setup-github.sh all            # everything, in order
#   scripts/setup-github.sh repo           # create the remote + push
#   scripts/setup-github.sh labels         # create/sync labels
#   scripts/setup-github.sh protect        # branch protection on main
#   scripts/setup-github.sh project        # create the Project board
#   scripts/setup-github.sh issues         # seed the first milestone issues (+ add to board)
#
set -euo pipefail

# ----- Config (edit if needed) -----------------------------------------------
OWNER="${OWNER:-Koshux}"
REPO="${REPO:-screen-reader-mirror}"
VISIBILITY="${VISIBILITY:-public}"        # public | private
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
PROJECT_TITLE="${PROJECT_TITLE:-screen-reader-mirror}"
REQUIRED_CHECK="${REQUIRED_CHECK:-verify}" # must match the CI job name in .github/workflows/ci.yml
# -----------------------------------------------------------------------------

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }

require_gh() {
  command -v gh >/dev/null || { echo "gh CLI not found. Install: https://cli.github.com/"; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login"; exit 1; }
}

create_repo() {
  say "Creating remote $OWNER/$REPO ($VISIBILITY) and pushing $DEFAULT_BRANCH"
  git rev-parse --verify HEAD >/dev/null 2>&1 || { echo "Make a commit first (git add -A && git commit)."; exit 1; }
  git branch -M "$DEFAULT_BRANCH"
  if git remote get-url origin >/dev/null 2>&1; then
    warn "origin already set ($(git remote get-url origin)); pushing."
    git push -u origin "$DEFAULT_BRANCH"
  else
    gh repo create "$OWNER/$REPO" "--$VISIBILITY" --source=. --remote=origin --push \
      --description "See what a screen reader interprets from your UI — zero install, client-side, no data leaves the machine."
  fi
  # Enable Discussions (used by the issue-template contact links).
  gh repo edit "$OWNER/$REPO" --enable-discussions || warn "Could not toggle discussions."
}

create_labels() {
  say "Creating / syncing labels"
  # name|color|description  (mirror of .github/labels.yml)
  local rows=(
    "task|0e8a16|A board-ready unit of work"
    "bug|d73a4a|Something the tool gets wrong"
    "enhancement|a2eeef|New capability or improvement"
    "docs|0075ca|Documentation / SDLC artifacts"
    "dependencies|ededed|Dependency updates"
    "ci|bfdadc|Build / release / workflows"
    "area: core|5319e7|The shared client-side engine"
    "area: extension|5319e7|Browser (MV3) target"
    "area: cli|5319e7|npx CLI target"
    "area: web|5319e7|Hosted demo target"
    "area: a11y-fidelity|5319e7|Accuracy of the screen-reader interpretation"
    "area: infra|5319e7|Tooling, packaging, distribution"
    "good first issue|7057ff|A friendly entry point for new contributors"
    "help wanted|008672|Maintainer would welcome a contributor here"
    "needs: spec|fbca04|Needs a spec before implementation"
    "needs: spec-review|fbca04|Has a spec; needs the Stage 2.5 review"
    "blocked|b60205|Waiting on something else"
  )
  for row in "${rows[@]}"; do
    IFS='|' read -r name color desc <<<"$row"
    gh label create "$name" --color "$color" --description "$desc" --force --repo "$OWNER/$REPO"
  done
}

protect_branch() {
  say "Applying branch protection to '$DEFAULT_BRANCH'"
  # The contribution model (GOVERNANCE.md / task 5):
  #   - no direct pushes; every change via PR
  #   - >=1 approving review from a CODE OWNER (the maintainer owns *), so contributor PRs are
  #     blocked until the maintainer approves
  #   - enforce_admins=false so the MAINTAINER (an admin) can merge their own PRs without a second
  #     reviewer — GitHub never lets you approve your own PR, so this is how "only the creator can
  #     self-merge" is expressed. Contributors are not admins, so they stay blocked.
  #   - CI ('verify') must pass; stale approvals dismissed on new commits.
  local payload
  payload=$(cat <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["$REQUIRED_CHECK"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
)
  if printf '%s' "$payload" | gh api -X PUT "repos/$OWNER/$REPO/branches/$DEFAULT_BRANCH/protection" \
       -H "Accept: application/vnd.github+json" --input - >/tmp/srm-bp.out 2>&1; then
    echo "Branch protection applied (PR + code-owner review required; admins exempt so you can self-merge)."
  else
    warn "Branch protection could NOT be applied (everything else above succeeded)."
    warn "Most likely cause: branch protection on a PRIVATE repo needs a paid plan — GitHub Free allows it only on PUBLIC repos."
    echo "  Options: (a) make the repo public, (b) upgrade to GitHub Pro, or (c) rely on CODEOWNERS review-requests without hard enforcement."
    echo "  API said: $(head -c 300 /tmp/srm-bp.out 2>/dev/null)"
    return 0
  fi
}

create_project() {
  say "Creating Project board '$PROJECT_TITLE'"
  local out
  out=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" 2>&1) || {
    warn "Project create failed. You may need the project scope: gh auth refresh -s project"
    echo "$out"; return 1
  }
  echo "$out"
  PROJECT_NUMBER=$(printf '%s' "$out" | grep -oE 'projects/[0-9]+' | grep -oE '[0-9]+' | tail -1 || true)
  echo "PROJECT_NUMBER=$PROJECT_NUMBER (use it for 'issues')"
}

seed_issues() {
  say "Seeding first-milestone issues and adding them to the board"
  : "${PROJECT_NUMBER:=}"
  if [ -z "$PROJECT_NUMBER" ]; then
    warn "PROJECT_NUMBER not set; issues will be created but not added to the board."
    warn "Re-run as: PROJECT_NUMBER=<n> scripts/setup-github.sh issues"
  fi

  # title ||| body ||| comma-separated labels
  local tasks=(
"Stage 2.5 spec-review of SPEC-001 ||| Run the spec-review skill on SPEC-001 + JNY-001 against the scaffolded code. Resolve every HIGH in the spec; record the pass in the spec header. See docs/specs/SPEC-001-core-linearize-foundation.md. ||| task,area: core,needs: spec-review,good first issue"
"core: AT-visibility predicate (visibility.ts) ||| Implement the predicate that excludes aria-hidden / display:none / visibility:hidden / hidden subtrees, with golden fixtures (SPEC-001 AC-3). ||| task,area: core,good first issue"
"core: InterpretationNode types (types.ts) ||| Define the serialisable node model from SPEC-001 §3 (role, name, level?, flags). No live node refs in output. ||| task,area: core,good first issue"
"core: linearize() depth-first traversal ||| Implement linearize(root) — reading-order traversal emitting role + accessible name via aria-query + dom-accessibility-api (SPEC-001 AC-1,2,4,5,6). ||| task,area: core"
"core: wire exports + ESM/CDN build (tsup) ||| Export linearize + types from index.ts; confirm ESM, sideEffects:false, and a working CDN build; add a minor changeset (SPEC-001 AC-7). ||| task,area: core,area: infra"
"core: golden HTML fixtures for every AC ||| Add the fixture-based tests from SPEC-001 §8 (one focused fixture per phenomenon). ||| task,area: core,area: a11y-fidelity"
"Journey + spec: live-DOM capture via browser extension (MV3) ||| Write JNY-002 + SPEC for the extension target: live DOM incl. authenticated pages, side-panel UI over core, chrome.debugger AX tree. Needs a journey first. ||| task,area: extension,needs: spec"
"Journey + spec: npx CLI host ||| JNY + SPEC for `npx screen-reader-mirror <url>` using Playwright/CDP to feed core; offline, CI-friendly. ||| task,area: cli,needs: spec"
"Journey + spec: hosted demo (paste HTML / URL) ||| JNY + SPEC for the GitHub-Pages demo that runs core in the browser on pasted markup. Enables the deploy-pages workflow. ||| task,area: web,needs: spec"
"a11y-fidelity: verbosity profiles (NVDA/JAWS/VoiceOver) ||| Design pluggable announcement phrasing on top of the raw interpretation. Needs a spec; high-leverage, full review rigor. ||| task,area: a11y-fidelity,needs: spec"
"a11y-fidelity: visual-vs-semantic mismatch heuristics ||| Detect 'looks like a table but has no table semantics' etc. Document each heuristic + false-positive behaviour. Needs a spec. ||| task,area: a11y-fidelity,needs: spec"
"infra: commit pnpm-lock.yaml and enable CI cache ||| Run pnpm install, commit the lockfile, then enable 'cache: pnpm' in ci.yml and switch to --frozen-lockfile. ||| task,area: infra,good first issue"
  )

  for t in "${tasks[@]}"; do
    # Fields are separated by ' ||| '. awk splits on that literal separator.
    title=$(printf '%s' "$t" | awk -F ' \\|\\|\\| ' '{print $1}')
    body=$(printf '%s' "$t" | awk -F ' \\|\\|\\| ' '{print $2}')
    labels=$(printf '%s' "$t" | awk -F ' \\|\\|\\| ' '{print $3}')
    local label_args=()
    IFS=',' read -ra L <<<"$labels"
    for l in "${L[@]}"; do label_args+=(--label "$(echo "$l" | sed 's/^ *//;s/ *$//')"); done

    local url
    url=$(gh issue create --repo "$OWNER/$REPO" --title "$title" \
      --body "$body"$'\n\n_Seeded from docs/project/tasks.md. See docs/sdlc/README.md for the workflow._' \
      "${label_args[@]}")
    echo "  created: $url"
    if [ -n "$PROJECT_NUMBER" ]; then
      gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null && echo "    → added to board"
    fi
  done
}

main() {
  require_gh
  case "${1:-all}" in
    repo) create_repo ;;
    labels) create_labels ;;
    protect) protect_branch ;;
    project) create_project ;;
    issues) seed_issues ;;
    all)
      create_repo
      create_labels
      create_project
      seed_issues
      protect_branch
      say "Done. Next: open the repo, check the board, and invite your collaborator (Settings → Collaborators)."
      ;;
    *) echo "Unknown step '$1'. See the usage header."; exit 1 ;;
  esac
}

main "$@"
