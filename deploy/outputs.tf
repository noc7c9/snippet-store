# The URL of the service
output "url" {
  value = "https://${var.domain_name}"
}

# The name servers if a Route53 hosted zone was created
output "name_servers" {
  value = var.route53_zone_id == "" ? aws_route53_zone.zone[0].name_servers : null
}
