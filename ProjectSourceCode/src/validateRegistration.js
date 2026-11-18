function validateRegistration(input) {
  return Boolean(
    input &&
    typeof input.username === 'string' &&
    input.username.length > 0 &&
    typeof input.password === 'string' &&
    input.password.length > 0
  );
}

module.exports = validateRegistration;
