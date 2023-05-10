const mongoose = require('mongoose')

const Accident = require('../models/accident')
const Citizen = require('../models/citizen')

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

