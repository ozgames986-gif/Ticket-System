const pool = require('../config/db');

// GET /kpi/tickets/status
const ticketsByStatus = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) AS total FROM tickets GROUP BY status'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /kpi/tickets/user
const ticketsByUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.username, u.name, u.last_name, COUNT(t.id) AS total_tickets
       FROM users u LEFT JOIN tickets t ON u.id = t.created_by
       GROUP BY u.id ORDER BY total_tickets DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

// GET /kpi/tickets/avg-time
const avgResolutionTime = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, NOW())), 2) AS avg_hours_open,
        COUNT(*) AS total
       FROM tickets WHERE status = 'closed'`
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { ticketsByStatus, ticketsByUser, avgResolutionTime };
