const mongoose = require('mongoose')

const citizenSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    birthdate: {        // <-- better than to store age, which changes over time. Have to compute age from this tho. 
        type: Date,
        required: true
        // add validator logic here for minimum? https://stackoverflow.com/questions/66927667/mongoose-schema-set-min-and-max-dates
    },

    name: {
        type: String,
        required: true
    },

    deviceId: {
        type: String,
        required: true,
        unique: true,
    },

    address: {
        type: { // add country field if we want non-Denmark addresses (would also have to change regular expressions)
            postal: Number,
            street: String,
            city: String,
            // etc... Do we need both city and postal?
        },
        required: true,
    },

    phone: {    // might not have phone, not required
        type: Number, 
        unique: true,
        match: /^(\+45|0045|\(45\))?\s?[2-9](\s?\d){7}$/ // regular expressions for danish phone nubmers. Change if we allow non-danish citizens 
    },


    email: {
        type: String,
        unique: true,
        required: true,
        match: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        // above regular expression is an email filter. Checks that string looks like an email. 
    },

    password: {
        type: String,
        required: true,
        // validater logic
    }
})

module.exports = mongoose.model('Citizen', citizenSchema)