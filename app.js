require("dotenv").config();
const cors = require("cors");
const express = require("express");
const userRouter = require("./routes/user");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);
app.use((err, req, res, next) => {
  console.error(err);
  err &&
    res.status(400).json({
      errors: [{ msg: `${err.cause.msg}`, path: `${err.cause.path}` }],
    });
});

app.get("/", (req, res) =>
  res.send(`
    <main style="text-align:center;padding:30px 10vw;">
      <h1>Welcome to the Gist Rest API server!</h1>
      <p>Gist provides RESTful APIs for chat messaging apps.</p>
      <h2>Gist Showcase</h2>
      <p>These are some of the sites currently using the Gist API:</p>
      <ul style="list-style:none;padding:0;">
        <li style="margin-bottom:10px;"><a href=${process.env.GIST_APP_URI}>Gist App</a></li>
      </ul>
    </main>
  `)
);

app.listen(port, () =>
  console.log(`Server listening for requests at port: ${port}!`)
);
