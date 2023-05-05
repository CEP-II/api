const express = require('express')
const router = express.Router()

const authorizeRoles = require('../middleware/authorizeRoles')

const adminController = require('../controller/admin')

// Sign-up and sign-in. Since we dont store information (stateless), we don't need to log the user out (we can't do this)
router.post('/signup', authorizeRoles(['admin']), adminController.signup)

router.post('/login', adminController.login)

router.delete('/:adminId', authorizeRoles(['admin']), adminController.delete) // any user logged in can currently delete any other user...

module.exports = router