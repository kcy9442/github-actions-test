# Existing account-level bootstrap resources predate this Terraform state.
# Keep their identifiers stable and import them before Terraform reconciles
# configuration, rather than attempting to recreate them.
import {
  to = aws_dynamodb_table.terraform_lock
  id = "terraform-lock-table"
}

import {
  to = aws_iam_openid_connect_provider.github_actions
  id = "arn:aws:iam::469072180472:oidc-provider/token.actions.githubusercontent.com"
}

import {
  to = aws_iam_role.github_actions_role
  id = "github-actions-role"
}

import {
  to = aws_iam_policy.core
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-core"
}

import {
  to = aws_iam_policy.data
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-data"
}

import {
  to = aws_iam_policy.network
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-network"
}

import {
  to = aws_iam_policy.compute
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-compute"
}
