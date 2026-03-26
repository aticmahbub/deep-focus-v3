const express = require('express');
const router = express.Router();
const {NN} = require('../models');

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

router.get('/:deviceId', async (req, res) => {
    try {
        const today = todayStr();
        await NN.updateMany(
            {
                deviceId: req.params.deviceId,
                done: true,
                lastDoneDate: {$ne: today},
            },
            {$set: {done: false}},
        );
        const items = await NN.find({deviceId: req.params.deviceId}).sort({
            order: 1,
            createdAt: 1,
        });
        res.json({items, today});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

router.post('/:deviceId', async (req, res) => {
    try {
        const {text} = req.body;
        if (!text?.trim())
            return res.status(400).json({error: 'text is required'});
        const count = await NN.countDocuments({deviceId: req.params.deviceId});
        const item = await NN.create({
            deviceId: req.params.deviceId,
            text: text.trim(),
            order: count,
        });
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

router.patch('/:id/toggle', async (req, res) => {
    try {
        const today = todayStr();
        const item = await NN.findById(req.params.id);
        if (!item) return res.status(404).json({error: 'Not found'});
        item.done = !item.done;
        item.lastDoneDate = item.done ? today : null;
        await item.save();
        const total = await NN.countDocuments({deviceId: item.deviceId});
        const doneCount = await NN.countDocuments({
            deviceId: item.deviceId,
            done: true,
        });
        res.json({item, allDone: total > 0 && doneCount === total});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await NN.findByIdAndDelete(req.params.id);
        res.json({ok: true});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
