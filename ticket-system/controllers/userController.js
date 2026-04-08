const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// POST /users
const createUser = async (req, res) => {
  const { name, last_name, username, email, career_id, password, rol } = req.body;
  const required = [name, last_name, username, email, password];
  if (required.some(f => !f))
    return res.status(400).json({ error: 'Faltan campos requeridos (name, last_name, username, email, password)' });

  try {
    const [dup] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?', [email, username]
    );
    if (dup.length > 0)
      return res.status(400).json({ error: 'Email o username ya están en uso' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, last_name, username, email, career_id, password, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, last_name, username, email, career_id || null, hashed, rol || 'user']
    );
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /users
const getUsers = async (req, res) => {
  const { page = 1, limit = 10, sort = 'id', order = 'ASC' } = req.query;
  const validSorts = ['id', 'name', 'email', 'created_at', 'rol'];
  const validOrders = ['ASC', 'DESC'];
  const sortCol = validSorts.includes(sort) ? sort : 'id';
  const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.last_name, u.username, u.email, u.rol, u.active, u.failed_attempts, u.created_at, c.name AS career
       FROM users u LEFT JOIN careers c ON u.career_id = c.id
       ORDER BY u.${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    res.json({ total, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /users/:id
const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.last_name, u.username, u.email, u.rol, u.active, u.career_id, c.name AS career, u.created_at
       FROM users u LEFT JOIN careers c ON u.career_id = c.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /users/filter
const filterUsers = async (req, res) => {
  const { name, email, career, rol } = req.query;
  let query = `SELECT u.id, u.name, u.last_name, u.username, u.email, u.rol, u.active, c.name AS career
               FROM users u LEFT JOIN careers c ON u.career_id = c.id WHERE 1=1`;
  const params = [];

  if (name)   { query += ' AND u.name LIKE ?';   params.push(`%${name}%`); }
  if (email)  { query += ' AND u.email LIKE ?';  params.push(`%${email}%`); }
  if (career) { query += ' AND c.name LIKE ?';   params.push(`%${career}%`); }
  if (rol)    { query += ' AND u.rol = ?';        params.push(rol); }

  try {
    const [rows] = await pool.query(query, params);
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// PATCH /users/:id/status
const updateStatus = async (req, res) => {
  const { active } = req.body;
  if (active === undefined)
    return res.status(400).json({ error: 'El campo active es requerido (true/false)' });
  try {
    const [result] = await pool.query('UPDATE users SET active = ? WHERE id = ?', [active, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: `Usuario ${active ? 'activado' : 'desactivado'}` });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// PUT /users/:id
const updateUser = async (req, res) => {
  const allowed = ['name', 'last_name', 'username', 'email', 'career_id', 'rol', 'password'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'Sin campos válidos para actualizar' });
  if (fields.length > 5)  return res.status(400).json({ error: 'Máximo 5 campos por solicitud' });

  try {
    const values = [];
    const sets = [];
    for (const f of fields) {
      if (f === 'password') {
        sets.push('password = ?');
        values.push(await bcrypt.hash(req.body[f], 10));
      } else {
        sets.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// DELETE /users/:id
const deleteUser = async (req, res) => {
  const { hard } = req.query;
  try {
    let result;
    if (hard === 'true') {
      [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    } else {
      [result] = await pool.query('UPDATE users SET active = FALSE WHERE id = ?', [req.params.id]);
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: hard === 'true' ? 'Usuario eliminado físicamente' : 'Usuario desactivado (eliminación lógica)' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { createUser, getUsers, getUserById, filterUsers, updateStatus, updateUser, deleteUser };
