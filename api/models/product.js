const mongoose = require('mongoose')

// Layout of object
const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    
    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true // <-- price must be provided. 
    },

    image: {
        type: String,
    }
})

// Model is the object itself, constructor to build said objects based on schema.

module.exports = mongoose.model('Product', productSchema)

