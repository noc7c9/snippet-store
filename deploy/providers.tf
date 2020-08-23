terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.2.0"
    }
  }
}

provider "aws" {
  # Only ACM certificates issued in us-east-1 can be used with CloudFront
  alias = "acm_us_east_1"
}
