provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      project = "dambda"
    }
  }
}

# Terraform state를 위한 계정 고유 S3 버킷
resource "aws_s3_bucket" "terraform_state" {
  bucket = "dambda-bootstrap3-bucket" # 고유한 버킷 이름
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_encryption" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-lock-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
