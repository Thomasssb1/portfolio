# Portfolio infrastructure

This stack provisions the production Cloudflare Pages project for the portfolio,
attaches the apex custom domain, and creates the proxied CNAME required by Pages.
Pages serves the frontend through Cloudflare's CDN. The deployment workflow stores Terraform state in an existing R2 bucket.

## Prerequisites

- The DNS zone must already exist in the specified Cloudflare account.
- Set `CLOUDFLARE_API_TOKEN` to an API token with **Zone:Read**, **DNS:Edit**,
  **Pages:Read**, and **Pages:Edit** for that account and zone.
- Create an R2 bucket for Terraform state before the first deployment. Terraform
  cannot create the bucket that stores its own state.
- Install Terraform 1.13 or later.
- Install terraform-docs 0.20 or later to update the generated documentation.

## First apply

```sh
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with the account ID and domain.
terraform init -backend=false
terraform apply
```

## GitHub Actions

`.github/workflows/validate.yml` runs on pull requests and pushes to `main`. It
checks HTML linting, formatting, and Terraform configuration.

`.github/workflows/deploy-terraform.yml` runs only after a successful validation
of a push to `main`. It checks out that validated commit, uses the `production`
GitHub environment, and applies Terraform with the remote R2 state backend.

Add these production environment secrets before the first deployment:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_NAME`
- `TF_STATE_BUCKET`
- `TF_STATE_R2_ACCESS_KEY_ID`
- `TF_STATE_R2_SECRET_ACCESS_KEY`

When the site later needs separately managed content, add an R2 bucket and
custom domain, for example `content.example.com`, rather than mixing those assets with the Pages deployment.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.13.0 |
| <a name="requirement_cloudflare"></a> [cloudflare](#requirement\_cloudflare) | ~> 5 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_cloudflare"></a> [cloudflare](#provider\_cloudflare) | 5.26.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [cloudflare_dns_record.site](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/dns_record) | resource |
| [cloudflare_pages_domain.site](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/pages_domain) | resource |
| [cloudflare_pages_project.site](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/pages_project) | resource |
| [cloudflare_zone.site](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/data-sources/zone) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_cloudflare_account_id"></a> [cloudflare\_account\_id](#input\_cloudflare\_account\_id) | Cloudflare account ID that owns the Pages project and DNS zone. | `string` | n/a | yes |
| <a name="input_cloudflare_pages_production_branch"></a> [cloudflare\_pages\_production\_branch](#input\_cloudflare\_pages\_production\_branch) | Git branch that Cloudflare Pages treats as production. | `string` | `"main"` | no |
| <a name="input_cloudflare_pages_project_name"></a> [cloudflare\_pages\_project\_name](#input\_cloudflare\_pages\_project\_name) | Cloudflare Pages project name. | `string` | `"portfolio"` | no |
| <a name="input_cloudflare_zone_name"></a> [cloudflare\_zone\_name](#input\_cloudflare\_zone\_name) | Cloudflare DNS zone and production hostname for the portfolio, for example example.com. | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_pages_domain"></a> [pages\_domain](#output\_pages\_domain) | Production custom domain attached to the Pages project. |
| <a name="output_pages_project_name"></a> [pages\_project\_name](#output\_pages\_project\_name) | Cloudflare Pages project name. |
| <a name="output_pages_subdomain"></a> [pages\_subdomain](#output\_pages\_subdomain) | Cloudflare-generated Pages subdomain. |
<!-- END_TF_DOCS -->
