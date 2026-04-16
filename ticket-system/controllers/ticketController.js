const pool = require('../config/db');
const base = `FROM tickets t 
LEFT JOIN types tp ON t.type_id=tp.id 
LEFT JOIN users u ON t.created_by=u.id`;

const createTicket = async (req, res) => {
  const { title, description, type_id, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'title requerido' });
  try {
    const [{ insertId: id }] = await pool.query(
      `INSERT INTO tickets (title,description,type_id,priority,created_by) VALUES (?,?,?,?,?)`,
      [title, description || null, type_id || null, priority || 'medium', req.user.id]
    );
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getTickets = async (req, res) => {
  try {
    const [data] = await pool.query(`SELECT t.*,tp.type type_name,u.username created_by_user ${base} ORDER BY t.created_at DESC`);
    res.json({ total: data.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getTicketById = async (req, res) => {
  try {
    const [[t]] = await pool.query(`SELECT t.*,tp.type type_name,u.username created_by_user ${base} WHERE t.id=?`, [req.params.id]);
    t ? res.json(t) : res.status(404).json({ error: 'No encontrado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const filterTickets = async (req, res) => {
  const { status, type_id, user_id, priority } = req.query;
  let q = `SELECT t.*,tp.type type_name,u.username created_by_user ${base} WHERE 1=1`, p = [];
  if (status)   q += ' AND t.status=?',     p.push(status);
  if (type_id)  q += ' AND t.type_id=?',    p.push(type_id);
  if (user_id)  q += ' AND t.created_by=?', p.push(user_id);
  if (priority) q += ' AND t.priority=?',   p.push(priority);
  try {
    const [data] = await pool.query(q, p);
    res.json({ total: data.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateTicket = async (req, res) => {
  const { title, description, type_id, priority } = req.body;
  try {
    const [{ affectedRows }] = await pool.query(
      `UPDATE tickets SET title=COALESCE(?,title),description=COALESCE(?,description),type_id=COALESCE(?,type_id),priority=COALESCE(?,priority) WHERE id=?`,
      [title, description, type_id, priority, req.params.id]
    );
    affectedRows ? res.json({ message: 'Actualizado' }) : res.status(404).json({ error: 'No encontrado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateTicketStatus = async (req, res) => {
  const { status } = req.body, valid = ['open', 'in_progress', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: `Opciones: ${valid}` });
  try {
    const [{ affectedRows }] = await pool.query('UPDATE tickets SET status=? WHERE id=?', [status, req.params.id]);
    affectedRows ? res.json({ status }) : res.status(404).json({ error: 'No encontrado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const assignTicket = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });
  try {
    const [[u]] = await pool.query('SELECT rol FROM users WHERE id=?', [user_id]);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (u.rol !== 'dev') return res.status(400).json({ error: 'Debe ser dev' });
    await pool.query('INSERT IGNORE INTO tickets_devs (id_ticket,id_user) VALUES (?,?)', [req.params.id, user_id]);
    res.json({ message: 'Asignado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getTicketsByUser = async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT t.*,tp.type type_name FROM tickets t LEFT JOIN types tp ON t.type_id=tp.id WHERE t.created_by=?`,
      [req.params.user_id]
    );
    res.json({ total: data.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { createTicket, getTickets, getTicketById, filterTickets, updateTicket, updateTicketStatus, assignTicket, getTicketsByUser };