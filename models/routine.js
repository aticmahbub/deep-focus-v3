const mongoose = require('mongoose');

const routineEntrySchema = new mongoose.Schema({
    batch: {type: String, enum: ['preli', 'written'], required: true},
    date: {type: String, required: true}, // 'YYYY-MM-DD'
    subject: {type: String, default: ''},
    topic: {type: String, default: ''},
    classTime: {type: String, default: ''}, // e.g. '9:00 PM'
    examTopic: {type: String, default: ''}, // column D for preli
    entryType: {
        type: String,
        enum: ['class', 'exam', 'special', 'holiday', 'self-study'],
        default: 'class',
    },
    // special labels like 'Weekly Mega Exam', 'Mental Ability Final Exam', etc.
    specialLabel: {type: String, default: ''},
    colorTag: {type: String, default: ''}, // 'teal', 'yellow', 'green', 'red'
});

routineEntrySchema.index({batch: 1, date: 1});

module.exports = mongoose.model('RoutineEntry', routineEntrySchema);
