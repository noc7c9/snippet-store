resource "aws_cloudfront_distribution" "cloudfront" {
  comment = "${var.name}-distribution"
  tags    = var.tags

  enabled = true
  aliases = [var.domain_name]

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert.arn
    ssl_support_method  = "sni-only"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  origin {
    origin_id   = "s3"
    domain_name = aws_s3_bucket.website.website_endpoint

    custom_origin_config {
      origin_protocol_policy = "http-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    origin_id   = "api"
    domain_name = replace(aws_apigatewayv2_api.api.api_endpoint, "/^https:///", "")

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id = "s3"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    target_origin_id = "api"

    path_pattern    = "/api/*"
    allowed_methods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    forwarded_values {
      query_string = true
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
  }
}
