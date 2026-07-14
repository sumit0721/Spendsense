const proxyAuth = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();

  const secret = req.query.proxy_secret;
  delete req.query.proxy_secret;

  if (!secret || secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Direct API access is not permitted.',
    });
  }
  next();
};

module.exports = proxyAuth;
