# Claude Code commands for Devo Reflect

A cheat sheet for the skills, subagents, hook and settings set up for this project.

**Where things live**

| Kind | Location | In this repo? |
|---|---|---|
| Project skill `firestore-safe-change` | `.claude/skills/` | Yes |
| Project subagent `firestore-rules-auditor` | `.claude/agents/` | Yes |
| Personal skills (`commit-push`, `pre-commit-check`, `review-changes`, `pr-description`) | `~/.claude/skills/` | No, this Mac only |
| Personal subagents (`test-runner`, `code-reviewer`, `codebase-explorer`) | `~/.claude/agents/` | No, this Mac only |
| Test-output hook | `~/.claude/hooks/filter-test-output.sh`, registered in `~/.claude/settings.json` | No, this Mac only |
| Default model and effort | `~/.claude/settings.json` | No, this Mac only |

If a skill or agent doesn't show up, run `/reload-skills`, or restart Claude Code if the folder is new.

---

## Skills (type the command in Claude Code)

| Command | What it does | Notes |
|---|---|---|
| `/pre-commit-check` | Finds and runs lint, typecheck and unit tests, and fixes failures. | Runs `test:rules` only if rules or indexes changed. |
| `/review-changes` | Reviews uncommitted changes for bugs, error handling, hardcoded values and debug code. | Read-only. It reports and doesn't edit. |
| `/commit-push` | Writes a commit message, stages files by name, commits and pushes. | Manual only. Stops and asks on `release`, `main` or `master`. Never force-pushes. |
| `/pr-description [base-branch]` | Writes a PR title and body from the branch diff. | Prints text only. Doesn't open the PR. |
| `/firestore-safe-change` | Checks rules, index and data-shape changes for backward compatibility. | Never runs `deploy:firestore`. |

---

## Subagents (ask in plain language, or @-mention)

| Subagent | Example prompt | Model |
|---|---|---|
| `test-runner` | "Use the test-runner subagent to run the checks." | haiku |
| `code-reviewer` | "Use the code-reviewer subagent on my changes." | sonnet |
| `codebase-explorer` | "Use the codebase-explorer subagent: where is X handled?" | haiku |
| `firestore-rules-auditor` | "Use the firestore-rules-auditor subagent before I deploy rules." | sonnet |

Claude may also delegate to them on its own based on their descriptions.
To run a whole session as one agent: `claude --agent code-reviewer`.

---

## Automatic pieces (no command needed)

| Piece | What it does |
|---|---|
| `CLAUDE.md` | Loaded every session. Project map, production warning, branch flow, compaction instructions. |
| Test-output hook | Trims `npm test`, `jest`, `pytest` and similar to failures plus a short summary. Keeps the real exit code. Commands with `;`, `&&`, pipes or redirects are left alone. |
| Default model and effort | Sonnet at medium effort for new sessions. |

To see the full, unfiltered output of a test command, ask Claude to chain it, for example `npm test; true`.

---

## Session commands

| Command | Use |
|---|---|
| `/clear` | Start fresh between unrelated tasks. |
| `/compact` | Shrink a long session. Uses the compact instructions in `CLAUDE.md`. |
| `/context` | See what is filling the context window. |
| `/usage` | See token use. |
| `/model` | Switch model, for example to Opus for hard problems. |
| `/effort low\|medium\|high` | Change thinking effort for the session. |
| `/mcp` | Turn off MCP servers you aren't using. |
| `/hooks` | Check the test-output hook is listed under PreToolUse. |
| `/reload-skills` | Pick up a brand-new skills folder. |
| Shift+Tab | Plan mode, for bigger changes. |
| Esc, Esc | Rewind to a checkpoint. |

---

## Typical workflows

**Before committing**
1. `/pre-commit-check`
2. `/review-changes`
3. `/commit-push` (on `dev`)

**Changing Firestore rules or data shape**
1. Edit `firestore.rules` and add a case to `tests/rules/firestore.rules.test.ts`.
2. `/firestore-safe-change`
3. Ask for the `firestore-rules-auditor` subagent for an independent security read.
4. `npm run test:rules`
5. Deploy only after you decide: `npm run deploy:firestore`. Claude won't do this unasked.

**Opening a PR**
1. `/pr-description` (or `/pr-description release` to compare against `release`)
2. Review the text, then open the PR yourself or ask Claude to.

**Understanding unfamiliar code**
- "Use the codebase-explorer subagent: how does the Brethren sharing flow work?"

**Shipping to production** (`dev` to `release`, Vercel deploys from `release`)
1. `/pre-commit-check`, then `npx expo export --platform web`
2. Review what is going out.
3. Ask Claude to merge `dev` into `release`. It will confirm first, since this is production.

---

## Smoke test after a restart

1. Type `/` and confirm the five skills appear.
2. Ask: "Use the test-runner subagent to run the checks." Expect a short pass/fail report.
3. Ask Claude to run `npm test`. Expect only a short summary, not full output.
4. Run `/hooks` and look for the PreToolUse entry.
5. Run `/model` and confirm Sonnet is the default.
6. Make a tiny change and run `/commit-push`.

---

## Known trade-offs

- `code-reviewer` and `/review-changes` overlap. Use the subagent for big diffs and the skill for quick checks.
- `/commit-push` pushes to `dev` without an extra prompt.
- Medium effort can under-think hard problems. Use `/effort high` when needed.
- `CLAUDE.md` and this file can go stale. Update them when the project changes.
