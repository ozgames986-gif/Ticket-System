const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username y password son requeridos' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    if (user.failed_attempts >= 5)
      return res.status(401).json({ error: 'Usuario bloqueado por demasiados intentos fallidos' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await pool.query('UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?', [user.id]);
      return res.status(401).json({ error: 'Credenciales inválidas', failed_attempts: user.failed_attempts + 1 });
    }

    await pool.query('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login exitoso', token, rol: user.rol });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};
const profile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.last_name, u.username, u.email, u.rol, u.active, c.name AS career
       FROM users u LEFT JOIN careers c ON u.career_id = c.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detail: err.message });
  }
};

module.exports = { login, profile };
