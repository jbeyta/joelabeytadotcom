terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Shares the paa state bucket. The key must stay different from paa's "state/terraform.tfstate".
  backend "s3" {
    bucket  = "gromulax-paa-terraform-state"
    key     = "joelabeyta-com/terraform.tfstate"
    region  = "us-east-1"
    profile = "gromulax"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "gromulax"
}
