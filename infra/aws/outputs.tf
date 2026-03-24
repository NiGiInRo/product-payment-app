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

output "vpc_id" {
  description = "ID de la VPC principal."
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID de la subnet publica reservada para la EC2."
  value       = aws_subnet.public.id
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas reservadas para RDS."
  value       = values(aws_subnet.private)[*].id
}

output "backend_security_group_id" {
  description = "Security group del backend en EC2."
  value       = aws_security_group.backend.id
}

output "database_security_group_id" {
  description = "Security group de la base de datos."
  value       = aws_security_group.database.id
}

output "db_subnet_group_name" {
  description = "Subnet group usado por RDS."
  value       = aws_db_subnet_group.main.name
}

output "db_instance_id" {
  description = "Identificador de la instancia RDS."
  value       = aws_db_instance.main.id
}

output "db_endpoint" {
  description = "Endpoint privado de la instancia RDS."
  value       = aws_db_instance.main.address
}

output "db_name" {
  description = "Nombre de la base de datos inicial."
  value       = aws_db_instance.main.db_name
}

output "db_connection_info" {
  description = "Datos base para construir DATABASE_URL en el backend."
  value = {
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
    username = aws_db_instance.main.username
  }
  sensitive = true
}

output "database_url_template" {
  description = "Template seguro para armar DATABASE_URL manualmente."
  value       = "postgresql://${var.db_username}:<db_password>@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}?schema=public"
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
