variable "name" {
  description = "Name of the service, used as a prefix for all resource names"
  default     = "snippet-store"
}

variable "tags" {
  description = "Resource tags to add to all resources"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "The domain name of the deployment. Must be a subdomain of the existing route53 zone (if given)."
  type        = string
}

variable "route53_zone_id" {
  description = "The existing Route53 zone ID for the subdomain name. If not set a Route53 zone for the domain name will be created"
  type        = string
  default     = ""
}
