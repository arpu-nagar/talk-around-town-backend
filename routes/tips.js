const pool = require('../config/db');
import express from 'express';
const router = express.Router();
import fs from 'fs/promises';
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        throw error;
    }
}

// Function to insert data into MySQL
async function insertDataIntoMySQL(data) {
    //   const connection = await mysql.createConnection(dbConfig);

    try {
        for (const item of data) {
            for (const tip of item.tips) {
                await pool.query(
                    'INSERT INTO tips (type, title, description) VALUES (?, ?, ?)',
                    [item.locationName, item.title, tip],
                );
            }
            console.log('cool down')
            // insert a cool down of 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    } finally {
        // await connection.end();
        console.log('Data inserted successfully');
    }
}

// API endpoint to trigger the data insertion
router.post('/insert-data', async (req, res) => {
    try {
        const jsonData = await readJsonFile('./tips.json');
        await insertDataIntoMySQL(jsonData);
        res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while inserting data',
        });
    }
});

router.post('/get-tips', async (req, res) => {
    try {
        const { type } = req.body;
        const [rows] = await pool.query('SELECT * FROM tips WHERE type = ?', [
            type,
        ]);
        const tips = [];
        const randomIndices = [];
        while (randomIndices.length < 3) {
            const randomIndex = Math.floor(Math.random() * rows.length);
            if (!randomIndices.includes(randomIndex)) {
                randomIndices.push(randomIndex);
                tips.push(rows[randomIndex]);
            }
        }
        return res.status(200).json(tips);
    } catch (e) {
        console.log('error in fetching tips', e);
        return res.status(500).json({ message: 'No tips found' });
    }
});

export default router;
