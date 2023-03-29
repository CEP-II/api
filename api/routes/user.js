const express = require('express')
const router = express.Router()


const checkAuth = require('../middleware/checkAuth')

const UserController = require('../controller/user')

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post('/signup', UserController.signup)

router.post('/login', UserController.login)

router.delete('/:userId', checkAuth, UserController.delete) // any user logged in can currently delete any other user...

module.exports = router