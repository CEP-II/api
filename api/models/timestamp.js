const mongoose = require('mongoose')

const timestampSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    positionID: {
        type: Number,
        require: true,
    },

    startTime: {
        type: Date,
        require: true
    },

    endTime: {
        type: Date,
        require: true
    },

    citizen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
        required: true
    }
})

module.exports = mongoose.model('Timestamp', timestampSchema)