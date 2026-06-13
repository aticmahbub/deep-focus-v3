const express = require('express');
const router = express.Router();
const {RoutineEntry} = require('../models');

// DEBUG — get all entries (limited to 10)
router.get('/debug', async (req, res) => {
    try {
        const total = await RoutineEntry.countDocuments({});
        const sample = await RoutineEntry.find({}).limit(5).sort({date: 1});
        res.json({total, sample});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// GET /api/routine/:batch/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/:batch/range', async (req, res) => {
    try {
        const {batch} = req.params;
        const {from, to} = req.query;
        if (!from || !to)
            return res.status(400).json({error: 'from and to dates required'});

        const entries = await RoutineEntry.find({
            batch,
            date: {$gte: from, $lte: to},
        }).sort({date: 1});

        res.json(entries);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// GET /api/routine/:batch/window
router.get('/:batch/window', async (req, res) => {
    try {
        const {batch} = req.params;
        const todayStr =
            req.query.date || new Date().toISOString().slice(0, 10);

        const d = new Date(todayStr + 'T00:00:00Z');
        const prev = new Date(d);
        prev.setUTCDate(prev.getUTCDate() - 1);
        const next2 = new Date(d);
        next2.setUTCDate(next2.getUTCDate() + 2);

        const fmt = (dt) => dt.toISOString().slice(0, 10);
        const fromDate = fmt(prev);
        const toDate = fmt(next2);

        const entries = await RoutineEntry.find({
            batch,
            date: {$gte: fromDate, $lte: toDate},
        }).sort({date: 1});

        res.json({today: todayStr, fromDate, toDate, entries});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// POST /api/routine/seed
router.post('/seed', async (req, res) => {
    try {
        const {entries, batch} = req.body;
        if (!entries || !batch)
            return res.status(400).json({error: 'entries and batch required'});

        await RoutineEntry.deleteMany({batch});
        const docs = entries.map((e) => ({...e, batch}));
        await RoutineEntry.insertMany(docs);
        res.json({ok: true, inserted: docs.length});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
