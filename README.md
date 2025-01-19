<p align="center">
  <h1 align="center">setup-issue-agent</h1>
  <p align="center">GitHub Action for Issue Agent</p>
</p>

---

# Usage

## Latest Version

```yaml
steps:
  - name: Issue Agent
    uses: clover0/setup-issue-agent@v0.1.0
```

## Specific Version

```yaml
steps:
  - name: Issue Agent
    uses: clover0/setup-issue-agent@v0.1.0
    with:
      version: 0.2.0
```

# About Issue Agent
[https://clover0.github.io/issue-agent/](Documentation)

# GitHub Action Cookbook

## If the issue is labeled
Example, If the issue is labeled with `run-agent`, run the Issue Agent Action.

```yml
name: Run Agent on Label

on:
  issues:
    types:
      - labeled

jobs:
  run-agent:
    if: ${{ github.event.label.name == 'run-agent' }}
    permissions:
      contents: write
      pull-requests: write
      issues: read
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Issue Agent Action
        uses: clover0/setup-issue-agent@v0.0.9

      - name: Run Issue Agent Action
        run: |
          issue-agent version

      - name: Run Issue Agent Action
        run: |
          issue-agent issue --github_owner ${GITHUB_REPOSITORY_OWNER} \
                    --work_repository ${GITHUB_REPOSITORY#*/} \
                    --github_issue_number ${{ github.event.issue.number }} \
                    --base_branch main \
                    --model claude-3-5-sonnet-latest \
                    --language Japanese
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

```
