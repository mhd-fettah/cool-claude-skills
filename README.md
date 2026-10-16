# cool-claude-skills
collection of cool claude skills

## Skills

| Skill | What it does |
|---|---|
| [explainer-video-maker](skills/explainer-video-maker/README.md) | Turns docs, links, or text files into a narrated, animated explainer MP4. Runs offline, no API key. |

## Layout

- `skills/<name>/` — source of truth for each skill (`SKILL.md` + any scripts/references).
- `.claude/skills/<name>` — local, git-ignored link so Claude Code loads the dev copy when run in this repo.

## Local dev setup (Windows)

```
mkdir .claude\skills
mklink /J .claude\skills\explainer-video-maker skills\explainer-video-maker
```

On macOS/Linux: `ln -s ../../skills/explainer-video-maker .claude/skills/explainer-video-maker`

## Releasing

Merge to `master`, tag a version (e.g. `explainer-video-maker-v1.0.0`), then re-upload the skill to claude.ai.
