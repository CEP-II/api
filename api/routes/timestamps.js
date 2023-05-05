const express = require('express')
const router = express.Router()

const TimestampController = require("../controller/timestamps")

const authorizeRoles = require('../middleware/authorizeRoles')


router.get('/', authorizeRoles(['user', 'admin']), TimestampController.get_all_timestamps)

router.post('/', TimestampController.create_timestamp)

router.get('/:timestampId', authorizeRoles(['user', 'admin']), TimestampController.get_timestamp)

router.delete('/:timestampId', authorizeRoles(['admin']), TimestampController.delete_timestamp)

module.exports = router
