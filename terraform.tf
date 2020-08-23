terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.2.0"
    }
  }
}

################################################################################
# Variables
#

variable "region" {
  default = "ap-southeast-2"
}

variable "environment" {
  default = "dev"
}

################################################################################
# Providers, Locals, Data
#

locals {
  service_name = "snippet-store"
  common_tags = {
    Service = local.service_name
    Env     = var.environment
  }

  name_prefix = "${local.service_name}-${var.environment}"
}

provider "aws" {
  profile = "default"
  region  = var.region
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

################################################################################
# DynamoDB Table
#

resource "aws_dynamodb_table" "db" {
  name         = "${local.name_prefix}-db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}

################################################################################
# API Gateway
#

resource "aws_apigatewayv2_api" "api" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"

  tags = local.common_tags
}

resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.handler.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_deployment" "api" {
  api_id = aws_apigatewayv2_api.api.id

  lifecycle { create_before_destroy = true }
  depends_on = [aws_apigatewayv2_route.api]
}

resource "aws_apigatewayv2_stage" "api" {
  api_id        = aws_apigatewayv2_api.api.id
  name          = var.environment
  deployment_id = aws_apigatewayv2_deployment.api.id

  tags = local.common_tags
}

################################################################################
# Lambda
#

resource "aws_lambda_function" "handler" {
  function_name = "${local.name_prefix}-handler"

  filename         = "${path.module}/server/build.zip"
  source_code_hash = filebase64sha256("${path.module}/server/build.zip")

  role = aws_iam_role.handler.arn

  handler     = "src/lambda.handler"
  runtime     = "nodejs10.x"
  memory_size = 256

  environment {
    variables = {
      NODE_ENV       = "production"
      ROUTE_PREFIX   = "/${var.environment}"
      STORAGE        = "dynamodb"
      DYNAMODB_TABLE = aws_dynamodb_table.db.name
    }
  }

  tags = local.common_tags
}

resource "aws_iam_role" "handler" {
  name = "${local.name_prefix}-handler-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

  tags = local.common_tags
}

resource "aws_iam_policy" "handler_cloudwatch_logs" {
  name = "${local.name_prefix}-handler-cloudwatch-logs-policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "logs:CreateLogGroup",
    "Resource": "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
  }, {
    "Effect": "Allow",
    "Action": [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ],
    "Resource": [
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${aws_lambda_function.handler.function_name}:*"
    ]
  }]
}
EOF
}

resource "aws_iam_role_policy_attachment" "handler_cloudwatch_logs" {
  role       = aws_iam_role.handler.name
  policy_arn = aws_iam_policy.handler_cloudwatch_logs.arn
}

resource "aws_iam_policy" "handler_dynamodb" {
  name = "${local.name_prefix}-handler-dynamodb-policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query"
    ],
    "Resource": ["${aws_dynamodb_table.db.arn}"]
  }]
}
EOF
}

resource "aws_iam_role_policy_attachment" "handler_dynamodb" {
  role       = aws_iam_role.handler.name
  policy_arn = aws_iam_policy.handler_dynamodb.arn
}

resource "aws_lambda_permission" "api_handler_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handler.function_name
  principal     = "apigateway.amazonaws.com"
}

################################################################################
# S3 Website
#

resource "aws_s3_bucket" "website" {
  bucket = "${local.name_prefix}-website"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  tags = local.common_tags

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "*" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${local.name_prefix}-website/*"
  }]
}
EOF
}

locals {
  mime_types = {
    html = "text/html"
    css  = "text/css"
    js   = "application/javascript"
  }
  client_build = "${path.module}/client/build/"
}

# source: https://acode.ninja/recursive-s3-upload-in-terraform
resource "aws_s3_bucket_object" "website" {
  for_each     = fileset(local.client_build, "**/*.*")
  bucket       = aws_s3_bucket.website.bucket
  key          = replace(each.value, local.client_build, "")
  source       = "${local.client_build}${each.value}"
  acl          = "public-read"
  etag         = filemd5("${local.client_build}${each.value}")
  content_type = lookup(local.mime_types, split(".", each.value)[length(split(".", each.value)) - 1])
}

################################################################################
# CloudFront
#

resource "aws_cloudfront_distribution" "cloudfront" {
  comment = "${local.name_prefix}-distribution"
  enabled = true

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

  origin {
    origin_id   = "api"
    domain_name = replace(aws_apigatewayv2_api.api.api_endpoint, "/^https:///", "")
    origin_path = "/${var.environment}"

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
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

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = local.common_tags
}

################################################################################
# Outputs
#

output "url" {
  value = "https://${aws_cloudfront_distribution.cloudfront.domain_name}"
}
