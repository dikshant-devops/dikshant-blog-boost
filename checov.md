# Getting Started With Checkov: A Simple, Powerful Security Scanner for Your IaC

Infrastructure-as-Code (IaC) has become the backbone of modern cloud
operations. Whether you're provisioning resources on **Google Cloud
Platform (GCP)**, AWS, or Azure, you're likely using Terraform,
Kubernetes manifests, or other IaC templates to automate deployments.

But as IaC adoption grows, so does the risk of accidentally pushing
insecure configurations --- like open firewalls, public buckets, or weak
IAM settings.

This is where **Checkov** comes in.

In this blog, we'll walk through:

-   What Checkov is\
-   Why it matters (especially in a cloud like GCP)\
-   How it works\
-   A simple real-world use case with Terraform\
-   GitHub Actions CI integration with merge-blocking security\
-   Ready-to-use workflow files

------------------------------------------------------------------------

## What Is Checkov?

**Checkov** is an open-source static analysis tool used to detect
security and compliance issues in IaC code. It scans IaC templates
*before* deployment and highlights misconfigurations that could expose
your cloud infrastructure to risks.

It supports:

-   Terraform\
-   Terraform Plan files\
-   Kubernetes manifests\
-   Helm charts\
-   CloudFormation\
-   Serverless Framework\
-   ARM / Bicep\
-   And more...

Checkov is widely used because it is:

-   **Fast** --- scans in seconds\
-   **Easy** --- only one command\
-   **Extensible** --- you can write custom policies\
-   **Cloud-aware** --- understands GCP, AWS, Azure best practices

------------------------------------------------------------------------

## Why Use Checkov for GCP?

GCP offers powerful security tools, but those tools must be configured
correctly. With IaC, even a single wrong line can create a vulnerable
resource.

Checkov helps prevent issues like:

-   Open ingress rules on a GCP Firewall\
-   Public access on a GCS bucket\
-   Weak IAM bindings\
-   Unencrypted disks\
-   Missing logging or monitoring\
-   Misconfigured network components

Checkov helps catch these problems *before deployment*, saving time and
preventing security incidents.

------------------------------------------------------------------------

## Installing Checkov

Install using pip:

``` bash
pip install checkov
```

Or using Homebrew:

``` bash
brew install checkov
```

------------------------------------------------------------------------

## Simple Use Case: Scanning a GCP Storage Bucket in Terraform

### Example Terraform Code

``` hcl
resource "google_storage_bucket" "example" {
  name          = "my-public-bucket-demo"
  location      = "US"
  force_destroy = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}
```

### Issues Detected by Checkov

Running Checkov:

``` bash
checkov -d .
```

Common failures:

-   Bucket can become **public**
-   Bucket lacks **encryption**
-   `force_destroy` is enabled (risk of accidental deletion)
-   Missing **uniform bucket-level access**

------------------------------------------------------------------------

## Fixing the Issues

Corrected Terraform configuration:

``` hcl
resource "google_storage_bucket" "example" {
  name     = "my-public-bucket-demo"
  location = "US"

  uniform_bucket_level_access = true

  encryption {
    default_kms_key_name = "projects/<PROJECT_ID>/locations/us/keyRings/my-keyring/cryptoKeys/my-key"
  }

  versioning {
    enabled = true
  }
}
```

Run Checkov again:

``` bash
checkov -d .
```

Your configuration should now pass all major checks.

------------------------------------------------------------------------

# GitHub Action Integration

### Enforcing Security Through CI

The best practice is to run Checkov automatically when a Pull Request is
raised to `main`. This prevents insecure Terraform/Kubernetes/Helm code
from being merged accidentally.

Below is a robust GitHub Actions workflow that:

-   Runs Checkov only on PRs targeting `main`\
-   Posts detailed Markdown findings inside the PR\
-   **Blocks merging if HIGH or CRITICAL issues are found**

Add this file to your repo:

    .github/workflows/checkov-pr-block.yml

------------------------------------------------------------------------

## GitHub Action: Block Merge + PR Comment + Severity Detection

``` yaml
name: Checkov IaC Scan (Block Merge on High/Critical)

on:
  pull_request:
    branches:
      - main

jobs:
  checkov:
    name: Checkov Security Scan
    runs-on: ubuntu-latest

    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install Checkov
        run: |
          pip install --upgrade pip
          pip install checkov

      - name: Run Checkov Scan
        id: scan
        run: |
          checkov -d . --output json > checkov.json || true
          checkov -d . --output markdown > checkov.md || true
          HIGH_CRITICAL_COUNT=$(jq '[.results.failed_checks[] | select(.severity == "HIGH" or .severity == "CRITICAL")] | length' checkov.json)
          echo "high_critical_count=$HIGH_CRITICAL_COUNT" >> $GITHUB_OUTPUT

      - name: Post PR Comment with Checkov Findings
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: checkov_scan_results
          message: |
            ## 🔐 Checkov IaC Scan Results
            Below are the detailed findings for this Pull Request.

            ---
            $(cat checkov.md)
            ---

      - name: Block merge on High/Critical findings
        if: ${{ steps.scan.outputs.high_critical_count > 0 }}
        run: |
          echo "❌ High or Critical Checkov findings detected."
          exit 1
```

------------------------------------------------------------------------

## Final Thoughts

Checkov is a simple yet powerful tool for improving cloud security. When
paired with GitHub Actions, it becomes a strong automated security gate
--- ensuring that only secure IaC moves forward in the deployment
pipeline.

By adopting Checkov with CI:

-   You prevent misconfigurations early\
-   Reduce manual review overhead\
-   Improve your security posture\
-   Automate compliance\
-   Empower developers with real-time feedback
