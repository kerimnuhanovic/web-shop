var express = require('express');
var router = express.Router();
var baza = require('../helper/baza');
const kriptuj = require("../helper/kriptuj");
var komunikacija = [];
var io = null;

var db = {

    dajPorukeZaKupca: function (req,res,next) {
        baza.pool.query(`select c.id, c.id_kupca, c.poruka, c.id_trgovca, c.poruku_poslao, t.naziv as naziv_trgovca from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where k.username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.poruke = result.rows;
            next();

        })
    },
    dajSveKontaktiraneTrgovce: function (req,res,next) {
        baza.pool.query(`select distinct t.naziv as naziv_trgovca, t.username as username_trgovca, t.slika as slika_trgovca, t.id from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where k.username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.trgovci = result.rows;
            //console.log(req.trgovci);
            //console.log('evo me');
            next();
        })
    },
    dajTrgovcaZaChat: function (req,res,next) {
        baza.pool.query(`select naziv as naziv_trgovca,username as username_trgovca, slika as slika_trgovca, id as id_trgovca from trgovac
where lower(naziv) = $1`, [req.params.pretraga],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.trgovac = result.rows[0];
            //console.log(req.trgovac);
            next();
        })
    },
    dajPorukeZaTrgovca: function (req,res,next) {
        baza.pool.query(`select c.id, c.id_kupca, c.poruka, c.id_trgovca, c.poruku_poslao, k.username as naziv_kupca from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where t.username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.poruke = result.rows;
            //console.log(req.poruke);
            next();

        })
    },
    dajSveKontaktiraneKupce: function (req,res,next) {
        baza.pool.query(`select distinct k.username as naziv_kupca, k.profilna_slika as slika_kupca, k.id from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where t.username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kupci = result.rows;
            //console.log(req.kupci);
            next();
        })
    },
    dajKupcaZaChat: function (req,res,next) {
        baza.pool.query(`select username as naziv_kupca, profilna_slika as slika_kupca, id as id_kupca from kupac
where lower(username) = $1`, [req.params.pretraga],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.kupac = result.rows[0];
            //console.log(req.kupac);
            next();
        })
    },
    dajIdKupca: function (req,res,next) {
        baza.pool.query(`select id from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.idKupca = result.rows[0].id;
            next();
        })
    },
    dajIdTrgovca: function (req,res,next) {
        baza.pool.query(`select id, naziv from trgovac where username = $1`, [req.cookies.login.username],(err, result) => {
            if(err) {
                console.log(err);
                return next();
            }
            req.idTrgovca = result.rows[0].id;
            req.naziv_trgovca = result.rows[0].naziv;
            next();
        })
    }
}
var vrstaKorisnika = [];
router.get('/:korisnik', function (req,res,next) {
   komunikacija.push({username:req.cookies.login.username});
   vrstaKorisnika.push({vrsta: req.params.korisnik});
   /*console.log(komunikacija);*/
   if(!io) {
       io = require('socket.io')(req.connection.server);
       io.sockets.on('connection', function (client) {
           console.log('Konektovan');
           komunikacija[komunikacija.length-1].id = client.id;
           console.log(komunikacija);
           if(vrstaKorisnika[vrstaKorisnika.length-1].vrsta === 'kupac') {
               baza.pool.query(`select c.id, c.id_kupca, c.poruka, c.id_trgovca, c.poruku_poslao, t.naziv as naziv_trgovca from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where k.username = $1`, [komunikacija[komunikacija.length-1].username],(err, result) => {
                   if(err) {
                       console.log(err);
                   }
                   var poruke = result.rows;
                   console.log(komunikacija[komunikacija.length-1].username+"------");

                   baza.pool.query(`select distinct t.naziv as naziv_trgovca, t.username as username_trgovca, t.slika as slika_trgovca, t.id from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where k.username = $1`, [komunikacija[komunikacija.length-1].username],(err, result) => {
                       if(err) {
                           console.log(err);
                       }
                       var trgovci = result.rows;
                       io.to(client.id).emit('sve_poruke', poruke);
                       io.to(client.id).emit('kontaktirani_trgovci', trgovci);
                       /*io.emit('sve_poruke', poruke);
                       io.emit('kontaktirani_trgovci', trgovci);*/
                   })

               })
           }
           else if(vrstaKorisnika[vrstaKorisnika.length-1].vrsta === 'trgovac') {
               baza.pool.query(`select c.id, c.id_kupca, c.poruka, c.id_trgovca, c.poruku_poslao, k.username as naziv_kupca from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where t.username = $1`, [komunikacija[komunikacija.length-1].username],(err, result) => {
                   if(err) {
                       console.log(err);
                   }
                   var poruke = result.rows;

                   baza.pool.query(`select distinct k.username as naziv_kupca, k.profilna_slika as slika_kupca, k.id from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where t.username = $1`, [komunikacija[komunikacija.length-1].username],(err, result) => {
                     if(err) {
                         console.log(err);
                     }
                       var kupci = result.rows;
                       io.to(client.id).emit('sve_poruke', poruke);
                       io.to(client.id).emit('kontaktirani_kupci', kupci);
                       /*io.emit('sve_poruke', poruke);
                       io.emit('kontaktirani_kupci', kupci);*/
                   })
               })
           }


           client.on('disconnect', function () {
               console.log('disconnected event');
               for(let i = 0;i<komunikacija.length;i++) {

                   if(komunikacija[i].id === client.id) {
                       komunikacija.splice(i,1);
                       vrstaKorisnika.splice(i,1);/*provjerit ovo*/
                   }
               }
           })
           client.on('kupac_salje_poruku', function (d) {
               console.log(d);
               baza.pool.query(`call insertuj_poruku_kupac_trgovac($1,$2,$3,$4)`, [d.id_kupca,d.poruka,d.id_trgovca,'kupac'],(err, res) => {
                   if(err) {
                       console.log(err);
                   }
                   console.log(d);
                   d.poruku_poslao = 'kupac';
                   var trgovacID = undefined;
                   for(let i = 0;i<komunikacija.length;i++) {
                       if(komunikacija[i].username === d.username_trgovca)
                           trgovacID = komunikacija[i].id;
                   }
                   console.log(trgovacID);
                   io.to(client.id).emit('poruka_sa_servera', d);
                   if(trgovacID) {
                       console.log('postoji trgovac');
                       baza.pool.query(`select profilna_slika from kupac where username = $1`, [d.username_kupca],(err, result) => {
                           if(err) {
                               console.log(err);
                           }
                           d.slika_kupca = result.rows[0].profilna_slika;/*dio koji je dodan*/
                           io.to(trgovacID).emit('poruka_sa_servera_od_kupca', d);
                       })

                   }

               })
           })
           client.on('trgovac_salje_poruku', function (d) {
               console.log(d);
               baza.pool.query(`call insertuj_poruku_kupac_trgovac($1,$2,$3,$4)`, [d.id_kupca,d.poruka,d.id_trgovca,'trgovac'],(err, res) => {
                   if(err) {
                       console.log(err);
                   }
                   console.log(d);
                   d.poruku_poslao = 'trgovac';
                   var kupacID = undefined;
                   for(let i = 0;i<komunikacija.length;i++) {
                       console.log(komunikacija[i].username+"--"+d.username_kupca);
                       if(komunikacija[i].username === d.username_kupca)
                           kupacID = komunikacija[i].id;
                   }
                   console.log(kupacID);
                   io.to(client.id).emit('poruka_sa_servera', d);
                   if(kupacID) {
                       console.log('postoji kupac');
                       baza.pool.query(`select slika as profilna_slika from trgovac where username = $1`, [d.username_trgovca],(err, result) => {
                           if(err) {
                               console.log(err);
                           }
                           d.slika_trgovca = result.rows[0].profilna_slika;/*dio koji je dodan*/
                           io.to(kupacID).emit('poruka_sa_servera_od_trgovca', d);
                       })

                   }

               })


           })
       })

   }
   return next();
});

router.get('/kupac', db.dajPorukeZaKupca, db.dajSveKontaktiraneTrgovce, db.dajIdKupca, function (req,res,next) {

    res.render('chatKupac', {poruke:req.poruke, trgovci:req.trgovci, username:req.cookies.login.username, idKupca:req.idKupca});
});


router.get('/trgovac',db.dajPorukeZaTrgovca, db.dajSveKontaktiraneKupce,db.dajIdTrgovca,function (req,res,next) {
    /*poruke:req.poruke, trgovci:req.trgovci, username:req.cookies.login.username*/
    res.render('chatTrgovac',{poruke:req.poruke, kupci:req.kupci, username:req.cookies.login.username,
        idTrgovca:req.idTrgovca, naziv:req.naziv_trgovca});
});


router.get('/dajTrgovcaZaChat/:pretraga', db.dajTrgovcaZaChat, function (req,res,next) {
    res.send(req.trgovac);
});

router.get('/dajKupcaZaChat/:pretraga', db.dajKupcaZaChat, function (req,res,next) {
    res.send(req.kupac);
});
module.exports = router;
