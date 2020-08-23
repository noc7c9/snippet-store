resource "aws_dynamodb_table" "db" {
  name = "${var.name}-db"
  tags = var.tags

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

  point_in_time_recovery { enabled = true }

  lifecycle { prevent_destroy = true }
}
