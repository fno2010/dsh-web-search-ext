## Summary
<!-- What changes and why. Link the issue if there is one. -->

## Type
- [ ] feat — new backend / setting / behaviour
- [ ] fix — bugfix
- [ ] docs — README / comments, no behaviour change
- [ ] test — test-only
- [ ] ci — workflow / release process
- [ ] chore — deps / packaging, no user-facing change

## Checklist
- [ ] `npm test` passes locally (Part A; Part B live smoke when not in CI)
- [ ] New backend or behaviour has a mocked failover scenario in `test/failover.test.mjs`
- [ ] No API keys or secrets in the diff
- [ ] `README.md` (+ `README.zh.md`) updated when user-facing
- [ ] `CHANGELOG.md` entry added when user-facing
- [ ] For releases: `version` in `package.json` bumped (tag + GitHub Release happen after merge — see CONTRIBUTING.md)
