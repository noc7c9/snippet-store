terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.2.0"
    }
  }
}

variable "region" { default = "ap-southeast-2" }
variable "env" { default = "dev" }

locals {
  service_name = "snippet-store"
  env          = var.env
  common_tags = {
    Service = local.service_name
    Env     = local.env
  }

  prefix = "${local.service_name}-${local.env}"
}

provider "aws" {
  profile = "default"
  region  = var.region
}

resource "aws_dynamodb_table" "db" {
  name         = "${local.prefix}-db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  tags = local.common_tags
}
