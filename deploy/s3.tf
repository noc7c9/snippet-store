resource "aws_s3_bucket" "website" {
  bucket = "${var.name}-website"
  tags   = var.tags

  acl = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "*" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${var.name}-website/*"
  }]
}
EOF
}

# source: https://acode.ninja/recursive-s3-upload-in-terraform
resource "aws_s3_bucket_object" "website" {
  for_each = fileset(local.client_build, "**/*.*")

  source = "${local.client_build}${each.value}"

  bucket       = aws_s3_bucket.website.bucket
  acl          = "public-read"
  key          = replace(each.value, local.client_build, "")
  etag         = filemd5("${local.client_build}${each.value}")
  content_type = lookup(local.mime_types, split(".", each.value)[length(split(".", each.value)) - 1])
}

locals {
  client_build = "${path.module}/../client/build/"
  mime_types = {
    html = "text/html"
    css  = "text/css"
    js   = "application/javascript"
  }
}
