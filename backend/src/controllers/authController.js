const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
} = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, set httpOnly auth cookies
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Create user (password is hashed via pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set httpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, rotate refresh token, set httpOnly cookies
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Find user and include password field for comparison
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate new token pair (rotation)
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store new refresh token, invalidating the old one
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set httpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookies and invalidate refresh token
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (incomingRefreshToken) {
    // Invalidate the refresh token in DB
    await User.findOneAndUpdate(
      { refreshToken: incomingRefreshToken },
      { refreshToken: null }
    );
  }

  // Clear cookies
  res.clearCookie('accessToken', { httpOnly: true, path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, path: '/' });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

module.exports = { register, login, logout, getMe };
