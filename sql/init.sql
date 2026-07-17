-- =============================================================================
-- Gym Management System - SQL Initialization Script
-- =============================================================================
-- This script is a REFERENCE for the database structure.
-- Prisma handles migrations, but this script allows direct MySQL setup
-- if needed (e.g., on a fresh Ubuntu VPS without Prisma CLI).
--
-- Usage:
--   mysql -u root -p < sql/init.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS gym_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gym_management;

-- ---------------------------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL UNIQUE,
  slug       VARCHAR(50)  NOT NULL UNIQUE,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- MODULES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon        VARCHAR(50)  NULL,
  path        VARCHAR(100) NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  role_id    INT          NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX idx_users_role_id (role_id),
  INDEX idx_users_email (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- USER PERMISSIONS (Pivot: Users <-> Modules)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_permissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT     NOT NULL,
  module_id  INT     NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_read   BOOLEAN NOT NULL DEFAULT TRUE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY uq_user_module (user_id, module_id),
  INDEX idx_permissions_user (user_id),
  INDEX idx_permissions_module (module_id),
  CONSTRAINT fk_permissions_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_permissions_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- BRANCHES (Sucursales)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  address    VARCHAR(255) NULL,
  city       VARCHAR(100) NULL,
  state      VARCHAR(100) NULL,
  phone      VARCHAR(20)  NULL,
  email      VARCHAR(150) NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Roles
INSERT INTO roles (name, slug) VALUES
  ('Super Administrador', 'super-admin'),
  ('Administrador', 'admin'),
  ('Mantenimiento', 'mantenimiento'),
  ('Recepción', 'recepcion'),
  ('Coach', 'coach'),
  ('Limpieza', 'limpieza')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Modules
INSERT INTO modules (name, slug, description, icon, path, sort_order) VALUES
  ('Usuarios', 'usuarios', 'Gestión de empleados, roles y permisos del sistema', 'Users', '/dashboard/usuarios', 1),
  ('Sucursales', 'sucursales', 'Gestión de sedes y ubicaciones del gimnasio', 'Building2', '/dashboard/sucursales', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Admin User (password: admin123 hashed with bcrypt, 12 rounds)
-- NOTE: This hash is pre-generated. If you need to regenerate it, use:
--   node -e "require('bcryptjs').hash('admin123', 12).then(console.log)"
INSERT INTO users (email, password, first_name, last_name, role_id) VALUES
  ('admin@gym.com', '$2a$12$LJ3m4ys3LzHb5VQ5GIE9/.BVHQ1PkCfz8W5bK7b.FyO5LnCnOhHy', 'Admin', 'Principal', 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Admin Permissions (full CRUD on all modules)
INSERT INTO user_permissions (user_id, module_id, can_create, can_read, can_update, can_delete) VALUES
  (1, 1, TRUE, TRUE, TRUE, TRUE),
  (1, 2, TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE can_create = VALUES(can_create);
