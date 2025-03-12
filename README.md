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


## Specific Issue Agent Version

```yaml
steps:
  - name: Issue Agent
    uses: clover0/setup-issue-agent@v1
    with:
      version: "0.10.2"
```


# About Issue Agent

[Documentation](https://clover0.github.io/issue-agent/)


# GitHub Actions Cookbook

Issue Agent requires the following GitHub permissions.
- Issues: Read-only
- Contents: Readn and Write
- Pull requests: Read and Write
- [optional] Workflows: Read and Write (If you change the workflow files)

Full workflow example: [full_workflow.yml](examples/full_workflow.yml)


## Run Action by labeling an issue


Example of running an issue with the label `run-agent`.

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
      - name: Install Issue Agent Action
        uses: clover0/setup-issue-agent@v1

      # You can also use your Personal Access Token (PAT) instead of the token issued by the GitHub App
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}

      - name: Run Issue Agent Action
        run: |
          issue-agent create-pr ${GITHUB_REPOSITORY}/issues/${{ github.event.issue.number }} \
                    --base_branch main \
                    --model claude-3-7-sonnet-20250219
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```


### AWS Bedrock with OIDC


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
      - name: Install Issue Agent Action
        uses: clover0/setup-issue-agent@v1

      - name: configure aws credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: "arn:aws:iam::<AWS-ACCOUNT>:role/<ROLE-NAME>"
          role-session-name: run-agent-${{ github.run_id }}
          aws-region: "AWS-REGION"

      # You can also use your Personal Access Token (PAT) instead of the token issued by the GitHub App
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
       
      - name: Run Issue Agent Action
        run: |
          issue-agent create-pr ${GITHUB_REPOSITORY}/issues/${{ github.event.issue.number }} \
                    --base_branch main \
                    --model us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
                    --aws_region us-west-2
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
```


If regional specificity is not a concern, you can use cross-region inference with a cross-region profile.
For example, 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'.
