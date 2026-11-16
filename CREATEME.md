# Building and publishing the image (for maintainers)

Everyday usage is in [README.md](README.md). Do the README setup first, and fill **all** of `.env` (`BASE_REPO`, `NPM_REGISTRY`, `PUBLISH_REPO`, `LITELLM_BASE_URL`, `LITELLM_API_KEY`). The image contains no LiteLLM URL and no key: they are only given at run time.

## What's in the image

| File | Role |
|---|---|
| `image/Dockerfile` | Node 24 base, Pi, `.npmrc`, extensions |
| `image/config/packages.txt` | Pi extensions, one per line (`npm:name@version`) |
| `image/config/settings.json` | Pi default settings |
| `image/certs/` | Optional corporate CA `.crt` files |
| `image/asteroid-init.mjs` | Fetches the model list from LiteLLM at each `pi` start |
| `image/entrypoint.sh` | Handles `asteroid-code <project> [command]` |

The image's `.npmrc`: `strict-ssl=false`, `registry=$NPM_REGISTRY`, `@astro:registry=https://registry.npmjs.org/`. Registries needing a token are not supported yet.

## 1. Build and test locally

```bash
podman compose -f docker-compose.local.yaml build
podman compose -f docker-compose.local.yaml run --rm asteroid-code astro
```

`run` starts a one-off container, `--rm` deletes it on exit. The image, your files and the sessions volume stay.

Quick checks:

```bash
podman compose -f docker-compose.local.yaml run --rm asteroid-code bash
pi list                  # the 7 extensions
node -v                  # 24.x
cat ~/.npmrc
```

## 2. Change the image: experiment, then write it down

**Rule: the Dockerfile and `image/config/` are the only source of truth. Never `podman commit`**: it freezes hand-made changes nobody can review or reproduce, and it saves the container's environment (your key and LiteLLM URL would end up in the image).

Workflow:

1. **Experiment** in a throwaway container (no compose, so no key or URL inside):

```bash
podman run --rm -it --name asteroid-tweak asteroid-code:local bash
# try things: npm i -g ..., pi install ..., edit config; test with pi
```

2. **See what you changed** (from another terminal, while it is still running):

```bash
podman diff asteroid-tweak
```

3. **Write the keepers into the repo**, then exit (everything else is discarded):

| You did | Put it in |
|---|---|
| `pi install npm:x@1.2.3` | `image/config/packages.txt` |
| `apt-get install x` | the `apt-get install` line of `image/Dockerfile` |
| Changed Pi settings | `image/config/settings.json` |
| Other Pi config or files | a `COPY` + `RUN` in `image/Dockerfile` |
| New Pi version | `ARG PI_VERSION` in `image/Dockerfile` |
| Company CA certificate | `image/certs/*.crt` |

4. **Rebuild and re-test** (every rebuild replays all your changes):

```bash
podman compose -f docker-compose.local.yaml build
podman compose -f docker-compose.local.yaml run --rm asteroid-code astro
```

Before publishing, check the image holds no secret: `podman inspect asteroid-code:local --format '{{.Config.Env}}'` must show no key or URL.

## 3. Delete / rebuild / clean

```bash
podman rmi asteroid-code:local                                     # delete the local image
podman compose -f docker-compose.local.yaml build --no-cache       # rebuild from scratch
podman compose -f docker-compose.local.yaml down -v                # remove containers + sessions volume
podman image prune                                                 # remove dangling layers
podman images                                                      # list images
podman machine stop && podman machine start                        # restart the Podman VM if it misbehaves
```

## 4. Publish to JFrog

1. Choose the new version and put it in `docker-compose.yaml` (`asteroid-code:1.0.0`).
2. Tag and push with the **same** path (`PUBLISH_REPO/asteroid-code:<version>`):

```bash
podman tag asteroid-code:local mycompany.jfrog.io/docker-local/asteroid-code:1.0.1
podman push mycompany.jfrog.io/docker-local/asteroid-code:1.0.1
```

3. Test it as a teammate would: delete the local image, then run the team file.

```bash
podman rmi asteroid-code:local mycompany.jfrog.io/docker-local/asteroid-code:1.0.1
podman compose run --rm asteroid-code astro
```

4. Share the updated `docker-compose.yaml` (the new tag) with the team: they just need to pull your repo and run as in the README.
