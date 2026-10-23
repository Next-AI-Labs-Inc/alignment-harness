# A sealed machine for trying the Alignment Harness as a new user would.
# It has its own home folder and its own Claude Code; nothing from the host's ~/.claude is visible,
# and its network cannot reach the host or anything on your local network (see seal.sh).
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends git bash ca-certificates less procps ripgrep \
      iptables iproute2 netcat-openbsd util-linux \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code@latest
RUN useradd -m -u 1001 -s /bin/bash dev && mkdir -p /auth && chown dev:dev /auth
COPY seed-persona.sh /usr/local/bin/seed-persona.sh
COPY enter.sh /usr/local/bin/enter.sh
COPY seal.sh /usr/local/bin/seal.sh
RUN chmod +x /usr/local/bin/seed-persona.sh /usr/local/bin/enter.sh /usr/local/bin/seal.sh
# Keep the sign-in from bringing the account's claude.ai connectors (Gmail, Calendar, …) into the sandbox.
ENV ENABLE_CLAUDEAI_MCP_SERVERS=false
WORKDIR /home/dev
# Starts as root ONLY to close the network, then drops to the unprivileged user "dev".
ENTRYPOINT ["/usr/local/bin/seal.sh"]
