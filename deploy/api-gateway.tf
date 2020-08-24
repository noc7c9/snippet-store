#
# The API gateway, it has only the proxy route to the lambda handler
#

resource "aws_apigatewayv2_api" "api" {
  name = "${var.name}-api"
  tags = var.tags

  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.handler.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "api" {
  route_key = "$default"
  api_id    = aws_apigatewayv2_api.api.id
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_deployment" "api" {
  depends_on = [aws_apigatewayv2_route.api]

  api_id = aws_apigatewayv2_api.api.id

  lifecycle { create_before_destroy = true }
}

resource "aws_apigatewayv2_stage" "api" {
  name = "api"
  tags = var.tags

  api_id        = aws_apigatewayv2_api.api.id
  deployment_id = aws_apigatewayv2_deployment.api.id
}
