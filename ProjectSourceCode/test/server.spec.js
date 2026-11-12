const chai = require('chai');
const chaiHttp = require('chai-http');
const {randomUUID} = require('crypto');
const app = require('../src/app');
const {db, pgp} = require('../src/db');
const bcrypt = require('bcryptjs');

chai.use(chaiHttp);
const {expect} = chai;

after(() => {
  pgp.end();
});

describe('Welcome route', () => {
  it('returns the default welcome message', async () => {
    const res = await chai.request(app).get('/welcome');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({
      status: 'success',
      message: 'Welcome!',
    });
  });
});


describe('Registration route', () => {
  // A unique username and email per run, so leftover rows from an earlier
  // run can never collide with this one.
  const runId = randomUUID().slice(0, 8);
  const username = `lab10_${runId}`;
  const email = `lab10_${runId}@example.com`;
  const password = 'testPassword123';

  const deleteTestUser = () =>
    db.none('DELETE FROM users WHERE username = $1 OR email = $2', [
      username,
      email,
    ]);

  // Targeted cleanup: only this test's user is removed, before and after
  // every test (afterEach also runs when a test fails).
  beforeEach(deleteTestUser);
  afterEach(deleteTestUser);

  it('registers a new user successfully (positive)', async () => {
    const res = await chai
      .request(app)
      .post('/register')
      .redirects(0)
      .type('form')
      .send({username, password, email});

    // Documented success response: 302 redirect to /login
    expect(res).to.have.status(302);
    expect(res).to.redirectTo(/\/login$/);

    // Exactly one matching row with the expected fields
    const users = await db.any('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    expect(users).to.have.lengthOf(1);

    const user = users[0];
    expect(user.username).to.equal(username);
    expect(user.email).to.equal(email);

    // Password is stored as a bcrypt hash, never as plain text
    const storedHash = user.password_hash.trim();
    expect(storedHash).to.not.equal(password);
    expect(await bcrypt.compare(password, storedHash)).to.equal(true);
  });

  it('rejects registration without a password (negative)', async () => {
    const res = await chai
      .request(app)
      .post('/register')
      .redirects(0)
      .type('form')
      .send({username, email});

    // Documented rejection response: 400 with the error message (not a 500)
    expect(res).to.have.status(400);
    expect(res).to.be.html;
    expect(res.text).to.include('Username and password are required');

    // No user was inserted
    const users = await db.any('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    expect(users).to.have.lengthOf(0);
  });
});
