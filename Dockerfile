# Reuse the upstream native/browser runtime; the fork's source is rebuilt below.
FROM ghcr.io/lowlighter/metrics@sha256:257392f90340f916cb8b815026f259399f6b246d3eb7de38b58bfe7a07bd5b65
COPY . /metrics
WORKDIR /metrics
RUN npm run build
ENTRYPOINT ["node", "/metrics/source/app/action/index.mjs"]
