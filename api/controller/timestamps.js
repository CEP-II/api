const mongoose = require('mongoose')

const Timestamp = require('../models/timestamp');
const Citizen = require('../models/citizen');



/**
 * @swagger
 * /timestamps:
 *   get:
 *     summary: Get all timestamps
 *     description: Retrieve a list of timestamps with pagination support. Accessible to both citizen and admin users.
 *     tags: [Timestamps]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items to retrieve per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved timestamps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalItems:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 itemsPerPage:
 *                   type: integer
 *                   example: 10
 *                 timestamps:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timestamp'
 *       500:
 *         description: Internal server error
 */
exports.get_all_timestamps = (req, res, next) => {
    const { page, limit } = req.query;
    let query = {};
  
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = { limit: parseInt(limit), skip };
    }
  
    Timestamp.find({}, null, query)
      .then(timestamps => {
        if (page && limit) {
          return Timestamp.countDocuments()
            .then(totalItems => {
              const response = {
                currentPage: parseInt(page),
                totalItems,
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                itemsPerPage: parseInt(limit),
                timestamps: timestamps
              };
              res.status(200).send(response);
            });
        } else {
          const response = {
            currentPage: 1,
            totalItems: timestamps.length,
            totalPages: 1,
            itemsPerPage: timestamps.length,
            timestamps: timestamps
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
 * /timestamps:
 *   post:
 *     summary: Create a new timestamp
 *     description: Creates a new timestamp and associates it with a citizen based on the provided deviceId.
 *     tags:
 *       - Timestamps
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: The start time of the timestamp
 *                 example: '2023-05-09T10:00:00Z'
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: The end time of the timestamp
 *                 example: '2023-05-09T12:00:00Z'
 *               deviceId:
 *                 type: string
 *                 description: The device ID associated with the citizen
 *                 example: 'device12345'
 *               positionId:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 4
 *                 description: The position ID associated with the timestamp
 *                 example: 2
 *     responses:
 *       201:
 *         description: Timestamp stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timestamp stored
 *                 createdTimestamp:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: '60e2b2a84d53a45e38b58b6c'
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       example: '2023-05-09T10:00:00Z'
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       example: '2023-05-09T12:00:00Z'
 *                     deviceId:
 *                       type: string
 *                       example: 'device12345'
 *                     positionId:
 *                       type: integer
 *                       example: 2
 *                     citizen:
 *                       type: string
 *                       example: '60e2b2a84d53a45e38b58b6c'
 *       500:
 *         description: Internal server error
 *       404:
 *         description: Device ID not found
 */
exports.create_timestamp = (req, res, next) => {
    // find citizen id from device id.
    Citizen.findOne({deviceId: req.body.deviceId})
        .exec()
        .then(citizen => {
            if(!citizen) return res.status(404).json({
                message: "device id not found",
            })
            
            const timestamp = new Timestamp({
                _id: new mongoose.Types.ObjectId(),
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                deviceId: req.body.deviceId,
                positionId:  req.body.positionId,
                citizen: citizen,
            })
            // Should check that the citizen id is valid (in DB)? Or is this waste of ressources
            timestamp.save()
                .then(result => {
                    res.status(201).json({
                        message: "Timestamp stored",
                        createdTimestamp: {
                            _id: result._id,
                            startTime: result.startTime,
                            endTime: result.endTime,
                            deviceId: result.deviceId,
                            positionId: result.positionId,
                            citizen: result.citizen,
                        },
                    })
                })
                .catch(err => {
                    console.log(err)
                    res.status(500).json({error: err})
                })
        })
}

/**
 * @swagger
 * /timestamps/{timestampId}:
 *   get:
 *     summary: Get a specific timestamp by its ID
 *     description: Retrieve a timestamp by its ID, including the citizen's information. Accessible to both citizen and admin users.
 *     tags:
 *       - Timestamps
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timestampId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the timestamp to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   $ref: '#/components/schemas/Timestamp'
 *       404:
 *         description: Timestamp not found
 *       500:
 *         description: Internal server error
 */
exports.get_timestamp = (req, res, next) => {
    Timestamp.findById(req.params.timestampId)
        .populate('citizen', '-__v') //  
        .exec()
        .then(timestamp => {
            if(!timestamp) { // <-- if timestamp is null. 
                res.status(404).json({message: "Timestamp not found"})
            }
            res.status(200).json({
                timestamp: timestamp
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
}



/**
 * @swagger
 * /timestamps/{timestampId}:
 *   delete:
 *     summary: Delete a timestamp by ID
 *     description: Deletes a single timestamp based on its ID. Only accessible to admin users.
 *     tags: 
 *       - Timestamps
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timestampId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the timestamp to delete
 *         example: '60e2b2a84d53a45e38b58b6c'
 *     responses:
 *       200:
 *         description: Timestamp deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'timestamp deleted'
 *       500:
 *         description: Internal server error
 */
exports.delete_timestamp = (req, res, next) => {
    Timestamp.deleteOne({_id: req.params.timestampId})
    .exec()
    .then(result => {
        res.status(200).json({
            message: "timestamp deleted",
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    })
}

/**
 * @swagger
 * /timestamps/by-citizen/{citizenId}:
 *   get:
 *     summary: Get timestamps by citizen ID
 *     description: Retrieves all timestamps associated with a given citizen ID. Accessible to both citizen and admin users.
 *     tags:
 *       - Timestamps
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the citizen to retrieve timestamps for
 *         example: '60e2b2a84d53a45e38b58b6c'
 *     responses:
 *       200:
 *         description: Successfully found timestamps related to the citizen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Succesfully found timestamps related to citizen!'
 *                 timestamps:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timestamp'
 *       404:
 *         description: No timestamps found for the provided citizen
 *       500:
 *         description: Internal server error
 */
exports.get_timestamps_by_citizenId = (req, res, next) => {
    Timestamp.find({citizen: req.params.citizenId})
        .populate('citizen', '-__v') // <-- populate product with all data but the "__v" field.
        .exec()
        .then(timestamps => {
            if(!timestamps || timestamps.length == 0) {
                res.status(404).json({message: "No timestamps found for the provided citizen"})
            }
            res.status(200).json({
                message: "Succesfully found timestamps related to citizen!", 
                timestamps: timestamps,
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
}
