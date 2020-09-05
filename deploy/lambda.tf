#
# The API lambda handler
#

resource "aws_lambda_function" "handler" {
  function_name = "${var.name}-handler"
  tags          = var.tags

  filename         = "${path.module}/../server/build.zip"
  source_code_hash = filebase64sha256("${path.module}/../server/build.zip")

  handler     = "build/lambda.handler"
  runtime     = "nodejs12.x"
  memory_size = 256
  role        = aws_iam_role.handler.arn

  environment {
    variables = {
      NODE_ENV       = "production"
      STORAGE        = "dynamodb"
      DYNAMODB_TABLE = aws_dynamodb_table.db.name
    }
  }
}

resource "aws_iam_role" "handler" {
  name = "${var.name}-handler-role"
  tags = var.tags

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
}

# Cloudwatch Logs policy
resource "aws_iam_policy" "handler_cloudwatch_logs" {
  name = "${var.name}-handler-cloudwatch-logs-policy"

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

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

resource "aws_iam_role_policy_attachment" "handler_cloudwatch_logs" {
  role       = aws_iam_role.handler.name
  policy_arn = aws_iam_policy.handler_cloudwatch_logs.arn
}

# DynamoDB IAM policy
resource "aws_iam_policy" "handler_dynamodb" {
  name = "${var.name}-handler-dynamodb-policy"

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