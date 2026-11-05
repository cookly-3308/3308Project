function validateRegistration(username, password, email) {
  if (!username || !username.trim()) {
    return 'Username is required';
  }
  if (username.trim().length < 3 || username.trim().length > 50) {
    return 'Username must be between 3 and 50 characters';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Email is not valid';
  }
  return null;
}

module.exports = validateRegistration;
