var express = require('express');
var router = express.Router();
const multer = require('multer');
const CryptoJS = require("crypto-js");
const uuid = require('uuid').v4;
var baza = require('../helper/baza');
const kriptuj = require("../helper/kriptuj");
const fs = require('fs')
const nodemailer = require("nodemailer");




var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'webshopbih@gmail.com',
        pass: 'webshopwebshop'
    },
    tls: {
        rejectUnauthorized: false
    }
})


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/profilneSlikeTrgovaca');
    },
    filename: (req, file, cb) => {
        const {originalname} = file;
        const novaSlika = `${uuid()}-${originalname}`;
        req.slika = novaSlika;
        console.log("nesto");

        baza.pool.query(`select slika from trgovac where username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            if(result.rows[0].slika) {
                const path = 'public/images/profilneSlikeTrgovaca/' + result.rows[0].slika;

                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }
            }
            baza.pool.query(`update trgovac set slika = $1 where username = $2`,[novaSlika, req.cookies.login.username], (err, res) => {
                if(err) {
                    console.log(err);
                    return next();
                }
                cb(null, novaSlika);
            })
        })
    },
});



const upload = multer({storage});

var brojac = 0;

const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/slikeArtikala');
    },
    filename: (req, file, cb) => {
        const {originalname} = file;
        const novaSlika = `${uuid()}-${originalname}`;
        if(brojac === 0) {
            req.slike = [];
            req.slike.push(novaSlika);
        }
        else {
            req.slike.push(novaSlika);
        }
        console.log(req.slike);
        console.log(brojac);
        brojac += 1;
        cb(null, novaSlika);
    }
});

const upload2 = multer({storage:storage2});



const storage3 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/slikeArtikala');
    },
    filename: (req, file, cb) => {
        const {originalname} = file;
        const novaSlika = `${uuid()}-${originalname}`;
        req.slika = novaSlika;

        baza.pool.query(`select naslovna_slika, naslovna_slika_u_slikama from artikal where id = $1`,
            [req.params.idArtikla],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            console.log(result.rows[0].naslovna_slika_u_slikama);
            if(result.rows[0].naslovna_slika_u_slikama !== 'da') {


                const path = 'public/images/slikeArtikala/' + naslovna_slika;

                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }
                baza.pool.query(`update artikal set naslovna_slika_u_slikama = 'ne', naslovna_slika = $2 where id = $1`,
                    [req.params.idArtikla,req.slika],(err, res) => {
                        if(err) {
                            console.log(err)
                            return next();
                        }
                        cb(null, novaSlika);
                    })

            }
            else if(result.rows[0].naslovna_slika_u_slikama === 'da') {
                baza.pool.query(`update artikal set naslovna_slika_u_slikama = 'ne', naslovna_slika = $2 where id = $1`,
                    [req.params.idArtikla,req.slika],(err, res) => {
                    if(err) {
                        console.log(err)
                        return next();
                    }
                    cb(null, novaSlika);
                })
            }

        })

    }
});



const upload3 = multer({storage:storage3});




var db = {
    updateTrgovca: function (req, res, next) {
        baza.pool.query(`update trgovac set naziv = $1, telefon = $2, email = $3, adresa_sjedista = $4
 where username = $5`,
            [req.body.naziv, req.body.telefon, req.body.email, req.body.sjediste,req.cookies.login.username],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    dajPodatkeZaTrgovca: function (req, res, next) {
        console.log(req.cookies);
        var username = req.cookies.login.username;
        console.log(username);
        baza.pool.query(`select * from trgovac where username = $1`, [username],(err, result) => {
            req.podaciTrgovca = result.rows[0];
            console.log(req.podaciTrgovca);
            next();
        })
    },
    promijeniLozinkuTrgovca2: function (req, res, next) {
        var username = req.cookies.login.username;
        req.params.stara = kriptuj.kriptuj.kriptujTrgovca(req.params.stara);
        if(req.params.stara === req.podaciTrgovca.password && req.params.nova === req.params.potvrda) {
            req.params.nova = kriptuj.kriptuj.kriptujTrgovca(req.params.nova);
            baza.pool.query(`update trgovac set password = $1 where username = $2`, [req.params.nova, username], (err, res) => {
                console.log("usaooo");
                res.objekat = true;
                return next();
            })
        }
        else res.send("notok");
    },
    dodajLokacijuPoslovnice: function (req, res, next) {
        baza.pool.query(`call dodajLokacijuPoslovnice($1,$2)`, [req.cookies.login.username, req.params.lokacija],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    dajKategorijeArtikla: function (req, res, next) {
        baza.pool.query(`select * from kategorije_artikla`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kategorijeArtikla = result.rows;
            console.log("ide");
            next();

        })
    },
    ubaciArtikal: function (req, res, next) {
        brojac = 0;
        var stringSlika = "";
        for(let i = 0; i < req.slike.length-1; i++) {
            stringSlika += req.slike[i] + ",";
        }
        stringSlika += req.slike[req.slike.length-1];
        var stringKategorija = "";
        if(Array.isArray(req.body.kategorije_artikla) === true) {

            for (let i = 0; i < req.body.kategorije_artikla.length - 1; i++) {
                stringKategorija += req.body.kategorije_artikla[i] + ","
            }
            stringKategorija += req.body.kategorije_artikla[req.body.kategorije_artikla.length - 1];
        }
        else stringKategorija = req.body.kategorije_artikla;
        console.log(Array.isArray(req.body.kategorije_artikla));
        console.log(req.body.kategorije_artikla);
        console.log(typeof req.body.kategorije_artikla);
        console.log("------");
        console.log(stringKategorija);
        console.log(typeof stringKategorija);

        console.log("-------");
        console.log(stringSlika);
        console.log(typeof stringSlika);

        baza.pool.query(`call dodajArtikal($1,$2,$3,$4,$5,$6,$7,$8)`,
            [req.body.naziv,req.body.opis,req.body.dostupna_kolicina,req.body.cijena,req.body.tagovi,
            req.cookies.login.username,stringKategorija, stringSlika],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }

            next();
        })
    },
    dajSpisakArtikala: function (req, res, next) {

        baza.pool.query(`select a.id as id, a.naziv as naziv, a.opis as opis, a.dostupna_kolicina as dostupna_kolicina,
                         a.cijena as cijena, a.tagovi as tagovi from artikal a
                         inner join trgovac t on t.id = a.id_trgovca
                         where t.username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.spisakArtikala = result.rows;
            next();
        })
    },
    dajArtikal: function (req, res, next) {
        baza.pool.query(`select * from artikal where id = $1`, [req.params.idArtikla],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.artikal = result.rows[0];
            /* provjerit treba li id u ovom queriju*/
            baza.pool.query(`select kategorije_artikla.kategorija as kategorija, kategorije_artikla.id as id from artikal a
                             inner join veza_artikla_i_kategorije vaik on vaik.id_artikla = a.id
                             inner join kategorije_artikla on kategorije_artikla.id = vaik.id_kategorije
                             where a.id = $1`, [req.params.idArtikla], (err, result) => {
                if(err) {
                    console.log(err);
                    return next();
                }
                req.kategorijeArtikla = result.rows;
                baza.pool.query(`select slike_artikla.fotografija as slika from artikal
                                 inner join slike_artikla on slike_artikla.id_artikla = artikal.id
                                 where artikal.id = $1`, [req.params.idArtikla], (err, result) => {
                    if(err) {
                        console.log(err);
                        return next();
                    }
                    req.slikeArtikla = result.rows;
                    console.log(req.slikeArtikla);
                    next();
                })
            })

        })
    },
    izbrisiArtikal:function (req, res, next) {
        baza.pool.query(`call izbrisi_artikal($1)`, [req.params.idArtikla],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    izbrisiSlikeArtikla: function (req, res, next) {
        console.log("usao");
        baza.pool.query(`select fotografija from slike_artikla where id_artikla = $1`, [req.params.idArtikla], (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            for(let i=0;i<result.rows.length;i++) {
                console.log("nestoo");
                console.log(result.rows[i]);
                const path = 'public/images/slikeArtikala/' + result.rows[i].fotografija;

                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }
            }
            next();
        })
    },
    izvrsiPromjenuNaArtiklu: function (req, res, next) {
        console.log(req.params.idArtikla);
        var sql = "update artikal set " + req.params.atribut + "=" + req.params.vrijednost + " where id =" + req.params.idArtikla;
        baza.pool.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    promijeniKategorijeArtikla: function (req, res, next) {
        //rijesit zasto samo jednu kategoriju uzme

        console.log(req.body);
        console.log(req.body.kategorijeArtikla);

        var stringKategorija = "";
        if(Array.isArray(req.body.kategorijeArtikla) === true) {
            for(let i=0; i<req.body.kategorijeArtikla.length-1; i++) {
                stringKategorija += req.body.kategorijeArtikla[i] + ",";
            }
            stringKategorija += req.body.kategorijeArtikla[req.body.kategorijeArtikla.length-1];
        }
        else stringKategorija = req.body.kategorijeArtikla;
        baza.pool.query(`call promijeni_kategorije_artikla($1,$2)`, [req.params.idArtikla, stringKategorija],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    dajKategorijeArtikla2: function (req, res, next) {
        baza.pool.query(`select * from kategorije_artikla`, (err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.cat = result.rows;
            console.log("ide");
            next();

        })

    },
    dodajArtikalNaNaslovnu: function (req, res, next) {
        baza.pool.query(`select dodaj_artikal_na_naslovnu($1,$2)`, [req.cookies.login.username, req.params.idArtikla],(err, result) => {
            console.log(result.rows);
            if(result.rows[0].dodaj_artikal_na_naslovnu === false) {
                console.log("usaoo");
                res.send("notok");
            }
            else next();
        })
    },
    ukloniArtikalSaNaslovne: function (req, res, next) {
        baza.pool.query(`update artikal set na_pocetnoj_profila = null where id = $1`,
            [req.params.idArtikla],(err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
            next();
        })
    },
    dajNaslovneArtikle: function (req, res, next) {
        baza.pool.query(`select a.id as id, a.naziv as naziv, a.opis as opis, a.dostupna_kolicina as dostupna_kolicina, a.cijena as cijena, a.naslovna_slika as naslovna_slika from artikal a 
inner join trgovac t on t.id = a.id_trgovca where t.username = $1 and na_pocetnoj_profila = 'da' order by a.id`,
            [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }

            req.naslovniArtikli = result.rows;
                console.log(req.naslovniArtikli);
            next();

        })
    },
    dajNarudzbe: function (req,res,next) {
        baza.pool.query(`select id from trgovac where username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            var idTrgovca = result.rows[0].id;
            baza.pool.query(`select k.username, k.email, n.id, n.status_narudzbe,
concat(extract(day from n.vrijeme_narudzbe), '.', extract(month from n.vrijeme_narudzbe), '.',extract(year from n.vrijeme_narudzbe))
as datum 
            from narudzbe n inner join kupac k on k.id = n.id_kupca where n.id_trgovca = cast($1 as int)`, [idTrgovca]  ,(err, result) => {
                if(err) {
                    console.log(err);
                    return next();
                }
                req.narudzbe = result.rows;
                console.log(req.narudzbe);

                next();
            })
        })
    },
    postaviStatusNarudzbe: function (req,res,next) {
        var status = null;
        if(req.params.status === 'Potvrdjeno')
            status = 'Potvrđeno';
        else if(req.params.status === 'Odbijeno')
            status = 'Odbijeno'
        else status = 'Isporučeno';
        baza.pool.query(`update narudzbe set status_narudzbe = $1 where id = cast($2 as int)`,
            [status, req.params.idNarudzbe], (err, res) => {
            if(err) {
                console.log(err);
                return next();
            }
                var mailOption = {
                    from: 'webshopbih@gmail.com',
                    to: req.params.emailKupca,
                    subject: 'WEB shop narudžba',
                    text: 'Status vaše narudžbe je promijenjen. Trenutni status naružbe:' + status
                }

                transporter.sendMail(mailOption, function (err,success) {
                    if(err) {
                        console.log("Email nije poslan!");
                    }
                    else {
                        console.log("Email uspješno poslan!");
                    }
                })



            next();
        })
    },
    dajNarudzbu: function (req,res,next) {
        baza.pool.query(`select a.naziv, a.id from detalji_narudzbe dn
                        inner join artikal a on a.id = dn.id_artikla
                        where dn.id_narudzbe = cast($1 as int)`, [req.params.idNarudzbe],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.narudzba = result.rows;
            console.log(req.narudzba);
            next();
        })
    }







}


router.get('/odjava', function (req,res,next) {
    res.clearCookie('login');
    res.redirect('/login');
})

router.get('/profil', db.dajPodatkeZaTrgovca, db.dajNaslovneArtikle, function(req, res, next) {

    res.render('profilTrgovca', {podaciTrgovca:req.podaciTrgovca, naslovniArtikli:req.naslovniArtikli});
});

router.get('/urediProfil', db.dajPodatkeZaTrgovca, function (req, res, next) {
   res.render('urediProfilTrgovac', {podaciTrgovca:req.podaciTrgovca});
});

router.get('/promijeniLozinku', db.dajPodatkeZaTrgovca, function (req, res, next) {
   res.render('promijeniLozinkuTrgovca',{podaciTrgovca:req.podaciTrgovca});
});

router.get('/dodajArtikal', db.dajKategorijeArtikla, db.dajPodatkeZaTrgovca, function (req, res, next) {
   res.render('dodajArtikal', {kategorijeArtikla:req.kategorijeArtikla, podaciTrgovca:req.podaciTrgovca});
});

router.get('/spisakArtikala', db.dajSpisakArtikala, db.dajPodatkeZaTrgovca,function (req, res, next) {
    res.render('spisakArtikala', {spisakArtikala:req.spisakArtikala,podaciTrgovca:req.podaciTrgovca});
});
//////////////
router.get('/pogledajArtikal/:idArtikla', db.dajArtikal, db.dajPodatkeZaTrgovca,function (req, res, next) {
   res.render('artikal', {artikal:req.artikal, kategorijeArtikla:req.kategorijeArtikla, slikeArtikla:req.slikeArtikla,
       podaciTrgovca:req.podaciTrgovca});
});


/////
router.get('/urediArtikal/:idArtikla', db.dajArtikal, db.dajKategorijeArtikla2, db.dajPodatkeZaTrgovca, function(req, res, next) {
   res.render('urediArtikal', {artikal:req.artikal, kategorijeArtikla:req.kategorijeArtikla,
       slikeArtikla:req.slikeArtikla, cat:req.cat, podaciTrgovca:req.podaciTrgovca});
});


router.get('/narudzbe', db.dajNarudzbe, function (req,res,next) {
   res.render('narudzbeTrgovac', {narudzbe:req.narudzbe});
});

router.get('/pogledajNarudzbu/:idNarudzbe', db.dajNarudzbu, function (req,res,next) {
   res.render('pogledajNarudzbuTrgovac', {narudzba:req.narudzba})
});


/*
router.get('/proba', db.dajPodatkeZaTrgovca,function (req,res,next) {
    console.log(req.podaciTrgovca);
   res.render('proba', {podaciTrgovca:req.podaciTrgovca});
});*/

router.post('/postaviStatusNarudzbe/:idNarudzbe/:status/:emailKupca', db.postaviStatusNarudzbe, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/izbrisiArtikal/:idArtikla', db.izbrisiSlikeArtikla, db.izbrisiArtikal, function(req, res, next) {
   res.sendStatus(200);
});

router.post('/unesiPromjenu',db.updateTrgovca, function (req, res, next) {
    res.sendStatus(200);
});
router.post('/promijeniProfilnuSlikuTrgovca',  upload.single('slika'), function (req, res, next) {
    res.sendStatus(200);
});


router.post('/unesinovuLozinku2/:stara/:nova/:potvrda', db.dajPodatkeZaTrgovca, db.promijeniLozinkuTrgovca2, function (req, res, next) {
    res.send("ok")
});

router.post('/dodajLokacijuPoslovnice/:lokacija', db.dodajLokacijuPoslovnice, function (req, res,next) {
    res.sendStatus(200);
});

router.post('/unesiArtikal', upload2.array('slike'), db.ubaciArtikal, function (req, res, next) {
   res.sendStatus(200);
});

router.post('/izvrsiPromjenuNaArtiklu/:idArtikla/:atribut/:vrijednost', db.izvrsiPromjenuNaArtiklu, function (req, res, next) {
    res.send("ok");
});

router.post('/promijeniKategorijeArtikla/:idArtikla', db.promijeniKategorijeArtikla, function (req, res, next) {
   res.send("Promjena izvrsena");
});

router.post('/dodajArtikalNaNaslovnu/:idArtikla', db.dodajArtikalNaNaslovnu, function (req, res, next) {
   res.send("ok");
});

router.post('/ukloniArtikalSaNaslovne/:idArtikla', db.ukloniArtikalSaNaslovne, function (req, res, next) {
    res.sendStatus(200);
});

router.post('/promijeniNaslovnuSlikuArtikla/:idArtikla', upload3.single('naslovnaSlika'), function (req, res, next) {
   res.sendStatus(200);
});

module.exports = router;
