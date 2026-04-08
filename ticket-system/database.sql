-- =============================================
-- TICKET SYSTEM - Base de Datos
-- =============================================

CREATE DATABASE IF NOT EXISTS ticket_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticket_system;

-- Tabla Careers
CREATE TABLE IF NOT EXISTS careers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Tabla Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  career_id INT,
  active BOOLEAN DEFAULT TRUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'user',  -- admin, user, dev
  failed_attempts INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (career_id) REFERENCES careers(id)
);

-- Tabla Types (Tipos de ticket)
CREATE TABLE IF NOT EXISTS types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  area VARCHAR(100)
);

-- Tabla Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255)
);

-- Tabla Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type_id INT,
  status VARCHAR(20) DEFAULT 'open',   -- open, in_progress, closed
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES types(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla Tickets_Devs
CREATE TABLE IF NOT EXISTS tickets_devs (
  id_ticket INT NOT NULL,
  id_user INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_ticket, id_user),
  FOREIGN KEY (id_ticket) REFERENCES tickets(id),
  FOREIGN KEY (id_user) REFERENCES users(id)
);

-- =============================================
-- Datos de prueba
-- =============================================

INSERT INTO careers (name, active) VALUES
  ('Ingeniería en Sistemas', TRUE),
  ('Ingeniería Industrial', TRUE),
  ('Administración', TRUE),
  ('Contabilidad', FALSE);

-- Password: Admin123! (bcrypt)
INSERT INTO users (name, last_name, username, email, career_id, password, rol) VALUES
  ('Admin', 'Sistema', 'admin', 'admin@sistema.com', 1, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Juan', 'Pérez', 'jperez', 'juan@sistema.com', 1, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dev'),
  ('María', 'López', 'mlopez', 'maria@sistema.com', 2, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

INSERT INTO types (type, description, area) VALUES
  ('Bug', 'Error en el sistema', 'Desarrollo'),
  ('Feature', 'Nueva funcionalidad', 'Producto'),
  ('Soporte', 'Solicitud de soporte', 'TI');

INSERT INTO categories (name, description) VALUES
  ('Frontend', 'Problemas de interfaz'),
  ('Backend', 'Problemas de servidor'),
  ('Base de Datos', 'Problemas de BD');

INSERT INTO tickets (title, description, type_id, status, priority, created_by) VALUES
  ('Error en login', 'No permite iniciar sesión con credenciales válidas', 1, 'open', 'high', 3),
  ('Nuevo reporte', 'Agregar reporte de usuarios activos', 2, 'in_progress', 'medium', 3),
  ('Lentitud en consultas', 'Las consultas tardan más de 5 segundos', 1, 'open', 'high', 2);

INSERT INTO tickets_devs (id_ticket, id_user) VALUES
  (2, 2),
  (3, 2);
