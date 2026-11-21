# Invaris security guardrails

Run `invaris doctor` and `invaris check` from the repository root with an Invaris CLI supporting `invaris.dev/v1alpha2` structured command guards. Run `invaris challenge` to challenge the ignore guard. The commands execute the local Python script; review it and the harness before running. The harness declares `networkPolicy: unrestricted` because that is the supported policy, but its guard script only reads local files and makes no network calls. Challenges use a disposable copy and only the `.gitignore` marker is writable by the engine.

- `scan-results-ignore` requires the exact root-anchored `.tarosec/static-analysis-results/` ignore rule. Its challenge removes that exact rule in the disposable copy.
- `template-api-authorization` checks each exported async HTTP handler in `src/app/api/**/route.ts` for a literal `authorizeTemplateRequest(...)` call. This is a proposed convention: the helper does not exist yet. Implement real authentication and resource-level authorization, then adapt the guard to the chosen design. The text check can be fooled by comments, unused calls or an ineffective helper, and does not inspect middleware, alternate handler syntax, or runtime behavior. A pass is not proof of authorization.
- `react-html-sinks` reports all `dangerouslySetInnerHTML` assignments in TSX source. Some may be safe, but must be reviewed; this intentionally conservative check does not detect every HTML sink, including `innerHTML`, and does not establish exploitability. Replace with an approved safe rendering boundary or redesign and review the policy rather than suppressing findings without evidence.

The initial baseline is expected to reject: the API and HTML checks identify existing conditions, not a count of verified vulnerabilities. See the security report under `.tarosec/static-analysis-results/` for context. The structured challenge tests only the ignore rule, not authentication or XSS detection.

## Recorded baseline

On 2026-11-21, using a locally built `invaris v0.5.2-0.20261119160215-ff4f6908c392+dirty` from the adjacent Invaris checkout, `doctor` passed setup (11 pass, 1 unsupported mutation action skipped). `check` exited 1 / REJECT: ignore passed; authorization reported 16 handler matches; HTML reported five sinks across 19 TSX files. `challenge` exited 0 / ACCEPT with `remove-scan-ignore` PROVEN using structured evidence. Local JSON snapshots, when retained, describe that run and may become stale as the repository changes. A successful challenge establishes detection of this specific edit only.
