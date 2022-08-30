var express = require('express');
var router = express.Router();
var baza = require('../helper/baza');
var kriptuj = require('../helper/kriptuj');
const multer = require('multer');
const CryptoJS = require("crypto-js");
const uuid = require('uuid').v4;
var cookie = require('cookie');

const fs = require('fs');

var pomocneVarijable = {
    ponovljeniUsername: false,
    ponovljeniUsernameTrgovca: false
};


const storage = multer.diskStorage({
   destination: (req, file, cb) => {
       cb(null, 'public/images/profilneSlike');
   },
   filename: (req, file, cb) => {
       const {originalname} = file;
       const novaSlika = `${uuid()}-${originalname}`;
       req.slika = novaSlika;

       cb(null, novaSlika);





   }
});

const upload = multer({storage});

const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/profilneSlikeTrgovaca');
    },
    filename: (req, file, cb) => {
        const {originalname} = file;
        const novaSlika = `${uuid()}-${originalname}`;
        req.slika = novaSlika;
        cb(null, novaSlika);
    }
});

const upload2 = multer({storage:storage2});




var db = {
    dajKategorijeTrgovca: function (req, res, next) {
        baza.pool.query(`select * from kategorije_trgovca`, (err, result) => {
            req.kategorijeTrgovca = result.rows;
            next();
        })
    },
    registrujTrgovca: function (req, res, next) {





        var niz = req.body.kategorijeTrgovca;

        var noviString = "";
        if(Array.isArray(niz) === true) {
            for (let i = 0; i < niz.length - 1; i++) {
                console.log(niz[i]);
                noviString += niz[i] + ",";
            }
            noviString += niz[niz.length - 1];
        }
        else noviString = niz;

        req.body.password = kriptuj.kriptuj.kriptujTrgovca(req.body.password);

        baza.pool.query("call registruj_trgovca($1,$2,$3,$4,$5,$6,$7,$8)",
            [req.body.naziv, req.body.username, req.body.password, req.body.telefon, req.body.email, req.body.adresaSjedista, noviString, req.slika],(err, result) => {
            if(err) {
                console.log(err);
                pomocneVarijable.ponovljeniUsernameTrgovca = true;
                const path = 'public/images/profilneSlikeTrgovaca/' + req.slika;

                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }
                return next();
            }

            //postavi cookie trgovcu

            var token = kriptuj.kriptuj.postaviTokenTrgovcu(req.body.username);
            res.cookie('login', token);
            next();


        })
    },

    registrujKupca: function (req, res, next) {



        req.body.password = kriptuj.kriptuj.kriptujKupca(req.body.password);

        baza.pool.query(`insert into kupac(ime, prezime, username, password, email, interesovanja, profilna_slika, status_aktivnosti)
                    values ($1,$2,$3,$4,$5,$6,$7, 'aktivan')`,
            [req.body.ime, req.body.prezime, req.body.username, req.body.password, req.body.email, req.body.interesovanja, req.slika],(err, res) => {
            if(err) {
                const path = 'public/images/profilneSlike/' + req.slika;

                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }

                pomocneVarijable.ponovljeniUsername = true;
                return next();
            }

            next();
        })
    },
    pogledajBody:function (req,res,next) {
        console.log(req.body);
        next();
    }



}


router.get('/trgovac', db.dajKategorijeTrgovca,  function(req, res, next) {
   res.render('registracijaTrgovca', {kategorijeTrgovca:req.kategorijeTrgovca});
});


router.get('/kupac', function (req, res, next) {
   res.render('registracijaKupca');
});

router.get('/', function(req, res, next) {
    res.clearCookie('korpa');
    console.log(req.cookies.korpa);
    console.log(req.cookies);
    res.render('registracija');
});

router.post('/registrujTrgovca', upload2.single('profilna'),db.registrujTrgovca, function (req, res, next) {
    if(!pomocneVarijable.ponovljeniUsernameTrgovca)
        res.redirect('/trgovac/profil');
    else {
        pomocneVarijable.ponovljeniUsernameTrgovca = false;
        res.render('greskaRegistracijeTrgovca');
    }
});

router.post('/registrujKupca',upload.single('profilna'), db.registrujKupca, function (req, res,next) {
    if(!pomocneVarijable.ponovljeniUsername) {
        var token = kriptuj.kriptuj.postaviTokenKupcu(req.body.username);
        //postavi token kupcu
        res.cookie('login', token);
        res.sendStatus(200);
    }
    else {
        pomocneVarijable.ponovljeniUsername = false;
        res.render('greskaRegistracije');
    }

});
/*
router.get('/testSlike', db.dajSliku, function (req, res, next) {
   res.render('slikicaProbno', {prviKupac:req.prviKupac});
});
*/
module.exports = router;
