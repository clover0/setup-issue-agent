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
      version: "0.14.1"
```


# About Issue Agent

[Documentation](https://clover0.github.io/issue-agent/)


# GitHub Actions Cookbook

Issue Agent requires the following GitHub permissions.
- Issues: Read-only
- Contents: Readn and Write
- Pull requests: Read and Write
- [optional] Workflows: Read and Write (If you change the workflow files)

Full workflow examples: [examples/](examples)


## Run Action by labeling an issue


Example of running an issue with the label `run-agent`.

```yml
name: Run Agent on Label

on:
  issues:
    types:
      - labeled

permissions: {}

jobs:
  run-agent:
    if: ${{ github.event.label.name == 'run-agent' }}
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
                    --aws_region us-east-1
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
```


If regional specificity is not a concern, you can use cross-region inference with a cross-region profile.
For example, 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'.


## Run Action by commenting on an Pull Request

```yml
name: Run Agent

on:
  # Run the workflow on pull request review comment creation event.
  pull_request_review_comment:
    types:
      - created

permissions:
  id-token: write

jobs:
  # React to review comment with `/agent` prefix in review comment
  react-to-review-comment:
    if: ${{ github.event_name == 'pull_request_review_comment' && startsWith(github.event.comment.body, '/agent')}}
    name: React to Review comment
    runs-on: ubuntu-latest
    steps:
      - name: Install Issue Agent Action
        uses: clover0/setup-issue-agent@v1

      - name: configure aws credentials
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502 # 4.0.2
        with:
          role-to-assume: "arn:aws:iam::<AWS-ACCOUNT>:role/<ROLE-NAME>"
          role-session-name: run-agent-${{ github.run_id }}
          aws-region: "<AWS-REGION>"

      - uses: actions/create-github-app-token@c1a285145b9d317df6ced56c09f525b5c2b6f755 # v1.11.1
        id: app-token
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Run Issue Agent Action
        run: |
          issue-agent react ${GITHUB_REPOSITORY}/pulls/comments/${{ github.event.comment.id }} \
                    --model us.anthropic.claude-3-7-sonnet-20250219-v1:0 \
                    --log_level debug \
                    --aws_region us-east-1
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
```
