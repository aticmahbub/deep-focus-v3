// models/index.js — All Mongoose schemas for DeepFocus
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    deviceId: {type: String, required: true, unique: true, index: true},
    pomCount: {type: Number, default: 0},
    theme: {type: String, default: 'eink'},
    updatedAt: {type: Date, default: Date.now},
});

const todoSchema = new mongoose.Schema({
    deviceId: {type: String, required: true, index: true},
    text: {type: String, required: true, trim: true},
    done: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
});

const nnSchema = new mongoose.Schema({
    deviceId: {type: String, required: true, index: true},
    text: {type: String, required: true, trim: true},
    done: {type: Boolean, default: false},
    lastDoneDate: {type: String, default: null},
    streak: {type: Number, default: 0},
    order: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now},
});

const routineEntrySchema = new mongoose.Schema({
    batch: {type: String, enum: ['preli', 'written'], required: true},
    date: {type: String, required: true},
    subject: {type: String, default: ''},
    topic: {type: String, default: ''},
    classTime: {type: String, default: ''},
    examTopic: {type: String, default: ''},
    entryType: {
        type: String,
        enum: ['class', 'exam', 'special', 'holiday', 'self-study'],
        default: 'class',
    },
    specialLabel: {type: String, default: ''},
    colorTag: {type: String, default: ''},
});

routineEntrySchema.index({batch: 1, date: 1});

// Prevent model re-registration in Vercel serverless environment
const Session =
    mongoose.models.Session || mongoose.model('Session', sessionSchema);
const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);
const NN = mongoose.models.NN || mongoose.model('NN', nnSchema);
const RoutineEntry =
    mongoose.models.RoutineEntry ||
    mongoose.model('RoutineEntry', routineEntrySchema);

module.exports = {Session, Todo, NN, RoutineEntry};
