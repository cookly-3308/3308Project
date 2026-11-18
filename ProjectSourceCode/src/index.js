
const app = require('./app');
const { db } = require('./db');

// *****************************************************
// Section 1: Check Database Connection
// *****************************************************

db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// Section 2: Start Server
// *****************************************************

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
