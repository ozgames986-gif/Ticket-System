const pool = require('../config/db');

// GET /careers
const getCareers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM careers');
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /careers/filter
const filterCareers = async (req, res) => {
  const { name, active } = req.query;
  let query = 'SELECT * FROM careers WHERE 1=1';
  const params = [];
  if (name)   { query += ' AND name LIKE ?';  params.push(`%${name}%`); }
  if (active !== undefined) { query += ' AND active = ?'; params.push(active === 'true'); }
  try {
    const [rows] = await pool.query(query, params);
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { getCareers, filterCareers };
