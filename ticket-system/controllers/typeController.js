const pool = require('../config/db');

// GET /types
const getTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM types');
    res.json({ total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /types/:id
const getTypeById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM types WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// POST /types
const createType = async (req, res) => {
  const { type, description, area } = req.body;
  if (!type) return res.status(400).json({ error: 'El campo type es requerido' });
  try {
    const [result] = await pool.query(
      'INSERT INTO types (type, description, area) VALUES (?, ?, ?)',
      [type, description || null, area || null]
    );
    res.status(201).json({ message: 'Tipo creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// PUT /types/:id
const updateType = async (req, res) => {
  const { type, description, area } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE types SET type = COALESCE(?, type), description = COALESCE(?, description), area = COALESCE(?, area) WHERE id = ?',
      [type || null, description || null, area || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json({ message: 'Tipo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// DELETE /types/:id
const deleteType = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM types WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json({ message: 'Tipo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { getTypes, getTypeById, createType, updateType, deleteType };
