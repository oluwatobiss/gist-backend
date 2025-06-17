const cors = require("cors");
const express = require("express");
const channelRouter = require("../routes/channel");
const request = require("supertest");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/channels", channelRouter);

jest.mock("../middlewares/authentication", () => ({
  authenticateUser: (req, res, next) => {
    next();
  },
}));

test("GET /channels get all channels' data", (done) => {
  request(app)
    .get("/channels")
    .expect("Content-Type", /json/)
    .expect(function (res) {
      if (!("name" in res.body[0])) throw new Error("missing name key");
    })
    .end(function (err, res) {
      if (err) return done(err);
      return done();
    });
});
