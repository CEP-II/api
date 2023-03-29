const mongoose = require('mongoose')

const Product = require('../models/product')


exports.get_products = (req, res, next) => {

    Product.find()
        .select("-__v")   // <--- fetch all fields but __v.
        .exec()
        .then(docs => {

            const response = {
                count: docs.length,
                products: docs.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
                        _id: doc._id,
                        image: doc.image,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/products/' + doc._id
                        }
                    }
                })
            }


            // if(docs.length >= 0) {
            res.status(200).json(response)
            // } 
            // else {           // <-- null. 
            //     res.status(404).json({
            //         message: "No entries found" 
            //     })
            // }
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({error: err})
        })
}


exports.create_product = (req, res, next) => {

    console.log(req.file)
    // instance of product model
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        image: req.file.path
    })

    product.save().then(result => {     // <--- save in database. 
        console.log(result);

        res.status(201).json({
            message: 'Created object succesfully',
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products' + result._id
                }
            }
        })
    }).catch(err => {
        console.log(err)
        res.status(500).json({error: err})
    }); 
}


exports.get_product = (req,res,next) => {
    const id = req.params.productId

    Product.findById(id)
    .select("-__v") // <-- all but the __v field. 
    .exec()     // <-- exec turns to promise. Promises run asynchronously. 
    .then(doc => {
        console.log(doc)
        if(doc) {  // <-- document is found in databse
            res.status(200).json({
                product: doc,
                request: {
                    type: 'GET',
                    description: 'Get all products',
                    url: 'http://localhost:3000/products'
                }
            })
        } else { // <-- document not found
            res.status(404).json({message: "No valid entry found from provided ID"})
        }
    })
    .catch(err => {
        console.log(err)
        res.status(500).json({error: err})
    })    
}


exports.patch_product = (req,res,next) => {
    const id = req.params.productId

    const updateOps = {} // instead of using: $set: {name: req.body.newName, price: req.body.newPrice} where we have to provide both
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    
    Product.updateOne({_id: id}, {$set: updateOps})
        .exec()
        .then(result => {
            console.log(result)
            res.status(200).json({
                message: "Product updated",
                request: {
                    type: "GET",
                    description: "Get updated object",
                    url: 'http://localhost:3000/products/' + id
                }
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({error: err})
        })            
}

exports.delete_product = (req,res,next) => {
    const id = req.params.productId
    
    Product.deleteOne({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Product deleted",
                request: {
                    description: "To insert a new product:", 
                    type: 'POST',
                    url: 'http://localhost:3000/products',
                    body: {name: 'String', price: 'Number'},
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        })   // remove any object that matches the critera (only 1 since id)
    
}