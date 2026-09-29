output "pages_project_name" {
  description = "Cloudflare Pages project name."
  value       = cloudflare_pages_project.site.name
}

output "pages_domain" {
  description = "Production custom domain attached to the Pages project."
  value       = cloudflare_pages_domain.site.name
}

output "pages_subdomain" {
  description = "Cloudflare-generated Pages subdomain."
  value       = cloudflare_pages_project.site.subdomain
}
