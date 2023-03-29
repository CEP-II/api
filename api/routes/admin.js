const express = require('express')
const router = express.Router()

const checkAuth = require('../middleware/checkAuth')

const adminController = require('../controller/admin')

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post('/signup', adminController.signup)

router.post('/login', adminController.login)

router.delete('/:adminId', checkAuth, adminController.delete) // any user logged in can currently delete any other user...

module.exports = router