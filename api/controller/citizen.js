const mongoose = require('mongoose')
const Citizen = require('../models/citizen')

const bcrypt = require('bcrypt') // <-- for hashing passwords
const jwt = require('jsonwebtoken') // <-- library for json webtokens. 

exports.signup = (req, res, next) => {
    Citizen.find({email: req.body.email})
        .exec()
        .then(citizen => {
            if(citizen.length >= 1) return res.status(409).json({
                message: "mail exists already"
            })
            
            // New email, hash password and attempt to 
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) return res.status(500).json({error: err}) 
                
                const citizen = new Citizen({
                    _id: new mongoose.Types.ObjectId(),
                    birthdate: req.body.birthdate,
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    address: req.body.address,
                    password: hash
                })

                citizen.save()
                    .then(result => {
                        res.status(201).json({
                            message: 'citizen created',
                            id: citizen._id
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
    Citizen.findOne({email: req.body.email})
        .exec()
        .then(citizen => {         // <--- we only want 1 citizen per email, so should only see 1, hence citizen.
            if(!citizen) return res.status(401).json({message: "Authorization failed"})
            // make sure password matches the one in database (for associated email)
            bcrypt.compare(req.body.password, citizen.password, (err, result) => {
                if(err) return res.status(401).json({message: "Authorization failed"}) // comparison failed, not necessarily because of wrong password

                if(result) { // <--- Correct password. 
                    const token = jwt.sign({
                        email: citizen.email,
                        citizenId: citizen._id
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
    Citizen.deleteOne({_id: req.params.citizenId})
        .exec()
        .then(result => {
            res.status(200).json({message: "Citizen deleted"})
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
}