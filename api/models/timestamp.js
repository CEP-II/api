const mongoose = require('mongoose')

const timestampSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    positionID: {
        type: Number,
        require: true,
        min: 0,
        max: 4,
    },

    startTime: {
        type: Date,
        require: true,
        // add validator logic here? https://stackoverflow.com/questions/66927667/mongoose-schema-set-min-and-max-dates 
    },

    endTime: {
        type: Date,
        require: true
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

module.exports = mongoose.model('Timestamp', timestampSchema)