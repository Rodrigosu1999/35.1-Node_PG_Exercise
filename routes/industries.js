const express = require("express");
var slugify = require('slugify');
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db")

//industries get route to display all industries in database
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({industries: results.rows});
    } catch (err){
        return next(err);
    }
});

//companies/:code get route to display a single company in database
router.get('/:code', async (req, res, next) => {
    try {
        const results = await db.query(`
        SELECT ind.code, ind.industry, com.name 
        FROM industries AS ind
        JOIN companies_industries AS ci
        ON ind.code = ci.industry_code
        JOIN companies AS com
        ON com.code = ci.company_code
        WHERE ind.code = $1`, [req.params.code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${req.paramscode}`, 404)
        }
        const {code, industry} = results.rows[0];
        const companies = results.rows.map(r => r.name);
        return res.json({industry: code, industry, companies});
    } catch (err){
        return next(err);
    }
});

//industries post route to add a new industry to database
router.post('/', async (req, res, next) => {
    try {
        const {code, industry} = req.body;
        const resultsCheck = await db.query(`SELECT * FROM industries WHERE code = $1`, [code]);
        if (resultsCheck.rows.length !== 0) {
            throw new ExpressError(`Industry with code ${code} already exists`, 400)
        }
        const results = await db.query("INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *", [code, industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch (err){
        return next(err);
    }
});


//companies patch route to update an existing company in database
router.patch('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const {industry} = req.body;
        const results = await db.query("UPDATE industries SET industry = $1 WHERE code = $2 RETURNING *", [industry, code]);

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find industry with code ${code}`, 404)
        }
        return res.status(201).json({industry: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//companies delete route to eliminate an existing company in database
router.delete('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query(`DELETE FROM industries WHERE code = $1 RETURNING *`, [code]);   
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find industry with code ${code}`, 404)
        }
        return res.json({msg: "Industry deleted"});
    } catch (err){
        return next(err);
    }
});

//Exports
module.exports = router;