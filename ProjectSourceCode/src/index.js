const app = require('./app');
const { db } = require('./db');

db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

app.listen(3000);
console.log('Server is listening on port 3000');
