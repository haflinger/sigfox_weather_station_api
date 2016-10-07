import bodyParser from "body-parser";
import express from "express";
import morgan from "morgan";
import sqlite3 from "sqlite3";


const DEFAULT_VALUE = 0; // Data default value
const ERROR_RESPONSE_CODE = 500;
const FORBIDDEN_RESPONSE_CODE = 403;
const LISTEN_PORT = 3000;
const SIGFOX_DEVICE_ID = "device_id"; // Set the device ID

// Init SQLite Database
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.get("SELECT * FROM weather ORDER BY ROWID ASC LIMIT 1", (err, rows) => {

    // Create table if not exist
    if (rows === undefined) {

      const request = "CREATE TABLE weather (date INTEGER, temperature NUMERIC, humidity INTEGER, pressure INTEGER)"

      db.run(request, (err) => {
        // Show error if exist
        if (err) {
          console.log(err);
        } else {
          console.log("Weather table initialized.")
        }
      });
    } else {
      console.log("Weather table already initialized.")
    }

  });

});

const app = new express();

app.use(morgan("dev"));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// METHOD POST : Get weather values
app.post("/", (req, res) => {

  // Ultra simple security check.
  if (req.body.device_id !== SIGFOX_DEVICE_ID) {
    res.status(FORBIDDEN_RESPONSE_CODE).json({ message: "Unknow device."});
  } else {
    // Get values from application/x-www-form-urlencoded request
    const temperature = req.body.temperature || DEFAULT_VALUE;
    const humidity = req.body.humidity || DEFAULT_VALUE;
    const pression = req.body.pression || DEFAULT_VALUE;

    // Prepare SQLite request
    const request = `INSERT INTO weather VALUES ('${Date.now()}', '${temperature}', '${humidity}', '${pression}')`;

    // Run SQlite request
    db.run(request, (err) => {
      if (err) {
        res.status(ERROR_RESPONSE_CODE).json({ error: err });
      } else {
        res.json({ message: "Weather data saved." });
      }
    });
  }

});

// METHOD GET : Get all the last results
app.get("/", (req, res) => {
  db.all("SELECT * FROM weather ORDER BY date DESC", (err, row) => {
    if (err) {
      res.status(ERROR_RESPONSE_CODE).json({ error: err });
    } else {
      res.json(row); // Return all the weather data;
    }
  });
});

app.listen(LISTEN_PORT, () => {
  console.log(`Listen on port ${LISTEN_PORT}`);
});
