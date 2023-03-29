const mongoose = require('mongoose')

// Layout of object
const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    
    // which products were in order
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // <--- Product schema/type
        required: true
    },

    quantity: {
        type: Number,
        default: 1
    }
})

// Model is the object itself, constructor to build said objects based on schema.

module.exports = mongoose.model('Order', orderSchema)

