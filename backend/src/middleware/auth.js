const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');

/**
 * Generate a short-lived access token (15 minutes).
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Generate a long-lived refresh token (7 days).
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Shared cookie configuration for secure httpOnly cookies.
 */
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge,
  path: '/',
});

/**
 * Set both access and refresh token cookies on the response.
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000)); // 15 min
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
};

/**
 * Middleware: Protect routes — verifies the access token from httpOnly cookie.
 * Attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AppError('Not authorized — no token provided', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  req.user = user;
  next();
});

/**
 * Refresh token handler — rotates refresh token on every use.
 * This prevents token reuse attacks: once a refresh token is used,
 * it's invalidated and replaced with a new one.
 */
const refreshTokenHandler = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new AppError('No refresh token provided', 401);
  }

  const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== incomingRefreshToken) {
    // Token reuse detected — invalidate all sessions for safety
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    throw new AppError('Invalid refresh token — please log in again', 401);
  }

  // Rotate: generate new pair, store new refresh token
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    success: true,
    message: 'Tokens refreshed successfully',
  });
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  cookieOptions,
  setTokenCookies,
  protect,
  refreshTokenHandler,
};
