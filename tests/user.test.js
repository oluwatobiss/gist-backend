const cors = require("cors");
const express = require("express");
const userRouter = require("../routes/user");
const request = require("supertest");
const app = express();
// let userId = 0;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/users", userRouter);

// Bypass the middleware authentication by replacing the middleware's actual implementation with an explicit module factory function like so: jest.mock(actualMiddleware, moduleFactoryToReplaceTheActualMiddleware)
// Doc: https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options
jest.mock("../middlewares/authentication", () => ({
  authenticateUser: (req, res, next) => {
    // req.user = { id: 0, firstName: 'Test', lastName: 'Test', username: 'test', email: 'test@test.com', password: 'test', status: 'BASIC', membership: [], iat: 1750189398 }; --> Only required if the next middleware needs any of req.user's properties. Otherwise, it's optional to use.
    next();
  },
}));

test("GET /users get all users' data", (done) => {
  request(app)
    .get("/users/?status=ADMIN")
    .expect("Content-Type", /json/)
    .expect(function (res) {
      if (!("lastName" in res.body[0])) throw new Error("missing lastName key");
    })
    .end(function (err, res) {
      if (err) return done(err);
      return done();
    });
});
