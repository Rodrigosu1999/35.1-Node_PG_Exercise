const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db")

//invoices get route to display all invoices in database
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query("SELECT * FROM invoices");
        return res.json({invoices: results.rows});
    } catch (err){
        return next(err);
    }
});

//invoices/:id get route to display a single invoice in database
router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id ${id}`, 404)
        }
        return res.json({invoice: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//invoices post route to add a new invoice to database
router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        const results = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *", [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//invoices patch route to update an existing invoice in database
router.patch('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const {amt} = req.body;
        const paid = req.body.paid;
        let results;
        if (paid) {
            const paid_date = new Date();
            results = await db.query("UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *", [amt, paid, paid_date, id]);
        } else if (paid === false){
            const paid_date = null;
            results = await db.query("UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *", [amt, paid, paid_date, id]);
        } else {
            results = await db.query("UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *", [amt, id]);
        }
    
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invocie with id ${id}`, 404)
        }
        return res.status(201).json({invoice: results.rows[0]});
    } catch (err){
        return next(err);
    }
});

//invoices delete route to eliminate an existing invoice in database
router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING *`, [id]); 
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${id}`, 404)
        }
        return res.json({msg: "Invoice deleted"});
    } catch (err){
        return next(err);
    }
});

//invoices/companies/:code get route to display all companies invoices in database
router.get('/companies/:code', async (req, res, next) => {
    try {
        const codeParam = req.params.code;
        const results = await db.query(
            `SELECT *  
            FROM companies 
            JOIN invoices
            ON companies.code = invoices.comp_code 
            WHERE code = $1`, [codeParam]
            );
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code ${codeParam}`, 404)
        }
        const {code, name, description} = results.rows[0];
        const invoices = results.rows.map(r => (
            {id: r.id, amt: r.amt, paid: r.paid, add_date:r.add_date, paid_date : r.paid_date}
        ));
        return res.json({company: code, name, description, invoices});
    } catch (err){
        return next(err);
    }
});


//Exports
module.exports = router;