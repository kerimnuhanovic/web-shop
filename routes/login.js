var express = require('express');
var router = express.Router();
var baza = require('../helper/baza');
var kriptuj = require('../helper/kriptuj');


var db = {
    dajPodatkeZaKupca: function (req, res, next) {
        req.params.password = kriptuj.kriptuj.kriptujKupca(req.params.password);
        baza.pool.query(`select count(*) from kupac where username = $1 and password = $2`,[req.params.username, req.params.password], (err, result) => {
            console.log(result.rows[0]);
            req.podaci = result.rows[0];
            next();
        })
    },
    dajPodatkeZaTrgovca: function (req, res, next) {
        req.params.password = kriptuj.kriptuj.kriptujTrgovca(req.params.password);
        baza.pool.query(`select count(*) from trgovac where username = $1 and password = $2`,[req.params.username, req.params.password], (err, result) => {
            console.log(result.rows[0]);
            req.podaci = result.rows[0];
            next();
        })
    },
    dajPodatkeZaAdministratora: function (req,res,next) {
        req.params.password = kriptuj.kriptuj.kriptujAdministratora(req.params.password);
        baza.pool.query(`select count(*) from administrator where username = $1 and password = $2`,[req.params.username, req.params.password], (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            console.log(result.rows[0]);
            req.podaci = result.rows[0];
            next();
        })
    },
    provjeraTrgovca: function (req,res,next) {
        req.params.password = kriptuj.kriptuj.kriptujTrgovca(req.params.password);
        baza.pool.query(`select provjera_trgovca($1, $2)`, [req.params.username,req.params.password],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            console.log(result.rows);
            req.podaci = result.rows[0].provjera_trgovca;
            next();

        })
    },
    provjeraKupca: function (req,res,next) {
        req.params.password = kriptuj.kriptuj.kriptujKupca(req.params.password);
        baza.pool.query(`select provjera_kupca($1, $2)`, [req.params.username,req.params.password],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            console.log(result.rows);
            req.podaci = result.rows[0].provjera_kupca;
            next();

        })
    }
}



/* GET home page. */

router.get('/trgovac', function (req,res,next) {
   res.render('loginTrgovac');
});

router.get('/kupac', function(req, res, next) {
   res.render('loginKupac');
});

router.get('/administrator', function (req,res,next) {
    res.render('loginAdministrator');
});

router.get('/', function(req, res, next) {
    res.render('login');
});

router.post('/logujKupca/:username/:password', db.provjeraKupca, function (req, res, next) {
    console.log(req.podaci);
    if(req.podaci !== 0) {
        var token = kriptuj.kriptuj.postaviTokenKupcu(req.params.username);
        res.cookie('login', token);
        res.send("ok");
    }
    else {
        res.send("notok");
    }
});

router.post('/logujTrgovca/:username/:password', db.provjeraTrgovca, function (req,res,next) {
    console.log(req.podaci);
    if(req.podaci !== 0) {
        var token = kriptuj.kriptuj.postaviTokenTrgovcu(req.params.username);
        console.log(token);
        res.cookie('login', token);
        res.send("ok");
    }
    else {
        res.send("notok");
    }
});

router.post('/logujAdministratora/:username/:password', db.dajPodatkeZaAdministratora, function (req,res,next) {
    console.log(req.podaci);
    if(req.podaci.count !== '0') {
        var token = kriptuj.kriptuj.postaviTokenAdministratoru(req.params.username);
        console.log(token);
        res.cookie('login', token);
        res.send("ok");
    }
    else {
        res.send("notok");
    }
});

module.exports = router;
