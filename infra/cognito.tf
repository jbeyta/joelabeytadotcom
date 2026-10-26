# Accounts for /apps. Each user's data lives in the sync bucket under users/<sub>/,
# so replacing this pool would orphan every user's data. Keep it.
resource "aws_cognito_user_pool" "apps" {
  name                = "joelabeyta-apps"
  deletion_protection = "ACTIVE"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your joelabeyta.com code"
    email_message        = "Your code is {####}"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Public client: the browser calls Cognito directly. Sign-ins last 10 years.
resource "aws_cognito_user_pool_client" "apps" {
  name         = "joelabeyta-apps"
  user_pool_id = aws_cognito_user_pool.apps.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 3650

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

output "user_pool_id" {
  value = aws_cognito_user_pool.apps.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.apps.id
}
