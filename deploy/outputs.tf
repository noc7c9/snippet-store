output "url" {
  value = "https://${var.domain_name}"
}

output "nameservers" {
  value = var.route53_zone_id == "" ? aws_route53_zone.zone[0].name_servers : null
}
