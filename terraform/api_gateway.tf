locals {
  api_gw_id          = data.terraform_remote_state.bic_infra.outputs.api_gw_id
  user_pool_endpoint = data.terraform_remote_state.bic_infra.outputs.auth_user_pool_endpoint
}


resource "aws_apigatewayv2_integration" "lambda_handler" {
  api_id = local.api_gw_id

  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.suggest_function.invoke_arn
  payload_format_version = "2.0"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = local.api_gw_id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.auth_client.id]
    issuer   = "https://${local.user_pool_endpoint}"
  }
}

resource "aws_apigatewayv2_route" "suggest_default_post" {
  api_id = local.api_gw_id

  route_key          = "POST /suggest"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "suggest_default_options" {
  api_id = local.api_gw_id

  route_key          = "OPTIONS /suggest"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "suggest_rate_post" {
  api_id = local.api_gw_id

  route_key          = "POST /suggest/rate"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "suggest_rate_options" {
  api_id = local.api_gw_id

  route_key          = "OPTIONS /suggest/rate"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "suggest_health_get" {
  api_id = local.api_gw_id

  route_key          = "GET /suggest/health"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE"
}
