resource "aws_route53_zone" "zone" {
  # Only create if an existing zone isn't given
  count = var.route53_zone_id == "" ? 1 : 0

  name = var.domain_name
  tags = var.tags
}

locals {
  zone_id = var.route53_zone_id == "" ? aws_route53_zone.zone[0].zone_id : var.route53_zone_id
}

resource "aws_route53_record" "a" {
  zone_id = local.zone_id
  name    = "${var.domain_name}."
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cloudfront.domain_name
    zone_id                = aws_cloudfront_distribution.cloudfront.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_acm_certificate" "cert" {
  provider = aws.acm_us_east_1

  domain_name = var.domain_name
  tags        = merge(var.tags, { Name = "${var.name}-cert" })

  validation_method = "DNS"
}

resource "aws_route53_record" "cert" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => dvo
  }

  zone_id         = local.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cert" {
  provider = aws.acm_us_east_1

  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert : record.fqdn]
}
