const express = require("express");
var slugify = require('slugify');
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db")

//companies get route to display all companies in database
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query("SELECT * FROM companies");
        return res.json({companies: results.rows});
    } catch (err){
        return next(err);
    }
});

//companies/:code get route to display a single company in database
router.get('/:code', async (req, res, next) => {
    try {
        const results = await db.query(`
        SELECT com.code, com.name, com.description, ind.industry 
        FROM companies AS com
        JOIN companies_industries AS ci
        ON com.code = ci.company_code
        JOIN industries AS ind
        ON ind.code = ci.industry_code
        WHERE com.code = $1`, [req.params.code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${req.params.code}`, 404)
        }
        const {code, name, description} = results.rows[0];
        const industries = results.rows.map(r => r.industry);
        return res.json({company: {code, name, description, industries}});
    } catch (err){
        return next(err);
    }
});

//companies post route to add a new company to database
router.post('/', async (req, res, next) => {
    try {
        const {name} = req.body;
        const code = slugify(name, {
            lower: true,
            strict: true
        });
        const description = req.body.description || null;
        const resultsCheck = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        if (resultsCheck.rows.length !== 0) {
            throw new ExpressError(`Company with code ${code} already exists`, 500)
        }
        const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *", [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//companies patch route to update an existing company in database
router.patch('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const {name} = req.body;
        const description = req.body.description || null;
        let results;

        if (!req.body) {
            throw new ExpressError(`There was no data sent on the request`, 500)
        }

        if (description) {
            results = await db.query("UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *", [name, description, code]);
        } else {
            results = await db.query("UPDATE companies SET name = $1 WHERE code = $2 RETURNING *", [name, code]);
        }

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${code}`, 404)
        }
    
        return res.status(201).json({company: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//companies delete route to eliminate an existing company in database
router.delete('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING *`, [code]);
        console.log(results);        
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${code}`, 404)
        }
        return res.json({msg: "Company deleted"});
    } catch (err){
        return next(err);
    }
});

//Exports
module.exports = router;