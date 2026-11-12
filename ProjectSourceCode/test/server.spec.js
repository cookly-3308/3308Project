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
  const runId = randomUUID().slice(0, 8);
  const username = `lab10_${runId}`;
  const email = `lab10_${runId}@example.com`;
  const password = 'testPassword123';

  const deleteTestUser = () =>
    db.none('DELETE FROM users WHERE username = $1 OR email = $2', [
      username,
      email,
    ]);

  beforeEach(deleteTestUser);
  afterEach(deleteTestUser);

  it('registers a new user successfully (positive)', async () => {
    const res = await chai
      .request(app)
      .post('/register')
      .redirects(0)
      .type('form')
      .send({username, password, email});

    expect(res).to.have.status(302);
    expect(res).to.redirectTo(/\/login$/);

    const users = await db.any('SELECT * FROM users WHERE username = $1', [
      username,
    ]);
    expect(users).to.have.lengthOf(1);

    const user = users[0];
    expect(user.username).to.equal(username);
    expect(user.email).to.equal(email);

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

describe('Protected home page (extra credit)', () => {
  const runId = randomUUID().slice(0, 8);
  const fixtureUser = {
    username: `lab10_home_${runId}`,
    password: 'homePassword123',
  };

  before(async () => {
    const hash = await bcrypt.hash(fixtureUser.password, 10);
    await db.none(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [fixtureUser.username, hash]
    );
  });

  after(async () => {
    await db.none('DELETE FROM users WHERE username = $1', [
      fixtureUser.username,
    ]);
  });

  it('redirects to /login when not logged in (negative)', async () => {
    const agent = chai.request.agent(app);
    try {
      const res = await agent.get('/home').redirects(0);

      expect(res).to.have.status(302);
      expect(res).to.redirectTo(/\/login$/);
    } finally {
      agent.close();
    }
  });

  it('shows the home page after a real login (positive)', async () => {
    const agent = chai.request.agent(app);
    try {
      const loginRes = await agent
        .post('/login')
        .redirects(0)
        .type('form')
        .send(fixtureUser);

      expect(loginRes).to.have.status(302);
      expect(loginRes).to.redirectTo(/\/home$/);

      const res = await agent.get('/home').redirects(0);

      expect(res).to.have.status(200);
      expect(res).to.be.html;
      expect(res.text).to.include(fixtureUser.username);
    } finally {
      agent.close();
    }
  });
});

describe('Login redirect', () => {
  it('redirects unauthenticated users to /login', async () => {
    const res = await chai.request(app).get('/home').redirects(0);

    expect(res).to.have.status(302);
    expect(res).to.have.header('location', '/login');
  });
});

describe('Login page', () => {
  it('renders the login form', async () => {
    const res = await chai.request(app).get('/login');

    expect(res).to.have.status(200);
    expect(res).to.be.html;
    expect(res.text).to.include('Login to Cookly');
  });
});