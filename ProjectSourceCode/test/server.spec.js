const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const { db, pgp } = require('../src/db');
const bcrypt = require('bcryptjs');

chai.use(chaiHttp);
const { expect } = chai;

const newUser = 'register_test_user';
const existingUser = 'login_test_user';
const password = 'testpassword123';

before(async () => {
  await db.none('DELETE FROM users WHERE username IN ($1, $2)', [newUser, existingUser]);
  const hash = await bcrypt.hash(password, 10);
  await db.none('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [existingUser, hash]);
});

after(async () => {
  await db.none('DELETE FROM users WHERE username IN ($1, $2)', [newUser, existingUser]);
  pgp.end();
});

describe('POST /register', () => {
  it('creates a user with a hashed password and redirects to login', async () => {
    const res = await chai
      .request(app)
      .post('/register')
      .type('form')
      .send({ username: newUser, password: password })
      .redirects(0);

    expect(res).to.have.status(302);
    expect(res).to.redirectTo('/login');

    const user = await db.one('SELECT password_hash FROM users WHERE username = $1', [newUser]);
    expect(user.password_hash).to.not.equal(password);
  });

  it('rejects a username that is already taken', async () => {
    const res = await chai
      .request(app)
      .post('/register')
      .type('form')
      .send({ username: existingUser, password: password });

    expect(res).to.have.status(400);
  });
});

describe('POST /login', () => {
  it('logs in with the correct password and redirects to home', async () => {
    const res = await chai
      .request(app)
      .post('/login')
      .type('form')
      .send({ username: existingUser, password: password })
      .redirects(0);

    expect(res).to.have.status(302);
    expect(res).to.redirectTo('/home');
  });

  it('rejects an incorrect password', async () => {
    const res = await chai
      .request(app)
      .post('/login')
      .type('form')
      .send({ username: existingUser, password: 'wrongpassword' });

    expect(res).to.have.status(400);
  });
});
