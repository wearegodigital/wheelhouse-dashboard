#!/usr/bin/env bash
# Sync the shared contract file from the wheelhouse backend repo.
#
# Usage:
#   ./scripts/sync-contract.sh              # Fetch from GitHub main branch
#   ./scripts/sync-contract.sh --local PATH # Copy from local backend repo
#   ./scripts/sync-contract.sh --check      # Validate only (for CI)

set -euo pipefail

CONTRACT_FILE="src/contract/wheelhouse-contract.ts"
GITHUB_RAW="https://raw.githubusercontent.com/wearegodigital/wheelhouse/main/wheelhouse/contract/wheelhouse-contract.ts"

case "${1:-}" in
  --local)
    LOCAL_PATH="${2:?Usage: $0 --local /path/to/wheelhouse}"
    SOURCE="$LOCAL_PATH/wheelhouse/contract/wheelhouse-contract.ts"
    if [[ ! -f "$SOURCE" ]]; then
      echo "Error: Contract file not found at $SOURCE"
      exit 1
    fi
    cp "$SOURCE" "$CONTRACT_FILE"
    echo "Synced contract from local: $SOURCE"
    ;;
  --check)
    TEMP=$(mktemp)
    trap 'rm -f "$TEMP"' EXIT
    if ! curl -sfL "$GITHUB_RAW" -o "$TEMP"; then
      echo "Warning: Could not fetch contract from GitHub. Skipping check."
      exit 0
    fi
    if diff -q "$CONTRACT_FILE" "$TEMP" > /dev/null 2>&1; then
      echo "Contract is in sync with backend."
      exit 0
    else
      echo "Contract drift detected! Dashboard contract differs from backend."
      echo ""
      diff -u "$CONTRACT_FILE" "$TEMP" || true
      echo ""
      echo "Run: ./scripts/sync-contract.sh to update."
      exit 1
    fi
    ;;
  "")
    TEMP=$(mktemp)
    trap 'rm -f "$TEMP"' EXIT
    if ! curl -sfL "$GITHUB_RAW" -o "$TEMP"; then
      echo "Error: Could not fetch contract from GitHub."
      echo "Try: $0 --local /path/to/wheelhouse"
      exit 1
    fi
    cp "$TEMP" "$CONTRACT_FILE"
    echo "Synced contract from GitHub main branch."
    ;;
  *)
    echo "Usage: $0 [--local PATH | --check]"
    exit 1
    ;;
esac
