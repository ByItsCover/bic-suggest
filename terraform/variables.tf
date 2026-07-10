# General AWS

variable "aws_region" {
  type        = string
  description = "AWS Region"
}

variable "environment" {
  type        = string
  description = "Deployment Environment"
}

# Terraform Cloud

variable "tfe_org_name" {
  type        = string
  description = "Terraform Cloud organization name"
  default     = "ByItsCover"
}

variable "bic_infra_workspace" {
  type        = string
  description = "Terraform Cloud Workspace BIC-Infra name"
}

variable "bic_site_workspace" {
  type        = string
  description = "Terraform Cloud Workspace BIC-Site name"
}

# Lambda

variable "lambda_name" {
  type        = string
  description = "Name of Lambda Function"
  default     = "suggest-lambda"
}

variable "lambda_memory" {
  type        = number
  description = "Memory in MB allotted to Lambda function"
  default     = 1024
}

variable "lambda_timeout" {
  type        = number
  description = "Lambda function timeout duration in seconds"
  default     = 30
}

variable "log_level" {
  type        = string
  description = "Application log level for Lambda Function"
  default     = "DEBUG"
}

variable "token_config" {
  description = "Configuration for auth token expiration times"
  type = object({
    access_token  = number # Access token valid for 1 hour
    id_token      = number # ID token valid for 1 hour
    refresh_token = number # Refresh token valid for 30 days
  })
  default = {
    access_token  = 1
    id_token      = 1
    refresh_token = 30
  }
}
