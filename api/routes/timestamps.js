const express = require('express')
const router = express.Router()

const checkAuth = require('../middleware/checkAuth')
const TimestampController = require("../controller/timestamps")


router.get('/', checkAuth, TimestampController.get_all_timestamps)

router.post('/', TimestampController.create_timestamp)

router.get('/:timestampId', checkAuth, TimestampController.get_timestamp)

router.delete('/:timestampId', checkAuth, TimestampController.delete_timestamp)

module.exports = router
