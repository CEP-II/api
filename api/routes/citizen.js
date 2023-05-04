const express = require('express')
const router = express.Router()

const checkAuth = require('../middleware/checkAuth')

const CitizenController = require('../controller/citizen')

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post('/signup', CitizenController.signup)

router.post('/login', CitizenController.login)

router.delete('/:citizenId', checkAuth, CitizenController.delete) // any user logged in can currently delete any other user...

router.get('/', checkAuth, CitizenController.get_all_citizens)

router.get('/:citizenId', checkAuth, CitizenController.get_citizen)

module.exports = router