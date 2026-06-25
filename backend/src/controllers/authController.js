const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/email');
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
      age: req.user.age,
      occupation: req.user.occupation,
    },
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile details (name, age, occupation)
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, age, occupation } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (age !== undefined) user.age = age;
  if (occupation !== undefined) user.occupation = occupation;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      occupation: user.occupation,
    },
  });
});

/**
 * @route   PUT /api/auth/updatepassword
 * @desc    Update user password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide both current and new passwords', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Incorrect current password', 401);
  }

  user.password = newPassword;
  await user.save();

  // Re-generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

/**
 * @route   POST /api/auth/forgotpassword
 * @desc    Generate password reset token and send via email
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new AppError('There is no user with that email', 404);
  }

  const otp = user.generatePasswordResetOTP();
  await user.save({ validateBeforeSave: false });

  const message = `You are receiving this email because you (or someone else) requested a password reset. \n\n Your OTP is: ${otp} \n\n Please enter this OTP in the application to reset your password.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'SpendSense Password Reset OTP',
      message,
      html: `
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password for your SpendSense account. Use the OTP below to complete the process:</p>
        <div style="padding:15px; background:#f3f4f6; font-size:24px; font-weight:bold; letter-spacing:4px; text-align:center; border-radius:8px; margin: 20px 0; color: #111;">
          ${otp}
        </div>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This OTP is only valid for the next 10 minutes.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent',
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    console.error('Email sending error:', err);
    throw new AppError('Email could not be sent', 500);
  }
});

/**
 * @route   PUT /api/auth/resetpassword
 * @desc    Reset password using OTP
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    throw new AppError('Please provide email, otp, and new password', 400);
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const user = await User.findOne({
    email,
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid OTP, email, or OTP has expired', 400);
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Re-generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

module.exports = { register, login, logout, getMe, updateProfile, updatePassword, forgotPassword, resetPassword };
