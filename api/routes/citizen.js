const express = require('express')
const router = express.Router()

const checkAuth = require('../middleware/checkAuth')


// const checkAuth = require('../middleware/checkAuth')


const citizenController = require('../controller/citizen')

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post('/signup', citizenController.signup)

router.post('/login', citizenController.login)

router.delete('/:citizenId', checkAuth, citizenController.delete) // any user logged in can currently delete any other user...

module.exports = router