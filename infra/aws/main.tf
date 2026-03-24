locals {
  resource_names = {
    backend  = "${var.name_prefix}-backend"
    database = "${var.name_prefix}-db"
    frontend = "${var.name_prefix}-frontend"
  }

  common_tags = {
    Project   = var.name_prefix
    ManagedBy = "Terraform"
  }
}
