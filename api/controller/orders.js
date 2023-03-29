const mongoose = require('mongoose')

const Order = require('../models/order')
const Product = require('../models/product')

exports.get_all = (req, res, next) => {
    Order.find()
        .select("-__v")
        .populate('product') // <-- get all the information related to product. Can pass 2nd parameter to select only specific fields. 
        .exec()
        .then(docs => {
            res.status(200).json({
                count: docs.length,
                orders: docs.map(doc => {
                    return {
                        _id: doc._id,
                        product: doc.product,
                        quantity: doc.quantity,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/orders/' + doc._id
                        }
                    }
                }),
            })
        })
        .catch(err => {
            res.status(500).json({error:err})
        })
}

exports.create_order = (req, res, next) => {

    Product.findById(req.body.productId)        // <-- make sure product exists 
        .then(product => {
            if(!product) {
                res.status(404).json({message: "Product not found"})
            } 
            const order = new Order({
                _id: new mongoose.Types.ObjectId(),
                quantity: req.body.quantity,
                product: req.body.productId // <-- expect to get this
            })
            return order.save()        // <-- save gives a real promise, no need to exec().  
        })
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: "Order stored",
                createdOrder: {
                    _id: result._id,
                    product: result.product,
                    quantity: result.quantity
                },
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/orders' + result._id
                }
            })
        })
        .catch(err => {
            res.status(500).json({
                message: "Product not found",
                error: err
            })
        })
}

exports.get_order = (req, res, next) => {
    Order.findById(req.params.orderId)
        .populate('product', '-__v') // <-- populate product with all data but the "__v" field. 
        .exec()
        .then(order => {
            if(!order) { // <-- if order is null. 
                return res.status(404).json({message: "Order not found"})
            }
            res.status(200).json({
                order: order,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/orders'
                }
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
}


exports.delete_order = (req, res, next) => {
    Order.deleteOne({_id: req.params.orderId})
    .exec()
    .then(result => {
        res.status(200).json({
            message: "order deleted",
            request: {
                type: 'POST',
                url: 'http://localhost:3000/orders',
                body: {productId: 'ID', quantity: 'Number'}
            }
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    })
}