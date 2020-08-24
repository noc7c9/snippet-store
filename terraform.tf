#
# Deploys the service to either
#   - if env == prod to "snippet-store.${domain_name}"
#   - otherwise to "snippet-store-${env}.${domain_name}"
#

variable "region" { type = string }
variable "env" { type = string }
variable "domain_name" { type = string }

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.2.0"
    }
  }
}

provider "aws" {
  profile = "default"
  region  = var.region
}

provider "aws" {
  alias   = "acm_us_east_1"
  profile = "default"
  region  = "us-east-1"
}

module "main" {
  source = "./deploy"

  name = "snippet-store-${var.env}"
  tags = {
    Service = "snippet-store"
    Env     = var.env
  }
  domain_name     = "snippet-store${var.env == "prod" ? "" : "-${var.env}"}.${var.domain_name}"
  route53_zone_id = data.aws_route53_zone.zone.zone_id

  providers = {
    aws               = aws
    aws.acm_us_east_1 = aws.acm_us_east_1
  }
}

data "aws_route53_zone" "zone" {
  name = "${var.domain_name}."
}
