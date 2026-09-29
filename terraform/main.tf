data "cloudflare_zone" "site" {
  filter = {
    account = {
      id = var.cloudflare_account_id
    }

    name = var.cloudflare_zone_name
  }
}

resource "cloudflare_pages_project" "site" {
  account_id        = var.cloudflare_account_id
  name              = var.cloudflare_pages_project_name
  production_branch = var.cloudflare_pages_production_branch

  deployment_configs = {
    production = {
      compatibility_date = "2026-09-29"
      analytics_engine_datasets = {
        CLICKS = {
          dataset = "portfolio_clicks"
        }
      }
    }
  }
}

resource "cloudflare_pages_domain" "site" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.site.name
  name         = var.cloudflare_zone_name
}

resource "cloudflare_dns_record" "site" {
  zone_id = data.cloudflare_zone.site.id
  type    = "CNAME"

  name    = var.cloudflare_zone_name
  content = cloudflare_pages_project.site.subdomain
  ttl     = 1
  proxied = true
}
