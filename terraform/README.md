# Portfolio infrastructure

Terraform creates the Cloudflare Pages project and manages its domain, DNS, and the R2 bucket for public media. Cloudflare owns changes to the Pages project's settings after creation, including its encrypted secrets. GitHub Actions deploys the site after validation passes. Terraform state lives in a separate R2 bucket.

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

Push to `main`, or run the **Validate** workflow on `main` in GitHub Actions. After validation passes, **Deploy Terraform** applies the infrastructure, uploads media from `frontend/assets/` to R2, and deploys the frontend to Pages. The production site is <https://thomasbeer.uk>. HTTP and HTTPS requests to `www.thomasbeer.uk` receive a 301 redirect to the same path and query string on `https://thomasbeer.uk`. The proxied WWW DNS record and redirect rule are managed by Terraform, so Cloudflare redirects these requests before contacting the origin.

## Local preview

Run `npm run dev` from the repository root to preview the site with Pages Functions. Local views and clicks do not appear in Analytics Engine.

## Analytics

Pages Functions count homepage views and outbound link clicks in the `portfolio_clicks` Analytics Engine dataset. `/?cv` and `/?linkedin` label views from those links. Use the [Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) to query counts.

## GitHub activity

The header shows daily contribution squares grouped by week. The Pages Function requests GitHub's GraphQL contribution calendar at `/api/github-activity` and caches the result for one hour. Local development shows mock activity until live data loads. Production hides the grid if live activity is unavailable.

To enable it, create a fine-grained GitHub personal access token for `Thomasssb1` with public repository read access and no additional permissions. In Cloudflare Pages, open the `portfolio` project, select the **production** environment, then go to **Settings > Variables and Secrets**. Add `GITHUB_ACTIVITY_TOKEN` and select **Encrypt**. Deploy Pages again so the Function receives it. Do not put the token in Terraform variables or the repository. Terraform no longer updates the Pages project after creation, so later applies leave Cloudflare-managed secrets in place.

For a local preview, put `GITHUB_ACTIVITY_TOKEN=...` in an untracked `.dev.vars` file at the repository root before running `npm run dev`.

Terraform's generated resource, input, and output tables are in [REFERENCE.md](REFERENCE.md).
