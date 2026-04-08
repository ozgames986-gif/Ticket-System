const pool = require('../config/db');

// POST /tickets
const createTicket = async (req, res) => {
  const { title, description, type_id, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'El campo title es requerido' });
  try {
    const [result] = await pool.query(
      `INSERT INTO tickets (title, description, type_id, priority, created_by) VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, type_id || null, priority || 'medium', req.user.id]
    );
    res.status(201).json({ message: 'Ticket creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /tickets
const getTickets = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, tp.type AS type_name, u.username AS created_by_user
       FROM tickets t
       LEFT JOIN types tp ON t.type_id = tp.id
       LEFT JOIN users u ON t.created_by = u.id
       ORDER BY t.created_at DESC`
    );
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /tickets/:id
const getTicketById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, tp.type AS type_name, u.username AS created_by_user
       FROM tickets t
       LEFT JOIN types tp ON t.type_id = tp.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /tickets/filter
const filterTickets = async (req, res) => {
  const { status, type_id, user_id, priority } = req.query;
  let query = `SELECT t.*, tp.type AS type_name, u.username AS created_by_user
               FROM tickets t LEFT JOIN types tp ON t.type_id = tp.id
               LEFT JOIN users u ON t.created_by = u.id WHERE 1=1`;
  const params = [];
  if (status)   { query += ' AND t.status = ?';   params.push(status); }
  if (type_id)  { query += ' AND t.type_id = ?';  params.push(type_id); }
  if (user_id)  { query += ' AND t.created_by = ?'; params.push(user_id); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  try {
    const [rows] = await pool.query(query, params);
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// PUT /tickets/:id
const updateTicket = async (req, res) => {
  const { title, description, type_id, priority } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE tickets SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type_id = COALESCE(?, type_id),
        priority = COALESCE(?, priority)
       WHERE id = ?`,
      [title || null, description || null, type_id || null, priority || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({ message: 'Ticket actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// PATCH /tickets/:id/status
const updateTicketStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'in_progress', 'closed'];
  if (!status || !valid.includes(status))
    return res.status(400).json({ error: `Estado inválido. Opciones: ${valid.join(', ')}` });
  try {
    const [result] = await pool.query('UPDATE tickets SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({ message: 'Estado actualizado', status });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// POST /tickets/:id/assign
const assignTicket = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id es requerido' });
  try {
    // Verificar que el usuario sea dev
    const [userRows] = await pool.query('SELECT rol FROM users WHERE id = ?', [user_id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (userRows[0].rol !== 'dev') return res.status(400).json({ error: 'El usuario debe tener rol dev' });

    await pool.query(
      'INSERT IGNORE INTO tickets_devs (id_ticket, id_user) VALUES (?, ?)',
      [req.params.id, user_id]
    );
    res.json({ message: 'Ticket asignado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /tickets/user/:user_id
const getTicketsByUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, tp.type AS type_name FROM tickets t
       LEFT JOIN types tp ON t.type_id = tp.id
       WHERE t.created_by = ?`,
      [req.params.user_id]
    );
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { createTicket, getTickets, getTicketById, filterTickets, updateTicket, updateTicketStatus, assignTicket, getTicketsByUser };
