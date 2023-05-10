const mongoose = require('mongoose')

const Timestamp = require('../models/timestamp');
const Citizen = require('../models/citizen');

/**
 * @swagger
 * /timestamps:
 *   get:
 *     summary: Get all timestamps
 *     description: Retrieve a list of all timestamps with optional pagination
 *     tags:
 *       - Timestamps
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of items to return per page
 *     responses:
 *       200:
 *         description: A list of timestamps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 itemsPerPage:
 *                   type: integer
 *                 timestamps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       citizen:
 *                         type: string
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
