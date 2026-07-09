locals {
  user_pool_id = data.terraform_remote_state.bic_infra.outputs.auth_user_pool_id
}

resource "aws_cognito_user_pool_client" "auth_client" {
  name         = "bic-suggest-client"
  user_pool_id = local.user_pool_id

  generate_secret = true

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  access_token_validity  = var.token_config.access_token
  id_token_validity      = var.token_config.id_token
  refresh_token_validity = var.token_config.refresh_token
}
