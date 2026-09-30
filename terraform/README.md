# Portfolio infrastructure

This stack provisions the production Cloudflare Pages project for the portfolio,
attaches the apex custom domain, and creates the proxied CNAME required by Pages.
Pages serves the frontend through Cloudflare's CDN. The deployment workflow stores Terraform state in an existing R2 bucket.
The project also binds a Workers Analytics Engine dataset to Pages Functions
that count homepage views and outbound-link redirects. These counters do not use R2.
A separate R2 bucket serves public assets through `assets.<zone-name>`.
Upload the seven Reddit video examples to that bucket manually.

## Prerequisites

- The DNS zone must already exist in the specified Cloudflare account.
- Set `CLOUDFLARE_API_TOKEN` to an API token with **Pages:Write** and
  **Workers R2 Storage:Write** for the account, plus **DNS:Edit** and
  **Zone:Read** for the zone.
- Create an R2 bucket for Terraform state before the first deployment. Terraform
  cannot create the bucket that stores its own state.
- Install Terraform 1.13 or later.
- Install terraform-docs 0.20 or later to update the generated documentation.
- Install Node.js 22 or later for Wrangler and frontend checks.

## First apply

```sh
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with the account ID and domain.
terraform init -backend=false
terraform apply
```

This creates a Direct Upload Pages project and the public R2 asset domain.
The deployment workflow uploads `frontend/` with Wrangler. Upload the videos
to R2 manually after Terraform creates the bucket.

## GitHub Actions

`.github/workflows/validate.yml` runs on pull requests and pushes to `main`. It
checks HTML linting, formatting, analytics tests, and Terraform configuration.

`.github/workflows/deploy-terraform.yml` runs only after a successful validation
of a push to `main` or a manually dispatched validation. It checks out that
validated commit, uses the `production` GitHub environment, applies Terraform
with the remote R2 state backend, then uploads `frontend/` to Pages with Wrangler.

Add these `production` environment secrets before the first deployment:

- `CLOUDFLARE_API_TOKEN`
- `TF_STATE_R2_ACCESS_KEY_ID`
- `TF_STATE_R2_SECRET_ACCESS_KEY`

Add these `production` environment variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_NAME`
- `TF_STATE_BUCKET`

## Before the first deployment

1. Add the domain as an active Cloudflare zone and delegate its nameservers to
   Cloudflare. Remove or import an existing apex DNS record that would conflict
   with the Terraform-managed Pages CNAME. Remove any existing
   `assets.<zone-name>` record before attaching the R2 custom domain.
2. In Cloudflare R2, create an empty state bucket such as `portfolio-tf-state`.
   Create an R2 API token with **Object Read & Write** limited to that bucket.
   Copy its Access Key ID and Secret Access Key. The secret is shown once.
3. Create a Cloudflare API token scoped to this account and zone. Grant
   **Account: Pages: Write**, **Account: Workers R2 Storage: Write**,
   **Zone: DNS: Edit**, and **Zone: Zone: Read**.
4. In GitHub, open **Settings > Environments > production**, and add
   the three secrets and three variables listed above.
5. Commit the workflows to `main`. A push to `main` runs validation, then
   Terraform and the Wrangler upload after validation passes.

## Manual deployment

In GitHub Actions, open **Validate**, select **Run workflow**, and choose `main`.
After it passes, the deployment workflow starts automatically and uploads the
same validated commit. This is the manual route because it keeps the validation
gate in place.

For a local frontend upload after the Pages project already exists, authenticate
with `npx wrangler login`, then run:

```sh
npm ci
npm run deploy:frontend -- --project-name=portfolio --branch=main
```

## Reddit video assets

After Terraform creates the asset bucket, `assets-portfolio` by default,
download these files from the [reddit-2-video v1.1.0 release](https://github.com/Thomasssb1/reddit-2-video/releases/tag/v1.1.0) and upload them to the bucket under `reddit-videos/v1.1.0/`:

- `example-1.mp4`
- `example-2.mp4`
- `example-3-1.mp4`, `example-3-2.mp4`, `example-3-3.mp4`
- `example-4.mp4`
- `example-5.mp4`.

Keep the filenames and path exact, and serve each object as `video/mp4`. For example, the first file should load at `https://assets.<zone-name>/reddit-videos/v1.1.0/example-1.mp4`. Production videos will fail to load until the objects are present. Local development and `pages.dev` previews continue to use the GitHub release. Cloudflare may take a few minutes to activate a new R2 custom domain.

Run `npm run dev` to preview the site with Pages Functions locally. The
Analytics Engine binding does not record local views or clicks.

## Views and link click counts

External links use `/go/<name>` redirects. The Pages Function writes only the
link name to the `portfolio_clicks` dataset. Homepage loads write `pageview`
and a source tag to the same dataset. Cloudflare adds an event timestamp. The
dataset is created automatically after the first recorded event. Email links
stay as direct `mailto:` links and are not counted.

The accepted tags are `cv` and `linkedin`. Use `/?cv` for the link in your CV
or `/?linkedin` for LinkedIn. To add another tag, edit `ACCEPTED_TAGS` in
`functions/index.js` and redeploy. The URL must have exactly one bare tag, with
no value. Unknown tags, values, and multiple parameters count as `untagged`.
Only the tag is written to Analytics Engine, not the full query string. Do not
put names, email addresses, or unique identifiers in tags. Views and clicks may
include automated traffic, and repeat loads count again. Tags show which link
was used, not who visited, so treat the totals as approximate.

To read counts, create a separate Cloudflare API token with **Account Analytics:
Read** permission. This token is for querying data, not for deployment, and
does not need to be added to GitHub. Query the
[Workers Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/):

```sh
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  --header "Authorization: Bearer <ACCOUNT_ANALYTICS_READ_TOKEN>" \
  --data "SELECT blob2 AS source, SUM(_sample_interval) AS views FROM portfolio_clicks WHERE blob1 = 'pageview' GROUP BY source ORDER BY views DESC"
```

To see whether views are rising, group the last 30 days by day and source:

```sh
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  --header "Authorization: Bearer <ACCOUNT_ANALYTICS_READ_TOKEN>" \
  --data "SELECT toStartOfDay(timestamp) AS day, blob2 AS source, SUM(_sample_interval) AS views FROM portfolio_clicks WHERE blob1 = 'pageview' AND timestamp >= NOW() - INTERVAL '30' DAY GROUP BY day, source ORDER BY day DESC, source ASC"
```

For outbound click counts:

```sh
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  --header "Authorization: Bearer <ACCOUNT_ANALYTICS_READ_TOKEN>" \
  --data "SELECT blob1 AS link, SUM(_sample_interval) AS clicks FROM portfolio_clicks WHERE blob1 != 'pageview' GROUP BY link ORDER BY clicks DESC"
```

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
| [cloudflare_r2_bucket.assets](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/r2_bucket) | resource |
| [cloudflare_r2_custom_domain.assets](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/r2_custom_domain) | resource |
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
| <a name="output_asset_bucket_name"></a> [asset\_bucket\_name](#output\_asset\_bucket\_name) | R2 bucket for public assets. |
| <a name="output_asset_cdn_base_url"></a> [asset\_cdn\_base\_url](#output\_asset\_cdn\_base\_url) | Public base URL for the asset CDN. |
| <a name="output_pages_domain"></a> [pages\_domain](#output\_pages\_domain) | Production custom domain attached to the Pages project. |
| <a name="output_pages_project_name"></a> [pages\_project\_name](#output\_pages\_project\_name) | Cloudflare Pages project name. |
| <a name="output_pages_subdomain"></a> [pages\_subdomain](#output\_pages\_subdomain) | Cloudflare-generated Pages subdomain. |
<!-- END_TF_DOCS -->
