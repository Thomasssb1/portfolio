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
    preview = {
      fail_open = true
    }
    production = {
      compatibility_date = "2026-09-29"
      fail_open          = true
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

resource "cloudflare_r2_bucket" "assets" {
  account_id    = var.cloudflare_account_id
  name          = "assets-${var.cloudflare_pages_project_name}"
  storage_class = "Standard"
}

resource "cloudflare_r2_custom_domain" "assets" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.assets.name
  domain      = "assets.${var.cloudflare_zone_name}"
  enabled     = true
  min_tls     = "1.2"
  zone_id     = data.cloudflare_zone.site.id
}

resource "cloudflare_r2_bucket_cors" "assets" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.assets.name
  rules = [{
    allowed = {
      methods = ["GET", "HEAD"]
      origins = ["https://${var.cloudflare_zone_name}", "https://*.pages.dev"]
    }
    id = "Portfolio media playback"
  }]
}

resource "cloudflare_ruleset" "asset_cache" {
  zone_id = data.cloudflare_zone.site.id
  name    = "Asset CDN cache"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [{
    ref         = "cache_r2_assets"
    description = "Cache public R2 assets on the asset domain"
    expression  = "(http.host eq \"assets.${var.cloudflare_zone_name}\")"
    action      = "set_cache_settings"
    action_parameters = {
      cache = true
      edge_ttl = {
        mode    = "override_origin"
        default = 3600
        status_code_ttl = [{
          status_code = 404
          value       = 0
        }]
      }
      browser_ttl = {
        mode = "respect_origin"
      }
    }
  }]
}
