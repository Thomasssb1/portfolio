# Portfolio infrastructure

Terraform manages the Cloudflare Pages project, its domain and DNS, and the R2 bucket for public media. GitHub Actions deploys the site after validation passes. Terraform state lives in a separate R2 bucket.

## Set up production

1. Add the domain as an active Cloudflare zone and delegate its nameservers. Remove any DNS records that conflict with the root domain or `assets.<zone-name>`.
2. Create an R2 bucket for Terraform state. Create R2 access keys for that bucket and for media uploads to `assets-portfolio`.
3. Create a Cloudflare API token with Pages and Workers R2 Storage write access for the account, plus DNS edit, Zone read, Cache Rules edit, Rulesets edit, and Filter Lists edit access for the zone and account as applicable.
4. In GitHub, create the `production` environment with these secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `TF_STATE_R2_ACCESS_KEY_ID`
   - `TF_STATE_R2_SECRET_ACCESS_KEY`
   - `ASSET_R2_ACCESS_KEY_ID`
   - `ASSET_R2_SECRET_ACCESS_KEY`
5. Add these `production` environment variables:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ZONE_NAME`
   - `TF_STATE_BUCKET`

The asset bucket is created by Terraform. If you want to limit its access keys to that bucket, create those keys after the first Terraform apply, then rerun the deployment.

## Deploy

Push to `main`, or run the **Validate** workflow on `main` in GitHub Actions. After validation passes, **Deploy Terraform** applies the infrastructure, uploads media from `frontend/assets/` to R2, and deploys the frontend to Pages. The production site is <https://thomasbeer.uk>.

## Local preview

Run `npm run dev` from the repository root to preview the site with Pages Functions. Local views and clicks do not appear in Analytics Engine.

## Analytics

Pages Functions count homepage views and outbound link clicks in the `portfolio_clicks` Analytics Engine dataset. `/?cv` and `/?linkedin` label views from those links. Use the [Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) to query counts.

Terraform's generated resource, input, and output tables are in [REFERENCE.md](REFERENCE.md).
