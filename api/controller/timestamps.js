const mongoose = require('mongoose')

const Timestamp = require('../models/timestamp')

exports.get_all_timestamps = (req, res, next) => {
    Timestamp.find()
        .select("-__v")
        .populate('citizen') // <-- get all the information related to citizen. Can pass 2nd parameter to select only specific fields. TODO sort this by name or something
        .exec()
        .then(docs => {
            res.status(200).json({
                count: docs.length,
                timestamps: docs.map(doc => {
                    return {
                        _id: doc._id,
                        start: doc.startTime,
                        end: doc.endTime,
                        citizen: doc.citizen,
                    }
                }),
            })
        })
        .catch(err => {
            res.status(500).json({error:err})
        })
}

exports.create_timestamp = (req, res, next) => {

    const timestamp = new Timestamp({
        _id: new mongoose.Types.ObjectId(),
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        citizen: req.body.citizen
    })

    timestamp.save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: "Timestamp stored",
                createdTimestamp: {
                    _id: result._id,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    citizen: result.citizen
                },
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({error: err})
        })
}

exports.get_timestamp = (req, res, next) => {
    Timestamp.findById(req.params.timestampId)
        .populate('citizen', '-__v') // <-- populate product with all data but the "__v" field. 
        .exec()
        .then(timestamp => {
            if(!timestamp) { // <-- if timestamp is null. 
                return res.status(404).json({message: "Timestamp not found"})
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