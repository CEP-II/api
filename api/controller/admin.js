const mongoose = require('mongoose')
const Admin = require('../models/admin')

const bcrypt = require('bcrypt') // <-- for hashing passwords
const jwt = require('jsonwebtoken') // <-- library for json webtokens. 


/**
 * @swagger
 * /admin/signup:
 *   post:
 *     summary: Sign up a new admin
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Provide the admin details for sign up
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *             required:
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier for the created admin
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
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


/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Log in as an admin
 *     tags: [Admin]
 *     requestBody:
 *       description: Provide the admin username and password for login
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Authorization successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 token:
 *                   type: string
 *                   description: JWT token
 *       401:
 *         description: Authorization failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
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


/**
 * @swagger
 * /admin/{adminId}:
 *   delete:
 *     summary: Delete an admin account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the admin to be deleted
 *     responses:
 *       200:
 *         description: Admin account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
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

