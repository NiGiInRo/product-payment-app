variable "aws_region" {
  description = "Region unica de AWS para todos los recursos del proyecto."
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefijo base para nombrar recursos de AWS de forma consistente."
  type        = string
  default     = "product-paid-app"
}

variable "vpc_cidr" {
  description = "CIDR base que se usara en el Slice 3 para la VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "ec2_instance_type" {
  description = "Tipo de instancia minimo previsto para el backend en EC2."
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  description = "Clase minima prevista para PostgreSQL en RDS."
  type        = string
  default     = "db.t3.micro"
}

variable "s3_bucket_name" {
  description = "Nombre globalmente unico del bucket S3 para el frontend."
  type        = string
  default     = null
  nullable    = true
}

variable "ec2_key_pair_name" {
  description = "Nombre del key pair existente en AWS para acceso SSH a la EC2."
  type        = string
  default     = null
  nullable    = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR autorizado para SSH hacia la EC2. Se definira antes de crear security groups."
  type        = string
  default     = null
  nullable    = true
}

variable "db_name" {
  description = "Nombre logico inicial de la base de datos PostgreSQL."
  type        = string
  default     = "product_paid_app"
}

variable "db_username" {
  description = "Usuario administrador inicial para RDS PostgreSQL."
  type        = string
  default     = "app_user"
}

variable "db_password" {
  description = "Password del usuario administrador de RDS. No debe versionarse con valores reales."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
}
