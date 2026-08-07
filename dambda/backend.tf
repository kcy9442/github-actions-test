terraform {
  backend "s3" {
    bucket       = "dambda-469072180472-terraform-state"
    key          = "dambda/terraform.tfstate"
    region       = "ap-northeast-2"
    encrypt      = true
    use_lockfile = true
  }
}
