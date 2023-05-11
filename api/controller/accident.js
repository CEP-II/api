const mongoose = require('mongoose')

const Accident = require('../models/accident')
const Citizen = require('../models/citizen')

// SMS STUFF
const twilio = require('twilio')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const numberFrom = process.env.TWILIO_PHONE_NUMBER;
const numberTo = process.env.TWILIO_NUMBER_TO_SEND_TO;

function sendAccidentSMS(accidentJSON, twilioAccountSid, twilioAuthToken, numberFrom, numberTo) {

    // This function should rarely be called, so we create a new client each time to keep the function pure.
    const client = new twilio(twilioAccountSid, twilioAuthToken) 

    // Validate JSON object
    if (!accidentJSON 
        || !accidentJSON.citizen || !accidentJSON.citizen._id 
        || !accidentJSON.deviceId 
        || !accidentJSON.positionId 
        || !accidentJSON.alarmTime) {
        console.error('Invalid accidentJSON object');
        return;
    }

    // Send SMS using Twilio, this should send an sms
    client.messages.create({
        body: `Accident reported by citizen ${accidentJSON.citizen._id}. Device ID: ${accidentJSON.deviceId}, Position ID: ${accidentJSON.positionId}, Alarm Time: ${accidentJSON.alarmTime}`,
        to: numberTo,
        from: numberFrom, // Your Twilio phone number
    })
    .then(message => console.log(message.sid))
    .catch(err => console.error(err))
}

/**
 * @swagger
 * /accident:
 *   post:
 *     summary: Report an accident.
 *     description: This endpoint allows for reporting of accidents. It receives a device id and finds the associated citizen. An accident record is created and an SMS is sent. 
 *     tags: [Accidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: The device id of the citizen reporting the accident.
 *               positionId:
 *                 type: integer
 *                 description: The position id at the time of the accident.
 *               alarmTime:
 *                 type: string
 *                 format: date-time
 *                 description: The time when the accident alarm was triggered.
 *             required:
 *               - deviceId
 *               - positionId
 *               - alarmTime
 *     responses:
 *       201:
 *         description: Accident successfully reported and stored.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Accident'
 *       404:
 *         description: The specified device id does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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

exports.report_accident = (req, res, next) => {
    // find citizen id from device id.
    Citizen.findOne({deviceId: req.body.deviceId})
        .exec()
        .then(citizen => {
            if(!citizen) return res.status(404).json({
                message: "device id not found",
            })
            
            const accident = new Accident({
                _id: new mongoose.Types.ObjectId(),
                deviceId: req.body.deviceId,
                citizen: citizen,
                positionId:  req.body.positionId,
                alarmTime: req.body.alarmTime,
            })


        // const client = new twilio(accountSid, authToken)

        // Send SMS using Twilio, this should send an sms
        // client.messages.create({
        //     body: `Accident reported by citizen ${citizen._id}. Device ID: ${accident.deviceId}, Position ID: ${accident.positionId}, Alarm Time: ${accident.alarmTime}`,
        //     to: numberTo,
        //     from: numberFrom, // Your Twilio phone number
        // })
        // .then(message => console.log(message.sid));
        sendAccidentSMS(accident, accountSid, authToken, numberFrom, numberTo)

        accident.save()
            .then(result => {
                return res.status(201).json({
                    message: "Accident stored",
                    createdAccident: {
                        _id: result._id,
                        deviceId: result.deviceId,
                        positionId: result.positionId,
                        citizen: result.citizen,
                        alarmTime: result.alarmTime,
                    },
                })
            })
            .catch(err => {
                console.log(err)
                return res.status(500).json({error: err})
            })
    })
}

/**
 * @swagger
 * /accidents:
 *   get:
 *     summary: Get all accidents
 *     description: Retrieve a list of accidents with pagination support. Only accessible by admin users.
 *     tags: [Accidents]
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
 *         description: Successfully retrieved accidents
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
 *                 accidents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Accident'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
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
exports.get_all_accidents = (req, res, next) => {
    const { page, limit } = req.query;
    let query = {};
  
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = { limit: parseInt(limit), skip };
    }

  
    Accident.find({}, null, query)
      .then(accidents => {
        if (page && limit) {
          return Accident.countDocuments()
            .then(totalItems => {
              const response = {
                currentPage: parseInt(page),
                totalItems,
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                itemsPerPage: parseInt(limit),
                accidents: accidents
              };
              return res.status(200).send(response);
            });
        } else {
          const response = {
            currentPage: 1,
            totalItems: accidents.length,
            totalPages: 1,
            itemsPerPage: accidents.length,
            accidents: accidents
          };
          return res.status(200).send(response);
        }
      })
      .catch(error => {
        console.log(error)
        return res.status(500).send(error);
      });
  };


/**
 * @swagger
 * /accidents/{accidentId}:
 *   delete:
 *     summary: Delete an accident by its ID
 *     description: Deletes the accident with the specified ID. Only accessible by admin users.
 *     tags: [Accidents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accidentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the accident to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the accident
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Accident deleted"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
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
  exports.delete_accident_by_id = (req, res, next) => {
        Accident.deleteOne({_id: req.params.accidentId})
        .exec()
        .then(result => {
            return res.status(200).json({message: "Accident deleted"})
        })
        .catch(err => {
            return res.status(500).json({error: err})
        }) 
  }