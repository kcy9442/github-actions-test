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

import {
  to = aws_iam_policy.eks
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-eks"
}

import {
  to = aws_iam_policy.observability
  id = "arn:aws:iam::469072180472:policy/github-actions-policy-observability"
}

# These resources were successfully created by a previous partial bootstrap
# apply, so adopt them into this state rather than attempting a second create.
import {
  to = aws_budgets_budget.dambda
  id = "469072180472:dambda-monthly"
}

import {
  to = aws_s3_bucket.cloudtrail
  id = "my-app-dev-cloudtrail-469072180472"
}

import {
  to = aws_cloudtrail.main
  id = "arn:aws:cloudtrail:ap-northeast-2:469072180472:trail/my-app-dev-trail"
}
