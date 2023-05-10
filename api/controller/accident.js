const mongoose = require('mongoose')

const Accident = require('../models/accident')
const Citizen = require('../models/citizen')

// SMS STUFF
const twilio = require('twilio')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const numberFrom = process.env.TWILIO_PHONE_NUMBER;
const numberTo = process.env.TWILIO_NUMBER_TO_SEND_TO;

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

            const client = new twilio(accountSid, authToken)

            // Send SMS using Twilio, this should send an sms
            client.messages.create({
                body: `Accident reported by citizen ${citizen._id}. Device ID: ${accident.deviceId}, Position ID: ${accident.positionId}, Alarm Time: ${accident.alarmTime}`,
                to: numberTo,
                from: numberFrom, // Your Twilio phone number
            })
            .then(message => console.log(message.sid));

            // Should check that the citizen id is valid (in DB)? Or is this waste of ressources
            accident.save()
                .then(result => {
                    res.status(201).json({
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
                    res.status(500).json({error: err})
                })
        })
}

