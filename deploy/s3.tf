#
# S3 website bucket
#
# And also sync all the files in the client/build folder
#

locals {
  build_dir = "${path.module}/../client/build/"

  # lookup table from file extension to mime type
  mime_types = {
    html = "text/html"
    css  = "text/css"
    js   = "application/javascript"
  }
}

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

# Upload all build files
#
# source: https://acode.ninja/recursive-s3-upload-in-terraform
resource "aws_s3_bucket_object" "website" {
  for_each = fileset(local.build_dir, "**/*.*")

  source = "${local.build_dir}${each.value}"

  bucket = aws_s3_bucket.website.bucket
  acl    = "public-read"
  key    = replace(each.value, local.build_dir, "")
  etag   = filemd5("${local.build_dir}${each.value}")

  # note: this will error, if the file type is not recognized
  content_type = local.mime_types[regex("\\.([0-9a-zA-Z]+)$", each.value)[0]]
}
