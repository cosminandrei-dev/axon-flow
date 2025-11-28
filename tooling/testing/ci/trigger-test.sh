#!/usr/bin/env bash
#
# CI Workflow Manual Trigger Test Script
#
# This script manually triggers the CI workflow using GitHub CLI
# and polls for completion.
#
# Usage: ./trigger-test.sh [branch]
#
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - Repository must have workflow_dispatch enabled
#
# Example:
#   ./trigger-test.sh main
#   ./trigger-test.sh feature/my-branch

set -euo pipefail

BRANCH="${1:-main}"
WORKFLOW="ci.yml"
MAX_WAIT_SECONDS=900  # 15 minutes
POLL_INTERVAL=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}CI Workflow Manual Trigger Test${NC}"
echo "=================================="
echo ""
echo "Branch: $BRANCH"
echo "Workflow: $WORKFLOW"
echo "Max wait: ${MAX_WAIT_SECONDS}s"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Trigger the workflow
echo "Triggering workflow..."
gh workflow run "$WORKFLOW" --ref "$BRANCH"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to trigger workflow.${NC}"
    exit 1
fi

echo -e "${GREEN}Workflow triggered successfully.${NC}"
echo ""

# Wait a few seconds for the run to appear
sleep 5

# Get the latest run ID
echo "Getting latest workflow run..."
RUN_ID=$(gh run list --workflow="$WORKFLOW" --branch="$BRANCH" --limit=1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo -e "${RED}Could not find workflow run.${NC}"
    exit 1
fi

echo "Run ID: $RUN_ID"
echo ""

# Poll for completion
WAITED=0
while [ $WAITED -lt $MAX_WAIT_SECONDS ]; do
    STATUS=$(gh run view "$RUN_ID" --json status,conclusion --jq '.status')
    CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion // "pending"')

    echo -e "Status: $STATUS, Conclusion: $CONCLUSION (waited ${WAITED}s)"

    if [ "$STATUS" = "completed" ]; then
        echo ""
        if [ "$CONCLUSION" = "success" ]; then
            echo -e "${GREEN}✅ Workflow completed successfully!${NC}"

            # Print duration
            DURATION=$(gh run view "$RUN_ID" --json updatedAt,createdAt --jq '(((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 60 | floor)')
            echo "Duration: ${DURATION} minutes"

            exit 0
        else
            echo -e "${RED}❌ Workflow failed with conclusion: $CONCLUSION${NC}"
            echo ""
            echo "View details: gh run view $RUN_ID"
            echo "View logs: gh run view $RUN_ID --log"
            exit 1
        fi
    fi

    sleep $POLL_INTERVAL
    WAITED=$((WAITED + POLL_INTERVAL))
done

echo -e "${RED}Timeout: Workflow did not complete within ${MAX_WAIT_SECONDS}s${NC}"
echo "View status: gh run view $RUN_ID"
exit 1
