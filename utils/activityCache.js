import pool from '../config/db.js';

let cache = [];
let cachedAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

export async function getApprovedActivities() {
    if (Date.now() - cachedAt < TTL) return cache;
    const [rows] = await pool.query('SELECT name FROM pending_activities WHERE status = ?', ['approved']);
    cache = rows.map(r => r.name);
    cachedAt = Date.now();
    return cache;
}

export function bustApprovedActivitiesCache() {
    cachedAt = 0;
}
