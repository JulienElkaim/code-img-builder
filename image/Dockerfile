ARG BASE_REPO
FROM ${BASE_REPO}/node:24-bookworm-slim

ARG PI_VERSION=0.73.1
ARG NPM_REGISTRY

USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates git curl openssh-client ripgrep fd-find less procps unzip \
 && ln -s "$(command -v fdfind)" /usr/local/bin/fd \
 && rm -rf /var/lib/apt/lists/*

# Optional corporate CA certs (*.crt) from image/certs/
COPY certs/ /usr/local/share/ca-certificates/corp/
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY config/ /usr/local/share/asteroid/
COPY asteroid-init.mjs /usr/local/share/asteroid/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh
RUN mkdir -p /workspace /home/node/.pi/agent /home/node/.pi/sessions \
 && chown -R node:node /workspace /home/node/.pi

USER node
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PATH=/home/node/.local/bin:/home/node/.npm-global/bin:${PATH}

RUN printf 'strict-ssl=false\nregistry=%s\n@astro:registry=https://registry.npmjs.org/\n' "$NPM_REGISTRY" > /home/node/.npmrc \
 && npm install -g "@mariozechner/pi-coding-agent@${PI_VERSION}" \
 && cp /usr/local/share/asteroid/settings.json /home/node/.pi/agent/settings.json \
 && tr -d '\r' < /usr/local/share/asteroid/packages.txt | grep -vE '^\s*(#|$)' | while read -r pkg; do pi install "$pkg"; done

# `pi` wrapper: refresh the LiteLLM model list every time Pi is launched
RUN mkdir -p /home/node/.local/bin \
 && printf '#!/bin/sh\nnode /usr/local/share/asteroid/asteroid-init.mjs\nexec /home/node/.npm-global/bin/pi "$@"\n' > /home/node/.local/bin/pi \
 && chmod +x /home/node/.local/bin/pi

ENV PI_CODING_AGENT_SESSION_DIR=/home/node/.pi/sessions \
    PI_SKIP_VERSION_CHECK=1 \
    PI_TELEMETRY=0

WORKDIR /workspace
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
