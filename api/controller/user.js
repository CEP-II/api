const mongoose = require('mongoose')
const User = require('../models/user')

const bcrypt = require('bcrypt') // <-- for hashing passwords
const jwt = require('jsonwebtoken') // <-- library for json webtokens. 

exports.signup = (req, res, next) => {

    User.find({email: req.body.email})
        .exec()
        .then(user => {
            if(user.length >= 1) return res.status(409).json({
                message: "mail exists already"
            })
            
            // New email, hash password and attempt to 
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) return res.status(500).json({error: err}) 
                
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.email,
                    password: hash
                })

                user.save()
                    .then(result => {
                        res.status(201).json({
                            message: 'User created',
                            id: user._id
                        })
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(500).json({error: err})
                    })
            }) // salt: random strings added to the password -> less likely to find it in dictionary tables
        })
}

exports.login = (req, res, next) => {
    User.findOne({email: req.body.email})
        .exec()
        .then(user => {         // <--- we only want 1 user per email, so should only see 1, hence user.
            if(!user) return res.status(401).json({message: "Authorization failed"})
            // make sure password matches the one in database (for associated email)
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if(err) return res.status(401).json({message: "Authorization failed"}) // comparison failed, not necessarily because of wrong password

                if(result) { // <--- Correct password. 
                    const token = jwt.sign({
                        email: user.email,
                        userId: user._id
                    }, 
                    process.env.JWT_KEY,
                    {
                        expiresIn: "1hr",

                    })
                    return res.status(200).json({message: "Authorization successful", token: token})
                }

                res.status(200).json({message: "Authorization failed"}) // <-- if we get here, password was incorrect. 

            })
            
        })
        .catch(err => {
            return res.status(500).json({error:err})
        })
}

exports.delete = (req, res, next) => {
    User.deleteOne({_id: req.params.userId})
        .exec()
        .then(result => {
            res.status(200).json({message: "User deleted"})
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
}