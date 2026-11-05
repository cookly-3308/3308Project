const { expect } = require('chai');
const validateRegistration = require('../src/validateRegistration');

describe('validateRegistration', () => {
  it('accepts a valid username, password, and email', () => {
    expect(validateRegistration('brayden', 'password123', 'brayden@example.com')).to.equal(null);
  });

  it('rejects a missing username', () => {
    expect(validateRegistration('', 'password123')).to.equal('Username is required');
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(validateRegistration('brayden', 'short')).to.equal('Password must be at least 8 characters');
  });

  it('rejects an invalid email', () => {
    expect(validateRegistration('brayden', 'password123', 'not-an-email')).to.equal('Email is not valid');
  });
});
