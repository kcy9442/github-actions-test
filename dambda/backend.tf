terraform {
  backend "s3" {
    bucket       = "dambda-bootstrap-469072180472-tfstate"
    key          = "path/to/my/key/terraform.tfstate"
    region       = "ap-northeast-2"
    use_lockfile = true
    encrypt      = true
  }

  # The S3 bucket is managed by dambda-bootstrap.
}
