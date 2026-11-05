const server = require('../src/index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
 
chai.use(chaiHttp);
 
const username = 'testuser' + Date.now();
const password = 'testpassword';
 
describe('Authentication', () => {
  it('registers a new user and redirects to login', done => {
    chai
      .request(server)
      .post('/register')
      .type('form')
      .send({ username: username, password: password })
      .redirects(0)
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/login');
        done();
      });
  });
 
  it('rejects a duplicate username', done => {
    chai
      .request(server)
      .post('/register')
      .type('form')
      .send({ username: username, password: password })
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });
 
  it('logs in with the correct password and redirects to home', done => {
    chai
      .request(server)
      .post('/login')
      .type('form')
      .send({ username: username, password: password })
      .redirects(0)
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/home');
        done();
      });
  });
 
  it('rejects an incorrect password', done => {
    chai
      .request(server)
      .post('/login')
      .type('form')
      .send({ username: username, password: 'wrongpassword' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });
 
  it('redirects to login when visiting home while logged out', done => {
    chai
      .request(server)
      .get('/home')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/login');
        done();
      });
  });
});