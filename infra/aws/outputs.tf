output "aws_region" {
  description = "Region configurada para esta base de Terraform."
  value       = var.aws_region
}

output "resource_names" {
  description = "Nombres base previstos para los recursos principales."
  value       = local.resource_names
}

output "planned_network_cidr" {
  description = "CIDR reservado para la futura VPC del Slice 3."
  value       = var.vpc_cidr
}

output "planned_ec2_instance_type" {
  description = "Tipo de instancia previsto para el backend."
  value       = var.ec2_instance_type
}

output "planned_rds_instance_class" {
  description = "Clase de instancia prevista para la base de datos."
  value       = var.rds_instance_class
}

output "planned_s3_bucket_name" {
  description = "Bucket previsto para el frontend estatico."
  value       = var.s3_bucket_name
}
