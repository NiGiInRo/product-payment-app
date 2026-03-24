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

  private_subnets = {
    for index, cidr in var.private_subnet_cidrs :
    "private-${index + 1}" => {
      cidr = cidr
      az   = data.aws_availability_zones.available.names[index]
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.name_prefix}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-subnet"
    Tier = "public"
  }
}

resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name = "${var.name_prefix}-${each.key}-subnet"
    Tier = "private"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.name_prefix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "backend" {
  name        = "${var.name_prefix}-backend-sg"
  description = "Permite SSH acotado y trafico HTTP del backend"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.allowed_ssh_cidr == null ? [] : [var.allowed_ssh_cidr]

    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  ingress {
    description = "Backend application"
    from_port   = var.backend_port
    to_port     = var.backend_port
    protocol    = "tcp"
    cidr_blocks = var.backend_ingress_cidrs
  }

  egress {
    description = "Salida general a internet"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-backend-sg"
  }
}

resource "aws_security_group" "database" {
  name        = "${var.name_prefix}-database-sg"
  description = "Permite PostgreSQL solo desde la EC2 del backend"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from backend"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    description = "Salida general"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-database-sg"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = values(aws_subnet.private)[*].id

  tags = {
    Name = "${var.name_prefix}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier                   = local.resource_names.database
  engine                       = "postgres"
  instance_class               = var.rds_instance_class
  allocated_storage            = var.db_allocated_storage
  db_name                      = var.db_name
  username                     = var.db_username
  password                     = var.db_password
  port                         = var.db_port
  db_subnet_group_name         = aws_db_subnet_group.main.name
  vpc_security_group_ids       = [aws_security_group.database.id]
  backup_retention_period      = var.db_backup_retention_period
  multi_az                     = var.db_multi_az
  publicly_accessible          = var.db_publicly_accessible
  storage_encrypted            = true
  auto_minor_version_upgrade   = true
  apply_immediately            = true
  deletion_protection          = false
  skip_final_snapshot          = true
  copy_tags_to_snapshot        = true
  performance_insights_enabled = false
  monitoring_interval          = 0

  tags = {
    Name = local.resource_names.database
  }
}
