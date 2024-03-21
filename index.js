const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const recordSessionsRoute = require('./routes/recordSessionsRoute');
const bodyParser = require('body-parser');
const path = require('path');

const PORT = 5500;

require('dotenv').config();
require('./iniitializeDatabase');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use('/api', recordSessionsRoute);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});