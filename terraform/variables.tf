variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project and DNS zone."
  type        = string
}

variable "cloudflare_zone_name" {
  description = "Cloudflare DNS zone and production hostname for the portfolio, for example example.com."
  type        = string
}

variable "cloudflare_pages_project_name" {
  description = "Cloudflare Pages project name."
  type        = string
  default     = "portfolio"
}

variable "cloudflare_pages_production_branch" {
  description = "Git branch that Cloudflare Pages treats as production."
  type        = string
  default     = "main"
}
