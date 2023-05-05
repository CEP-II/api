const jwt = require('jsonwebtoken');

// Middleware factory function
function checkRoles(allowedRoles) {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1]; // bearer {token}
      const decodedToken = jwt.verify(token, process.env.JWT_KEY, null);
      req.userData = decodedToken;

      // Check if the user's role is included in the allowed roles
      if (decodedToken.role && allowedRoles.includes(decodedToken.role)) {
        next();
      } else {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      return res.status(401).json({ message: 'Authorization failed' });
    }
  };
}

module.exports = checkRoles;
