const proxyAuth = (req, res, next) => {
  // Skip this check in local development where no Vercel proxy exists
  if (process.env.NODE_ENV !== 'production') return next();

  const secret = req.headers['x-vercel-proxy-secret'];
  if (!secret || secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Direct API access is not permitted.',
    });
  }
  next();
};

module.exports = proxyAuth;
