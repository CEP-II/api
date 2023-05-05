const mongoose = require('mongoose')
const Admin = require('../models/admin')

const bcrypt = require('bcrypt') // <-- for hashing passwords
const jwt = require('jsonwebtoken') // <-- library for json webtokens. 

exports.signup = (req, res, next) => {
    Admin.find({username: req.body.username})
        .exec()
        .then(admin => {
            if(admin.length >= 1) return res.status(409).json({
                message: "username exists already"
            })
            
            // New username, hash password and attempt to 
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) return res.status(500).json({error: err}) 
                
                const admin = new Admin({
                    _id: new mongoose.Types.ObjectId(),
                    username: req.body.username,
                    password: hash
                })

                admin.save()
                    .then(result => {
                        res.status(201).json({
                            message: 'admin created',
                            id: admin._id
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
    Admin.findOne({username: req.body.username})
        .exec()
        .then(admin => {         // <--- we only want 1 admin per username, so should only see 1, hence admin.
            if(!admin) return res.status(401).json({message: "Authorization failed"})
            // make sure password matches the one in database (for associated username)
            bcrypt.compare(req.body.password, admin.password, (err, result) => {
                if(err) return res.status(401).json({message: "Authorization failed"}) // comparison failed, not necessarily because of wrong password

                if(result) { // <--- Correct password. 
                    const token = jwt.sign({
                        username: admin.username,
                        adminId: admin._id,
                        role: "admin"
                    }, 
                    process.env.JWT_KEY,
                    {
                        expiresIn: "1hr",
                    })
                    return res.status(200).json({message: "Authorization successful", token: token})
                }

                res.status(401).json({message: "Authorization failed"}) // <-- if we get here, password was incorrect. 

            })
            
        })
        .catch(err => {
            return res.status(500).json({error:err})
        })
}

exports.delete = (req, res, next) => {
    Admin.deleteOne({_id: req.params.adminId})
        .exec()
        .then(result => {
            res.status(200).json({message: "admin deleted"})
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
}

