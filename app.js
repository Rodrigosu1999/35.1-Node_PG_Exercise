/** BizTime express application. */

const express = require("express");
const app = express();
const ExpressError = require("./expressError");
const compRoutes = require("./routes/companies");
const invRoutes = require("./routes/invoices");

app.use(express.json());

//Companies routes come from companies.js
app.use("/companies", compRoutes);

//Invoices routes come from invoices.js
app.use("/invoices", invRoutes);


/** 404 handler */

app.use((req, res, next) => {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
