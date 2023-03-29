const jwt = require('jsonwebtoken')


// default middleware pattern for express apps 
module.exports = (req, res, next) => {
    // jwt.decode is not sufficient. It does not verify, only ensures valid base 64 encoding. 

    try {
        const token = req.headers.authorization.split(" ")[1] // token in header is formatted "Bearer token"
        const decodedToken = jwt.verify(token, process.env.JWT_KEY, null)
        req.userData = decodedToken // adding new field to request, i.e. in future requests we can extract decoded user data.
        next();  // if we successfully autheneticate, else we don't want to call it. 
    } catch(err) {
        return res.status(401).json({message: "Authorization failed"})
    }

}