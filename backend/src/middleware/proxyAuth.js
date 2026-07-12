const proxyAuth = (req, res, next) => {
  // Skip this check in local development where no Vercel proxy exists
  if (process.env.NODE_ENV !== 'production') return next();

  // Vercel automatically attaches 'x-vercel-id' to every request it proxies.
  // We check for this built-in header instead of a custom one, because
  // vercel.json 'headers' only apply to browser responses, not upstream proxies.
  const vercelId = req.headers['x-vercel-id'];
  
  if (!vercelId) {
    return res.status(403).json({
      success: false,
      message: 'Direct API access is not permitted.',
    });
  }
  next();
};

module.exports = proxyAuth;
