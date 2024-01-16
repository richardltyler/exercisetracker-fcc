require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.DB_URL);
const db = client.db("exercise-tracker");
const urls = db.collection("exercise-tracker");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const result = urls.find();
  const responseDoc = await result.toArray();
  res.json(responseDoc);
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  const usernameDoc = { username };

  const result = await urls.insertOne(usernameDoc);
  res.json(usernameDoc);
});

app.post(
  "/api/users/:_id/exercises",
  (req, res, next) => {
    if (!req.body.date) {
      req.body.date = new Date().toDateString();
    }

    next();
  },
  async (req, res) => {
    const { description, duration, date } = req.body;
    const userId = req.params._id;

    const foundUser = await urls.findOneAndUpdate({ _id: userId });
    console.log(foundUser.json());

    // console.log(date);
    res.json({});
  }
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
