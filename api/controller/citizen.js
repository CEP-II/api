const mongoose = require('mongoose')
const Citizen = require('../models/citizen')

const bcrypt = require('bcrypt') // <-- for hashing passwords
const jwt = require('jsonwebtoken') // <-- library for json webtokens. 


/**
 * @swagger
 * /citizen/signup:
 *   post:
 *     summary: Sign up a new citizen
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Citizen'
 *     responses:
 *       201:
 *         description: Citizen account created successfully
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
 *                   description: ID of the created citizen
 *                 citizen:
 *                   $ref: '#/components/schemas/Citizen'
 *       409:
 *         description: Unique data already in use
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
    Citizen.find({
        $or: [{ email: req.body.email }, { phone: req.body.phone }, {deviceId: req.body.deviceId}],
        })
        .exec()
        .then(citizen => {
            if(citizen.length >= 1) return res.status(409).json({
                message: "Unique data already in use."
            })
            
            // New email, hash password and attempt to 
            bcrypt.hash(req.body.password,  10, (err, hash) => {
                if(err) return res.status(500).json({error: err}) 
                
                const citizen = new Citizen({
                    _id: new mongoose.Types.ObjectId(),
                    deviceId: req.body.deviceId,
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
                            id: citizen._id,
                            citizen: citizen
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
 * /citizen/login:
 *   post:
 *     summary: Log in a citizen
 *     tags: [Citizen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the citizen
 *               password:
 *                 type: string
 *                 description: Password of the citizen
 *             required:
 *               - email
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
                        citizenId: citizen._id,
                        role: "citizen"
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


/**
 * @swagger
 * /citizen/{citizenId}:
 *   delete:
 *     summary: Delete a citizen
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique identifier for the citizen
 *     responses:
 *       200:
 *         description: Citizen deleted successfully
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
    Citizen.deleteOne({_id: req.params.citizenId})
        .exec()
        .then(result => {
            res.status(200).json({message: "Citizen deleted"})
        })
        .catch(err => {
            res.status(500).json({error: err})
        })
}

/**
 * @swagger
 * /citizen:
 *   get:
 *     summary: Get all citizens
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page for pagination (optional)
 *     responses:
 *       200:
 *         description: A list of citizens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                 totalItems:
 *                   type: integer
 *                   description: Total number of citizens
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 itemsPerPage:
 *                   type: integer
 *                   description: Number of items per page
 *                 citizens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Citizen'
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
exports.get_all_citizens = (req, res, next) => {
    const { page, limit } = req.query;
    let query = {};
  
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = { limit: parseInt(limit), skip };
    }
  
    Citizen.find({}, null, query)
      .then(citizens => {
        if (page && limit) {
          return Citizen.countDocuments()
            .then(totalItems => {
              const response = {
                currentPage: parseInt(page),
                totalItems,
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                itemsPerPage: parseInt(limit),
                citizens: citizens
              };
              res.status(200).send(response);
            });
        } else {
          const response = {
            currentPage: 1,
            totalItems: citizens.length,
            totalPages: 1,
            itemsPerPage: citizens.length,
            citizens: citizens
          };
          res.status(200).send(response);
        }
      })
      .catch(error => {
        res.status(500).send(error);
      });
  };

  /**
 * @swagger
 * /citizen/{citizenId}:
 *   get:
 *     summary: Get citizen by ID
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the citizen to retrieve
 *     responses:
 *       200:
 *         description: Citizen details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 citizen:
 *                   $ref: '#/components/schemas/Citizen'
 *       404:
 *         description: Citizen not found
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
  exports.get_citizen = (req, res, next) => {
    Citizen.findById(req.params.citizenId)
        .exec()
        .then(citizen => {
            if(!citizen) { // <-- if citizen is null. 
                return res.status(404).json({message: "Citizen not found"})
            }
            res.status(200).json({
                citizen: citizen
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
}

