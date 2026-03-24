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

variable "public_subnet_cidr" {
  description = "CIDR de la subnet publica donde vivira la EC2."
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDRs de las subnets privadas reservadas para la futura base de datos."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "Define al menos dos subnets privadas para preparar RDS en dos zonas de disponibilidad."
  }
}

variable "ec2_instance_type" {
  description = "Tipo de instancia minimo previsto para el backend en EC2."
  type        = string
  default     = "t3.micro"
}

variable "ec2_root_volume_size" {
  description = "Tamano en GiB del disco raiz de la EC2."
  type        = number
  default     = 30
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

variable "backend_port" {
  description = "Puerto expuesto por el backend NestJS en la EC2."
  type        = number
  default     = 3000
}

variable "backend_ingress_cidrs" {
  description = "CIDRs autorizados para llegar al backend desde internet."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "backend_node_major_version" {
  description = "Version major de Node.js a instalar en la EC2."
  type        = number
  default     = 22
}

variable "backend_systemd_service_name" {
  description = "Nombre del servicio systemd del backend."
  type        = string
  default     = "product-checkout-api"
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

variable "db_port" {
  description = "Puerto esperado para PostgreSQL en RDS."
  type        = number
  default     = 5432
}

variable "db_allocated_storage" {
  description = "Storage inicial en GiB para la instancia RDS."
  type        = number
  default     = 20
}

variable "db_backup_retention_period" {
  description = "Dias de retencion de backups automaticos para RDS."
  type        = number
  default     = 1
}

variable "db_multi_az" {
  description = "Mantener desactivado para esta primera version de bajo costo."
  type        = bool
  default     = false
}

variable "db_publicly_accessible" {
  description = "La base de datos debe permanecer privada."
  type        = bool
  default     = false
}
