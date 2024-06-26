const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');
import serviceAccount from '../key.json';
import authenticateJWT from './middleware';
const pool = require('../config/db');
const auth = new GoogleAuth({
    keyFile: '../key.json',
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});
const fcmSendEndpoint =
    'https://fcm.googleapis.com/v1/projects/talk-around-town-423916/messages:send';
const router = express.Router();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the Earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

router.post('/addLocation', authenticateJWT, async (req, res) => {
    try {
        // Get user_id from req.user
        const user_id = req.user.id;

        // Extract location data from the request body
        const { latitude, longitude, type, name, description } = req.body;

        // Validate the input data
        if (!latitude || !longitude || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Insert the new location into the database
        const [result] = await pool.query(
            'INSERT INTO locations (user_id, lat, `long`, type, name, `desc`) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, latitude, longitude, type, name, description],
        );

        // Check if the insertion was successful
        if (result.affectedRows === 1) {
            return res
                .status(201)
                .json({ message: 'Location added successfully' });
        } else {
            return res.status(500).json({ error: 'Failed to add location' });
        }
    } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/tips', authenticateJWT, async (req, res) => {
    // get tips from db
    // first get userid from req.user
    // get type from req.body
    // then get tips from db
    // return tips
    // const user_id = req.user.id;
    try {
        const { type } = req.body;
        // const db = await pool.getConnection();
        const [rows] = await pool.query('SELECT * FROM tips WHERE type = ?', [
            type,
        ]);
        // db.release();
        // select 3 random tips
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
        console.log('error in fetcing tips', e);
        return res.status(500).json({ message: 'No tips found' });
    }
});

router.post('/locations', authenticateJWT, async (req, res) => {
    // get location from db
    // first get userid from req.user
    // then get location from db
    // return location
    const user_id = req.user.id;
    // const db = await pool.getConnection();
    const [rows] = await pool.query(
        'SELECT * FROM locations WHERE user_id = ?',
        [user_id],
    );
    // db.release();
    const locations = rows.map(row => ({
        latitude: parseFloat(row.lat),
        longitude: parseFloat(row.long),
        latitudeDelta: 0.015, // Assuming a default value
        longitudeDelta: 0.0121, // Assuming a default value
    }));

    const colors = ['red', 'green', 'blue'];

    const getRandomColor = () => {
        const randomIndex = Math.floor(Math.random() * colors.length);
        return colors[randomIndex];
    };

    const details = rows.map(row => ({
        title: row.name,
        description: row.desc,
        pinColor: getRandomColor(),
    }));

    // Send the transformed data as a JSON response
    return res.status(200).json({ locations, details });
    // return res.json(rows);
});

router.post('/', authenticateJWT, async (req, res) => {
    // return res.send('Not in range of any point');
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    // const db = await pool.getConnection();
    let user_id = req.user.id;
    const { latitude, longitude } = req.body;
    const [rows] = await pool.query(
        'SELECT * FROM locations WHERE user_id = ?;',
        [user_id],
    );

    const locations = rows.map(row => ({
        id: row.id,
        latitude: parseFloat(row.lat),
        longitude: parseFloat(row.long),
        latitudeDelta: 0.015, // Assuming a default value
        longitudeDelta: 0.0121, // Assuming a default value
        name: row.name,
        type: row.type,
    }));
    // const { latitude, longitude } = req.body;
    let flag = false;
    let found_id = -1;
    let name = 'random';
    let type = 'random';
    locations.forEach(location => {
        const distance = getDistanceFromLatLonInKm(
            latitude,
            longitude,
            location.latitude,
            location.longitude,
        );
        if (distance < 0.1) {
            console.log('location found!');
            flag = true;
            found_id = location.id;
            name = location.name;
            type = location.type;
        }
    });
    if (!flag) {
        return res.send('Not in range of any point');
    }
    const [notifs] = await pool.query(
        `
    SELECT COUNT(*) AS notification_count
  FROM notifications
  WHERE user_id = ? AND loc_id = ?
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL 1 DAY
  AND timestamp < CURRENT_TIMESTAMP;
  `,
        [user_id, found_id],
    );
    // console.log(notifs);
    if (notifs[0].notification_count > 0) {
        // db.release();
        console.log('Already sent a notification for this location today.');
        return res.status(200).send('Already sent');
    }
    // get android token from users table
    const [result] = await pool.query(
        'SELECT android_token FROM users WHERE id = ?',
        [user_id],
    );
    console.log('trying to send message...');
    const androidToken = result[0].android_token;
    const messagePayload = {
        message: {
            token: androidToken,
            notification: {
                title: `You have arrived at ${name}`,
                body: `${type}: Click here for some tips to make the most of your visit.`,
            },
        },
    };
    axios
        .post(fcmSendEndpoint, messagePayload, {
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
        })
        .then(async response => {
            console.log('Message sent successfully:', response.data);
            // Update the count in the database
            const [result] = await pool.query(
                `INSERT INTO notifications (user_id, loc_id, device_id)
    VALUES (?, ?, ?);`,
                [user_id, found_id, androidToken],
            );
            console.log('Notification inserted successfully:');
        })
        .catch(error => {
            console.error('Error sending message:', error.response.data);
        });
    return res.status(200).send("Send notification, let's see if it works");
});

module.exports = router;
