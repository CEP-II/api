const mongoose = require('mongoose')

const accidentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    alarmTime: {
        type: Date,
        require: true,

    },

    positionId: {
        type: Number,
        require: true,
        min: 0,
        max: 4,
        required: true,
    },

    deviceId: {
        type: String,
        required: true
    },
    
    citizen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
        required: true,
    }
})

module.exports = mongoose.model('Accident', accidentSchema)