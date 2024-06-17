const pool = require('../config/db');
import express from 'express';
const router = express.Router();
function to (promise) {
    return promise
      .then(data => {
        return [null, data];
      })
      .catch(err => [err]);
};
router.get('/users', async (req, res) => {
    try {
        const db = await pool.getConnection();
        console.log('here')
        const [err, result] = await (db.query('SELECT * FROM users;'));
        console.log(result);
        return res.json('Success');
    } catch (err) {
        console.log(err);
    }
});

router.get('/status', (req, res) => {
    res.send('Active here');
});

export default router;
