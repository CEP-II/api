const express = require('express')
const router = express.Router()

const accidentController = require('../controller/accident')

router.post('/', accidentController.report_accident)

module.exports = router