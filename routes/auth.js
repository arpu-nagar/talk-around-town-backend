const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authenticateJWT = require('./middleware');
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // const db = await pool.getConnection();
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    
    return res.status(200).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.log('error in registering user', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // const db = await pool.getConnection();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    // db.release();
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '12h' });
    return res.status(200).json({ access_token: token, user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


const logout = (req, res) => {
  // Assuming you are using JWT stored in cookies
  // figure this out
// verify jwt token in authorization header
const token = req.headers.authorization;
if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
}
try {
    const [bearer, jwtToken] = token.split(' ');
    if (bearer !== 'Bearer' || !jwtToken) {
        return res.status(401).json({ message: 'Invalid authorization token' });
    }
    const decoded = jwt.verify(jwtToken, 'your_jwt_secret');
    // continue with your logic here
    console.log(decoded);
    return res.send('Logged out');
} catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
}
    // if valid, clear cookie
    // if not valid, return 401
    //

};
// route that verifies jwt token in authorization header

const authenticateJWTReval = async (req, res) => {
  const authHeader = req.body.headers.authorization;
  console.log('req', req.body.headers)
  // console.log('req.headers', req.headers)
  console.log('authHeader', authHeader)
  if (!authHeader) {
    console.log('Authorization header missing');
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const [bearer, jwtToken] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !jwtToken) {
    console.log('Invalid authorization token');
    return res.status(401).json({ message: 'Invalid authorization token' });
  }

  try {
    console.log('still logged in')
    const decoded = jwt.verify(jwtToken, 'your_jwt_secret');
    return res.status(200).json({user: decoded}) // Attach the decoded token to the request object
    // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const token = async (req, res) => {
  let user_id = req.user.id;
  let {token} = req.body;
  // insert token into users table where user_id = user_id
  try {
    // const db = await pool.getConnection();
    const [result] = await pool.query('UPDATE users SET android_token = ? WHERE id = ?', [token, user_id]);
    // db.release();
    res.status(200).json({ message: 'Token updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// module.exports = { register, login, logout };
const express = require('express');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify', authenticateJWTReval);
router.post('/token', authenticateJWT,token);
module.exports = router;