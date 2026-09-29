# Portfolio infrastructure

This stack provisions the production Cloudflare Pages project for the portfolio,
attaches the apex custom domain, and creates the proxied CNAME required by Pages.
Pages serves the frontend through Cloudflare's CDN; no R2 bucket is provisioned.

## Prerequisites

- The DNS zone must already exist in the specified Cloudflare account.
- Set `CLOUDFLARE_API_TOKEN` to an API token with **Zone:Read**, **DNS:Edit**,
  **Pages:Read**, and **Pages:Edit** for that account and zone.
- Install Terraform 1.13 or later.

## First apply

```sh
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with the account ID and domain.
terraform init
terraform apply
```

The Pages project deliberately has no Git source or build configuration: the
frontend has not been selected yet. After it exists, either connect the GitHub
repository in the Cloudflare Pages dashboard or deploy build output with
Wrangler. Keep `main` as the production branch unless the deployment workflow
uses a different branch.

When the site later needs separately managed content, add an opt-in R2 bucket
and custom domain (for example, `content.example.com`) rather than mixing those
assets with the Pages deployment.
