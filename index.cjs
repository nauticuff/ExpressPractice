const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Allows us to access the .env
require('dotenv').config();

const app = express();
const port = process.env.PORT // default port to listen

const corsOptions = {
   origin: '*', 
   credentials: true,  
   'access-control-allow-credentials': true,
   optionSuccessStatus: 200,
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(cors(corsOptions));

// Makes Express parse the JSON body of any requests and adds the body to the req object
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  try {
    // Connecting to our SQL db. req gets modified and is available down the line in other middleware and endpoint functions
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);

    // Moves the request on down the line to the next middleware functions and/or the endpoint it's headed for
    await next();

    // After the endpoint has been reached and resolved, disconnects from the database
    req.db.release();
  } catch (err) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    console.log(err)
    // If an error occurs, disconnects from the database
    if (req.db) req.db.release();
    throw err;
  }
});

//"Toggles" if a record is or isn't deleted
//Requires id of record 
app.delete('/car/:id', async (req, res) => {
  console.log(`Record number ${req.params.id}`)
  const id = req.params.id;

  await req.db.query(`
    UPDATE car
    SET deleted_flag = IF(deleted_flag = 0, 1, 0)
    WHERE id = :id
  `, { id });

  res.json({ success: true })
})

// Creates a GET endpoint to obtain all non deleted records
app.get('/car', async (req, res) => {
  console.log('GET to /car');
  const [cars] = await req.db.query(`
    SELECT * FROM car 
    WHERE deleted_flag = 0;
  `);

  console.log('All non deleted cars: ', cars);

  res.json({ cars });
});

//PUT endpoint that updates the model year of a given record
//Reuquires id of record and new year
app.put('/car', async (req, res) => {
  console.log('PUT to /car', req.body);
  const { 
    id,
    year
   } = req.body;

  const [update] = await req.db.query(`
    UPDATE car
    SET year = :year
    WHERE id = :id
  `, { year, id });

  const [record] = await req.db.query(`
    SELECT * 
    FROM car
    WHERE id = :id
  `, { id })

  console.log('Update: ', update);

  //Returns the updated record
  res.json({
    id,
    year,
    make: record[0].make,
    model: record[0].model,
    deleted_flag: record[0].deleted_flag
   });
});

//Creates a POST endpoint to create a record in the car table
//Requires all fields
app.post('/car', async (req, res) => {
  console.log('POST to /car: ', req.body);
  const {
    year,
    make,
    model,
    deleted_flag
  } = req.body;

  const [insert] = await req.db.query(`
      INSERT INTO car (year, make, model, deleted_flag)
      VALUES (:year, :make, :model, :deleted_flag);
  `, { year, make, model, deleted_flag })
  
  console.log('Insert: ', insert)
  
  res.json({
    id: insert.id,
    make,
    model,
    year,
    deleted_flag
  });
})