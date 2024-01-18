require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL);

const client = new MongoClient(process.env.DB_URL);
const db = client.db("exercise-tracker");
const urls = db.collection("users");

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: String,
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

const LogSchema = new Schema({
  user_id: { type: String, required: true },
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});
const Log = mongoose.model("Log", LogSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const result = urls.find();
  const responseDoc = await result.toArray();
  // console.log(responseDoc);
  if (responseDoc.length < 1) {
    res.json([{ _id: "", username: "" }]);
  } else {
    res.json(responseDoc);
  }
});

app.post("/api/users", async (req, res) => {
  const userObj = new User({ username: req.body.username });

  try {
    const user = await userObj.save();

    res.json(user);
  } catch (err) {
    console.log("caught your error baby", err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const id = req.params._id;

  try {
    const user = await User.findById(id);

    if (!user) {
      res.send("Could not find user");
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        username: user.username,
        duration,
        description,
        date: date ? new Date(date) : new Date(),
      });

      const exercise = await exerciseObj.save();

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  const { limit } = req.query;
  const id = req.params.id;
  console.log(limit);
  try {
    const user = await User.findById(id);

    if (!user) {
      res.send("Could not find user");
    } else {
      const exercises = await Exercise.find({ user_id: id }).limit(
        Number(limit)
      );

      const logObject = new Log({
        user_id: user._id,
        username: user.username,
        count: exercises.length,
        log: [
          ...exercises.map((exercise) => {
            exercise.date = new Date(exercise.date).toDateString();
            return exercise;
          }),
        ],
      });

      await logObject.save();
      res.json(logObject);
    }
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
