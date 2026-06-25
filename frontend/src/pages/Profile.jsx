import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword, forgotPassword } from '../services/api';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { User, Lock, Mail, Activity, Briefcase } from 'lucide-react';

export default function Profile() {
  const { user, checkAuth } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    occupation: user?.occupation || '',
  });
  const [profileStatus, setProfileStatus] = useState({ loading: false, error: null, success: false });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: false });

  const [forgotStatus, setForgotStatus] = useState({ loading: false, error: null, success: false });
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [resetPasswordState, setResetPasswordState] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileStatus({ loading: true, error: null, success: false });
    try {
      await updateProfile(profileData);
      await checkAuth(); // Refresh user context
      setProfileStatus({ loading: false, error: null, success: true });
      setTimeout(() => setProfileStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (err) {
      setProfileStatus({ loading: false, error: err.response?.data?.message || 'Failed to update profile', success: false });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ loading: false, error: "New passwords do not match", success: false });
      return;
    }

    setPasswordStatus({ loading: true, error: null, success: false });
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordStatus({ loading: false, error: null, success: true });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (err) {
      setPasswordStatus({ loading: false, error: err.response?.data?.message || 'Failed to update password', success: false });
    }
  };

  const handleForgotPassword = async () => {
    setForgotStatus({ loading: true, error: null, success: false });
    try {
      await forgotPassword(user.email);
      // Clear success state so the step 2 form inputs will render
      setForgotStatus({ loading: false, error: null, success: false });
      setForgotStep(2);
    } catch (err) {
      setForgotStatus({ loading: false, error: err.response?.data?.message || 'Failed to send reset email', success: false });
    }
  };

  const handleResetWithOtp = async (e) => {
    e.preventDefault();
    if (resetPasswordState !== resetConfirmPassword) {
      setForgotStatus({ loading: false, error: "Passwords do not match", success: false });
      return;
    }
    setForgotStatus({ loading: true, error: null, success: false });
    try {
      const { resetPassword } = await import('../services/api');
      await resetPassword(user.email, otp, resetPasswordState);
      setForgotStatus({ loading: false, error: null, success: true });
      setTimeout(() => {
        setForgotStep(1);
        setOtp('');
        setResetPasswordState('');
        setResetConfirmPassword('');
      }, 3000);
    } catch (err) {
      setForgotStatus({ loading: false, error: err.response?.data?.message || 'Failed to reset password', success: false });
    }
  };

  return (
    <>
      <TopBar title="My Profile" />

      <div className="p-6 max-w-4xl mx-auto space-y-8 w-full animate-fade-in">
        
        {/* Profile Settings */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
            <User className="text-primary w-6 h-6" />
            <h2 className="text-[20px] font-bold text-on-surface">Basic Information</h2>
          </div>

          {profileStatus.error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {profileStatus.error}
            </div>
          )}
          {profileStatus.success && (
            <div className="mb-4 p-3 bg-success/10 text-success rounded-lg text-sm font-medium border border-success/20">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-60" />
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider block">Email (Cannot be changed)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-60" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant outline-none cursor-not-allowed text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider block">Age</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-60" />
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                    placeholder="Enter your age"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider block">Occupation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-60" />
                  <input
                    type="text"
                    value={profileData.occupation}
                    onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileStatus.loading}>
                {profileStatus.loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        {/* Password Settings */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
            <Lock className="text-primary w-6 h-6" />
            <h2 className="text-[20px] font-bold text-on-surface">Security</h2>
          </div>

          {passwordStatus.error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {passwordStatus.error}
            </div>
          )}
          {passwordStatus.success && (
            <div className="mb-4 p-3 bg-success/10 text-success rounded-lg text-sm font-medium border border-success/20">
              Password updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant block">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full bg-surface px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant block">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-surface px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-on-surface-variant block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-surface px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[15px]"
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={passwordStatus.loading}>
                  {passwordStatus.loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>

            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/60 flex flex-col justify-center items-start">
              <h3 className="font-bold text-[16px] text-on-surface mb-2">Forgot your password?</h3>
              <p className="text-[13px] text-on-surface-variant leading-relaxed mb-4">
                {forgotStep === 1 
                  ? `If you forgot your password, you can request a reset OTP. We will send an email to `
                  : `Enter the 6-digit OTP sent to your email to reset your password.`}
                {forgotStep === 1 && <strong className="text-on-surface">{user?.email}</strong>}
              </p>
              
              {forgotStatus.error && (
                <div className="mb-3 w-full p-2 bg-error-container text-on-error-container rounded text-[12px]">
                  {forgotStatus.error}
                </div>
              )}
              
              {forgotStep === 1 ? (
                <Button variant="secondary" onClick={handleForgotPassword} disabled={forgotStatus.loading}>
                  {forgotStatus.loading ? 'Sending OTP...' : 'Send Reset OTP'}
                </Button>
              ) : (
                <form onSubmit={handleResetWithOtp} className="w-full space-y-3">
                  {forgotStatus.success && forgotStep === 2 ? (
                    <div className="w-full p-3 bg-success/10 text-success rounded-lg text-[13px] font-medium border border-success/20 text-center">
                      Password reset successfully!
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 p-2 bg-success/10 text-success rounded-lg text-center text-[13px] font-medium border border-success/20">
                        An OTP has been sent to your email.
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg text-[16px] text-center tracking-[0.5em] font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="6-digit OTP"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={resetPasswordState}
                        onChange={(e) => setResetPasswordState(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg text-[14px] focus:outline-none focus:border-primary transition-all"
                        placeholder="New Password"
                      />
                      <input
                        type="password"
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg text-[14px] focus:outline-none focus:border-primary transition-all"
                        placeholder="Confirm New Password"
                      />
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={forgotStatus.loading} className="w-full">
                          {forgotStatus.loading ? 'Resetting...' : 'Reset'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setForgotStep(1)} className="w-full">
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
