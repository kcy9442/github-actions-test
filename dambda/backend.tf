terraform {
  backend "s3" {
    bucket         = "dambda-bootstrap-469072180472-tfstate"
    key            = "path/to/my/key/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-lock-table"
    encrypt        = true
  }

  # The S3 bucket and DynamoDB table are managed by dambda-bootstrap.
}
