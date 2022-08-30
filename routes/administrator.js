var express = require('express');
var router = express.Router();
var baza = require('../helper/baza');

exports.ime = "Kerim";



var db = {
    dajTrgovce: function (req,res,next) {
        baza.pool.query(`select naziv, username, status_aktivnosti from trgovac`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.trgovci = result.rows;
            next();
        })
    },
    dajKupce: function (req,res,next) {
        baza.pool.query(`select concat(ime, ' ', prezime) as ime_kupca, username, status_aktivnosti from kupac`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kupci = result.rows;
            console.log(req.kupci);
            next();
        })
    },
    promijeniStatusAktivnosti: function (req,res,next) {
        console.log("evo me");
        if(req.params.vrstaKorisnika === 'trg')
            req.params.vrstaKorisnika = 'trgovac'
        else req.params.vrstaKorisnika = 'kupac';
        if(req.params.status === 'aktivan' || req.params.status === 'blokiran') {
            let sql = "update " + req.params.vrstaKorisnika + " set status_aktivnosti = '" + req.params.status
            + "' where username = '" + req.params.username + "'";
            console.log(sql);
            baza.pool.query(sql, (err, res) => {
                if(err) {
                    console.log(err);
                    return next();
                }
                next();
            })
        }
        else {
            let sql = "update " + req.params.vrstaKorisnika + " set status_aktivnosti = (now() + INTERVAL '14 day')" +
                " where username = '" + req.params.username + "'";
            baza.pool.query(sql, (err, res) => {
                if(err) {
                    console.log(err);
                    return next();
                }
                next();
            })
        }
    },
    dajBrojTrgovaca: function (req,res,next) {
        baza.pool.query(`select count(*) from trgovac`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.brojTrgovaca = result.rows[0].count;
            console.log(req.brojTrgovaca);

            next();
        })
    },
    dajBrojKupaca: function (req,res,next) {
        baza.pool.query(`select count(*) from kupac`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.brojKupaca = result.rows[0].count;
            console.log(req.brojKupaca);
            next();
        })
    },
    brojArtikalaPoKategorijama: function (req,res,next) {
        baza.pool.query(`select * from statistika_artikala where kategorija != 'ukupno' order by broj desc`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.statistikaArtikala = result.rows;
            console.log(req.statistikaArtikala);
            next();
        })
    },
    brojTrgovacaPoKategorijama: function (req,res,next) {
        baza.pool.query(`select * from statistika_trgovaca where kategorija != 'ukupno' order by broj desc`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.statistikaTrgovaca = result.rows;
            console.log(req.statistikaTrgovaca);
            next();
        })
    },
    dajBrojNarudzbi: function (req,res,next) {
        baza.pool.query(`select count(*), status_narudzbe from narudzbe group by status_narudzbe`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.brojNarudzbi = result.rows;
            console.log(req.brojNarudzbi);
            next();
        })
    },
    dajNajprodavanijeArtikle: function (req,res,next) {
        baza.pool.query(`select count(*) as broj_prodanih, a.naziv from detalji_narudzbe dn
                        inner join artikal a on a.id = dn.id_artikla
                        inner join narudzbe n on n.id = dn.id_narudzbe
                        where n.status_narudzbe = 'Isporučeno'
                        group by a.naziv order by broj_prodanih desc 
                        limit 10`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.najprodavanijiArtikli = result.rows;
            console.log(req.najprodavanijiArtikli);
            next();

        })
    },
    dajKategorijeSaNajviseProdanihArtikala: function (req,res,next) {
        baza.pool.query(`select count(dn.id_artikla) as broj_prodanih, ka.kategorija from veza_artikla_i_kategorije vaik
                        inner join kategorije_artikla ka on vaik.id_kategorije = ka.id
                        inner join artikal a on a.id = vaik.id_artikla
                        inner join detalji_narudzbe dn on a.id = dn.id_artikla
                        inner join narudzbe n on dn.id_narudzbe = n.id
                        group by ka.kategorija order by broj_prodanih limit 5`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.najprodavanijeKategorije = result.rows;
            console.log(req.najprodavanijeKategorije);
            next();
        })
    },
    dajBrojTrgovaca2: function (req,res,next) {
        baza.pool.query(`select broj from statistika_trgovaca where kategorija = 'ukupno'`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.brojTrgovaca = result.rows[0].broj;
            next();
        })
    },
    brojArtikalaPoKategorijamaTabelarno: function (req,res,next) {
        baza.pool.query(`select kategorija, broj from statistika_artikala order by id`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.statistikaArtikala = result.rows;
            console.log(req.statistikaArtikala);
            next();
        })
    },
    brojTrgovacaPoKategorijamaTabelarno: function (req,res,next) {
        baza.pool.query(`select kategorija, broj from statistika_trgovaca order by id`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.statistikaTrgovaca = result.rows;
            console.log(req.statistikaTrgovaca);
            next();
        })
    },
    dajBrojProdanihPoKategorijama: function (req,res,next) {
        baza.pool.query(`select count(dn.id_artikla) as broj_prodanih, ka.kategorija from veza_artikla_i_kategorije vaik
                        inner join kategorije_artikla ka on vaik.id_kategorije = ka.id
                        inner join artikal a on a.id = vaik.id_artikla
                        inner join detalji_narudzbe dn on a.id = dn.id_artikla
                        inner join narudzbe n on dn.id_narudzbe = n.id
                        group by ka.kategorija order by broj_prodanih desc`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.brojProdanihPoKategorijama = result.rows;
            console.log(req.najprodavanijeKategorije);
            next();
        })
    },
    dajKategorijeTrgovca: function (req,res,next) {
        baza.pool.query(`select * from kategorije_trgovca`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kategorijeTrgovca = result.rows;
            next();
        })
    },
    dajKategorijeArtikla: function (req,res,next) {
        baza.pool.query(`select * from kategorije_artikla`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kategorijeArtikla = result.rows;
            next();
        })
    },
    dodajKategorijuTrgovca: function (req,res,next) {
        baza.pool.query(`insert into kategorije_trgovca(kategorija) values ($1)`, [req.params.kategorija],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    dodajKategorijuArtikla: function (req,res,next) {
        baza.pool.query(`insert into kategorije_artikla(kategorija) values ($1)`, [req.params.kategorija],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    }

}


router.get('/statusiKorisnika', db.dajTrgovce, db.dajKupce, function (req,res,next) {
    console.log(req.cookies.login);
    res.render('statusiKorisnika', {trgovci:req.trgovci, kupci:req.kupci});
});

router.get('/', function(req, res, next) {
    console.log(req.cookies.login);
    res.render('administratorPocetna');
});

router.get('/statistika', db.dajBrojTrgovaca, db.dajBrojKupaca, db.brojArtikalaPoKategorijama,
    db.brojTrgovacaPoKategorijama, db.dajBrojNarudzbi, db.dajNajprodavanijeArtikle,
    db.dajKategorijeSaNajviseProdanihArtikala,function (req,res,next) {
   res.render('statistika', {brojTrgovaca:req.brojTrgovaca, brojKupaca:req.brojKupaca,
       statistikaArtikala:req.statistikaArtikala, statistikaTrgovaca:req.statistikaTrgovaca,
       brojNarudzbi:req.brojNarudzbi, najprodavanijiArtikli:req.najprodavanijiArtikli,
   najprodavanijeKategorije:req.najprodavanijeKategorije});
});

router.get('/statistikaTabelarno', db.dajBrojTrgovaca2, db.dajBrojKupaca, db.brojArtikalaPoKategorijamaTabelarno,
    db.brojTrgovacaPoKategorijamaTabelarno,db.dajBrojNarudzbi,db.dajNajprodavanijeArtikle,
    db.dajBrojProdanihPoKategorijama,function (req,res,next) {

   res.render('statistikaTabelarno', {brojTrgovaca:req.brojTrgovaca, brojKupaca:req.brojKupaca,
       statistikaArtikala:req.statistikaArtikala,statistikaTrgovaca:req.statistikaTrgovaca,
       brojNarudzbi:req.brojNarudzbi, najprodavanijiArtikli:req.najprodavanijiArtikli,
       brojProdanihPoKategorijama:req.brojProdanihPoKategorijama
   });
});

router.get('/kategorije', db.dajKategorijeTrgovca, db.dajKategorijeArtikla, function (req,res,next) {
   res.render('kategorijeAdmin', {kategorijeTrgovca:req.kategorijeTrgovca,kategorijeArtikla:req.kategorijeArtikla});
});

router.post('/promijeniStatusAktivnosti/:vrstaKorisnika/:username/:status', db.promijeniStatusAktivnosti, function (req,res,next) {
   res.sendStatus(200);
});
router.post('/dodajKategorijuTrgovca/:kategorija', db.dodajKategorijuTrgovca, function (req,res,next) {
   res.sendStatus(200);
});
router.post('/dodajKategorijuArtikla', db.dodajKategorijuArtikla, function (req,res,next) {
    res.sendStatus(200);
});


module.exports = router;
