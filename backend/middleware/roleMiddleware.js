/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'super_admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}`,
      })
    }

    next()
  }
}

module.exports = { authorize }
