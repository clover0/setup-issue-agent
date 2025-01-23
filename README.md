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
    uses: clover0/setup-issue-agent@v1
```

## Specific Version

```yaml
steps:
  - name: Issue Agent
    uses: clover0/setup-issue-agent@v1
    with:
      version: "0.2.5"
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
        uses: clover0/setup-issue-agent@v1

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

### AWS Bedrock with OIDC

`claude-3-5-sonnet-20241022-v2` is recommended.

If you do not care about regions, you can also use cross-region inference. 
In that case, use cross-region profile. For Example, `us.anthropic.claude-3-5-sonnet-20241022-v2:0`.


```yml
name: Run Agent on Label

on:
  issues:
    types:
      - labeled

jobs:
  run-agent-oidc:
    if: ${{ github.event.label.name == 'run-agent' }}
    permissions:
      contents: write
      pull-requests: write
      issues: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Issue Agent Action
        uses: clover0/setup-issue-agent@v1

      - name: configure aws credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: "arn:aws:iam::<AWS-ACCOUNT>:role/<ROLE-NAME>"
          role-session-name: run-agent-${{ github.run_id }}
          aws-region: "AWS-REGION"

      - name: Run Issue Agent Action
        run: |
          issue-agent version

      - name: Run Issue Agent Action
        run: |
          issue-agent issue --github_owner ${GITHUB_REPOSITORY_OWNER} \
                    --work_repository ${GITHUB_REPOSITORY#*/} \
                    --github_issue_number ${{ github.event.issue.number }} \
                    --base_branch main \
                    --model us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
                    --log_level debug \
                    --language Japanese \
                    --aws_region us-west-1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
