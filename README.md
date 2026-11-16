# asteroid-code

Pi coding agent + LiteLLM, in a container, for Podman on Windows (Git Bash).
Maintaining or rebuilding the image: see [CREATEME.md](CREATEME.md).

## Setup (once)

1. `cp .env.example .env`, then edit it:
   - `DEV_DIR`: use `C:/Users/you/dev` (forward slashes, no `~`)
   - `PUBLISH_REPO`: the JFrog Docker repo of the team image
   - `LITELLM_BASE_URL` and `LITELLM_API_KEY`: **required, the image contains neither**. Put them in `.env`, or as Windows env vars (System Properties > Environment Variables, then open a NEW Git Bash). A Windows env var wins over `.env`.
2. `podman machine start`.

## Use the team image (JFrog)

Add the project folder name (inside your `DEV_DIR`) after the service name:

```bash
podman compose run --rm asteroid-code astro        # Pi starts in ~/dev/astro
podman compose run --rm asteroid-code astro bash   # a shell there instead of Pi
podman compose run --rm asteroid-code              # Pi in ~/dev
```

## Git Bash gotchas

- **"the input device is not a TTY"**: Git Bash's default window can't pass a terminal to Podman. Prefix with `winpty` (`winpty podman compose run --rm asteroid-code`), or run Git Bash inside Windows Terminal.
- Shortcut for `~/.bashrc` (usage: `asteroid astro`):
  `asteroid() { winpty podman compose -f /c/path/to/this/project/docker-compose.yaml run --rm asteroid-code "$@"; }`

## Good to know

- `DEV_DIR` is `/workspace` in the container (IntelliJ sees edits live).
- **Models** are fetched from `<LITELLM_BASE_URL>/models` each time `pi` starts. No fixed list. The URL should end with `/v1`.
- `.env` is git-ignored: never commit it.
- Shell in the container: `... run --rm asteroid-code bash`.
- Empty `/workspace`? Check `DEV_DIR` and that the folder is shared with `podman machine`.
