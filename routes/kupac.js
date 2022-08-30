var express = require('express');
var router = express.Router();
var multer = require('multer');
var uuid = require('uuid').v4;
var baza = require('../helper/baza');
var kriptuj = require('../helper/kriptuj');
const nodemailer = require('nodemailer');
const fs = require('fs')


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
      cb(null, 'public/images/profilneSlike');
   },
   filename: (req, file, cb) => {
      console.log("USAO");
      const {originalname} = file;
      const novaSlika = `${uuid()}-${originalname}`;
      req.slika = novaSlika;
      baza.pool.query(`select profilna_slika from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         console.log(result.rows[0].profilna_slika);
         if (result.rows[0].profilna_slika) {
            const path = 'public/images/profilneSlike/' + result.rows[0].profilna_slika;
            try {
               fs.unlinkSync(path)
               //file removed
            } catch (err) {
               console.error(err)
            }
         }
         cb(null, novaSlika);
      })
   }

});

const upload = multer({storage:storage});

const storage2 = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'public/images/coverSlike');
   },
   filename: (req, file, cb) => {
      const {originalname} = file;
      const novaSlika = `${uuid()}-${originalname}`;
      req.slika = novaSlika;
      baza.pool.query(`select cover_slika from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         console.log(result.rows[0].cover_slika);
         if (result.rows[0].cover_slika) {
            const path = 'public/images/coverSlike/' + result.rows[0].cover_slika;
            try {
               fs.unlinkSync(path)
               //file removed
            } catch (err) {
               console.error(err)
            }
         }
         cb(null, novaSlika);
      })
   }
});

const upload2 = multer({storage:storage2});


var ukupnoArtikala1;

var ukupnoArtikalaZaTrgovca;
var ukupnoArtikalaZaTrgovcaPoPretrazi;
var db = {
   promijeniProfilnuSlikuKupcu: function (req, res, next) {
      console.log(req.slika);
      console.log(req.cookies.login.username);
      baza.pool.query(`update kupac set profilna_slika = $1 where username = $2`, [req.slika, req.cookies.login.username], (err, res) => {
         if (err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   promijeniCoverSlikuKupcu: function (req, res, next) {
      baza.pool.query(`update kupac set cover_slika = $1 where username = $2`, [req.slika, req.cookies.login.username], (err, res) => {
         if (err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   promijeniLozinkuKupca: function (req, res, next) {
      console.log("evo mmeeee");
      console.log(req.params.staraSifra);
      req.params.staraSifra = kriptuj.kriptuj.kriptujKupca(req.params.staraSifra);
      req.params.novaSifra = kriptuj.kriptuj.kriptujKupca(req.params.novaSifra);

      baza.pool.query(`select promijeni_lozinku_kupca($3, $1, $2)`,
          [req.params.staraSifra, req.params.novaSifra, req.cookies.login.username], (err, result) => {

             if (result.rows[0].promijeni_lozinku_kupca === false) {
                console.log(err);
                res.send("notok");
             } else next();
          })
   },
   dajSlucajneArtikle: function (req, res, next) {
      //izmjenu uradit zbog promjene u tabeli statistika_artikala
      var slucajniBrojevi = [];
      var brojArtikala;
      baza.pool.query(`select broj from statistika_artikala where kategorija='ukupno'`, (err, result) => {
         brojArtikala = result.rows[0].broj;
         for (let i = 0; i < 15; i++) {
            let broj = Math.floor(Math.random() * brojArtikala) + 1;
            if (slucajniBrojevi.includes(broj)) {
               i = i - 1;
            } else {
               slucajniBrojevi.push(broj + 66);
            }
         }
         slucajniBrojevi = slucajniBrojevi.toString();
         /*console.log(typeof slucajniBrojevi[0]);
         console.log(slucajniBrojevi);*/
         baza.pool.query('select * from artikal where id in (' + slucajniBrojevi + ')', (err, result) => {
            if (err) {
               console.log(err);
               return next();
            }
            //console.log(result.rows);
            req.slucajniArtikli = result.rows;
            next();
         })
      })
   },
   dajSlucajneArtikle2: function (req,res,next) {
      baza.pool.query(`select * from artikal order by random() limit 10`, (err, result) => {
         if(err) {
            console.log(err);

         }
         req.slucajniArtikli = result.rows;
         next();
      })
   },
   dajNajpopularnijeArtikle: function (req,res,next) {
      baza.pool.query(`select count(*), a.naziv,a.id,a.opis,a.dostupna_kolicina,a.cijena,a.id_trgovca,a.naslovna_slika from detalji_narudzbe
inner join artikal a on a.id = detalji_narudzbe.id_artikla
group by a.naziv,a.id, a.naziv, a.opis, a.dostupna_kolicina, a.cijena, a.id_trgovca, a.naslovna_slika order by count desc limit 10;`, (err, result) => {
         if(err) {
            console.log(err);
         }
         req.najpopularnijiArtikli = result.rows;
         next();

      })
   },
   dajTrgovce: function (req, res, next) {
      req.trgovci = {
         prethodni: 0,
         trenutni: [],
         sljedeci: 0,
         ukupnoTrgovaca: 0
      };
      if (!req.params.redniBrojStranice) {
         req.params.redniBrojStranice = 1;
      }

      req.filterKategorije = req.params.filterKategorije;
      var pocetak = (parseInt(req.params.redniBrojStranice) - 1) * 15;
      var sql1 = "";
      if (req.params.filterKategorije && req.params.filterKategorije !== 'naziv') {
         req.params.filterKategorije = "'" + req.params.filterKategorije + "'";
         sql1 = 'select broj from statistika_trgovaca where kategorija = ' + req.params.filterKategorije;
      } else {
         sql1 = "select broj from statistika_trgovaca where kategorija = 'ukupno'";
      }

      baza.pool.query(sql1, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }

         var ukupnoTrgovaca = result.rows[0].broj;

         if (pocetak > ukupnoTrgovaca)
            res.sendStatus(404);
         else {
            baza.pool.query(`select * from kategorije_trgovca`, (err, result) => {
               if (err) {
                  console.log(err);
                  return next();
               }
               req.kategorijeTrgovca = result.rows;
               var sql = "";
               if (req.params.filterKategorije && req.params.filterKategorije !== 'naziv') {

                  console.log(req.params.filterKategorije);
                  sql = 'select t.id, t.naziv, t.telefon, t.email, t.adresa_sjedista, t.slika from kategorije_trgovca kt ' +
                      'inner join veza_trgovca_i_kategorije vaik on kt.id = vaik.id_kategorije ' +
                      'inner join trgovac t on t.id = vaik.id_trgovca ' +
                      'where kt.kategorija = ' + req.params.filterKategorije + ' order by naziv ' + 'offset ' + pocetak +
                      ' limit 15';
               } else {
                  sql = 'select id, naziv, telefon, email, adresa_sjedista, slika from trgovac order by naziv offset ' + pocetak +
                      ' limit 15';
               }
               baza.pool.query(sql, (err, result) => {
                  if (err) {
                     console.log(err);

                     return next();
                  }
                  req.trgovci.trenutni = result.rows;
                  req.trgovci.prethodni = parseInt(req.params.redniBrojStranice) - 1;
                  req.trgovci.sljedeci = parseInt(req.params.redniBrojStranice) + 1;
                  console.log(req.params.redniBrojStranice + 1);
                  req.trgovci.ukupnoTrgovaca = ukupnoTrgovaca;
                  req.pocetak = pocetak;
                  console.log(req.trgovci);
                  next();
               })

            })

         }

      })
   },
   dajTrgovcePoPretrazi: function (req, res, next) {
      var pretraga = "";
      var stranica = "";
      if (req.body.search) {
         pretraga = req.body.search;
         stranica = 1;
      } else {
         pretraga = req.params.pretraga;
         stranica = req.params.stranica;
      }
      req.trgovci = {
         prethodni: 0,
         trenutni: [],
         sljedeci: 0,
      };
      var pocetak = (stranica - 1) * 15;
      req.trgovci.prethodni = parseInt(stranica) - 1;
      req.trgovci.sljedeci = parseInt(stranica) + 1;
      req.pretraga = pretraga;
      console.log(pocetak);
      var sql = "select * from trgovac where lower('%" + pretraga + "%') like concat('%',lower(naziv),'%')" +
          " or lower(naziv) like lower('%" + pretraga + "%') offset " + pocetak;
      console.log(sql);
      baza.pool.query(sql, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.trgovci.trenutni = result.rows;
         req.pocetak = pocetak;
         baza.pool.query(`select * from kategorije_trgovca`, (err, result) => {
            if (err) {
               console.log(err);
               return next();
            }
            req.kategorijeTrgovca = result.rows;
            req.pocetak = pocetak;
            next();
         })

      })
   },
   dajKategorijeArtikala: function (req, res, next) {
      baza.pool.query(`select * from kategorije_artikla`, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.kategorijeArtikla = result.rows;
         next();
      })
   },
   dajArtikle: function (req, res, next) {
      var kategorija = req.params.kategorija;
      var stranica = req.params.stranica;
      //
      var sortKriterij = req.params.sort ? req.params.sort : 'naziv';
      if(sortKriterij === 'cijenaR')
         sortKriterij = 'cijena'
      else if(sortKriterij === 'cijenaO')
         sortKriterij = 'cijena desc';
      req.artikli = {
         prethodni: "",
         trenutni: [],
         sljedeci: "",
         ukupnoArtikala: "",
      };
      var pocetak = (stranica - 1) * 15;
      baza.pool.query(`select broj from statistika_artikala where id_kategorije = cast($1 as int)`, [kategorija], (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.artikli.ukupnoArtikala = result.rows[0].broj;
         var sql = "select a.id as id, a.naziv as naziv,a.opis as opis,a.dostupna_kolicina as dostupna_kolicina,"+
            "a.cijena as cijena,a.naslovna_slika as naslovna_slika "+
         "from veza_artikla_i_kategorije vaik inner join artikal a on a.id = vaik.id_artikla where vaik.id_kategorije = " +
             kategorija + " order by " + sortKriterij + " offset " + pocetak +  " limit 15";
         console.log(sql);
         baza.pool.query(sql, (err, result) => {
                if (err) {
                   console.log(err);
                   return next();
                }
                req.artikli.trenutni = result.rows;
                req.artikli.prethodni = parseInt(stranica) - 1;
                req.artikli.sljedeci = parseInt(stranica) + 1;
                req.pocetak = pocetak;
                console.log(req.pocetak+"----------");
                req.kategorija = kategorija;
                req.sortKriterij = sortKriterij;
                next();
             })
      })
   },
   dajArtiklePoPretrazi: function (req, res, next) {
      var pretraga = "";
      var stranica = "";
      var sortKriterij = req.params.sort ? req.params.sort : 'naziv';
      if(sortKriterij === 'cijenaR')
         sortKriterij = 'cijena';
      else if(sortKriterij === 'cijenaO')
         sortKriterij = 'cijena desc';
      if (req.body.search) {
         pretraga = req.body.search;
         stranica = 1;
      } else {
         pretraga = req.params.pretraga;
         stranica = req.params.stranica;
      }
      req.artikli = {
         prethodni: "",
         trenutni: [],
         sljedeci: "",
         artikalaNaStranici: ""
      };
      var pocetak = (stranica - 1) * 15;
      var sql = "select id,naziv,opis,dostupna_kolicina,cijena,naslovna_slika from artikal where lower('%" + pretraga + "%') like concat('%',lower(naziv),'%')" +
          " or lower(naziv) like lower('%" + pretraga + "%') order by " + sortKriterij + " offset " + pocetak;
      baza.pool.query(sql, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.artikli.trenutni = result.rows;
         req.artikli.prethodni = parseInt(stranica) - 1;
         req.artikli.sljedeci = parseInt(stranica) + 1;
         req.pocetak = pocetak;
         req.pretraga = pretraga;
         req.artikli.artikalaNaStranici = req.artikli.trenutni.length;
         if (pocetak === 0) {
            ukupnoArtikala = req.artikli.trenutni.length;
         }
         req.ukupnoArtikala = ukupnoArtikala;
         req.sortKriterij = sortKriterij;
         console.log(req.artikli);
         next();
      })
   },
   dajArtikal: function (req, res, next) {
      baza.pool.query(`select * from artikal where id = $1`, [req.params.idArtikla], (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.artikal = result.rows[0];
         /* provjerit treba li id u ovom queriju*/
         baza.pool.query(`select kategorije_artikla.kategorija as kategorija, kategorije_artikla.id as id from artikal a
                             inner join veza_artikla_i_kategorije vaik on vaik.id_artikla = a.id
                             inner join kategorije_artikla on kategorije_artikla.id = vaik.id_kategorije
                             where a.id = $1`, [req.params.idArtikla], (err, result) => {
            if (err) {
               console.log(err);
               return next();
            }
            req.kategorijeArtikla = result.rows;
            baza.pool.query(`select slike_artikla.fotografija as slika from artikal
                                 inner join slike_artikla on slike_artikla.id_artikla = artikal.id
                                 where artikal.id = $1`, [req.params.idArtikla], (err, result) => {
               if (err) {
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
   dajNaslovneArtikle: function (req, res, next) {
      baza.pool.query(`select a.id as id, a.naziv as naziv, a.opis as opis, a.dostupna_kolicina as dostupna_kolicina, a.cijena as cijena,
 a.naslovna_slika as naslovna_slika from artikal a 
inner join trgovac t on t.id = a.id_trgovca where t.id = cast($1 as int) and na_pocetnoj_profila = 'da' order by a.id`,
          [req.params.idTrgovca], (err, result) => {
             if (err) {
                console.log(err);
                return next();
             }

             req.naslovniArtikli = result.rows;
             console.log(req.naslovniArtikli);
             next();

          })
   },
   dajPodatkeZaTrgovca: function (req, res, next) {

      var id = req.params.idTrgovca;
      baza.pool.query(`select * from trgovac where id = cast($1 as int)`, [id], (err, result) => {
         req.podaciTrgovca = result.rows[0];
         console.log(req.podaciTrgovca);
         next();
      })
   },
   dajArtikleTrgovca: function (req, res, next) {
      //nema kategorije, izlistavamo sve,
      var sql = undefined;
      var sortKriterij = req.params.sort ? req.params.sort : 'naziv';
      if(sortKriterij === 'cijenaR')
         sortKriterij = 'cijena'
      else if(sortKriterij === 'cijenaO')
         sortKriterij = 'cijena desc';
      var stranica = req.params.stranica ? req.params.stranica : 1;
      var pocetak = (stranica - 1) * 15;
      req.artikliTrgovca = {
         prethodni: undefined,
         trenutni: [],
         sljedeci: undefined,
         ukupnoArtikala: undefined,
         kategorija: req.params.kategorija,
         pocetak: pocetak,
         id_trgovca: req.params.idTrgovca
      }
      console.log(req.params.kategorija);
      if (req.params.kategorija === 'sviArtikli') {
         console.log("usao");
         if (pocetak !== 0) {
            sql = "select a.id as id_artikla, a.naziv as naziv, a.opis as opis," +
                " a.dostupna_kolicina as dostupna_kolicina, " +
                "a.cijena as cijena, a.id_trgovca as id_trgovca, a.naslovna_slika as naslovna_slika from " +
                "artikal a where id_trgovca = " + req.params.idTrgovca + " order by "+ sortKriterij +" offset " + pocetak +
                " limit 15";
         } else {
            sql = "select a.id as id_artikla, a.naziv as naziv, a.opis as opis," +
                " a.dostupna_kolicina as dostupna_kolicina, " +
                "a.cijena as cijena, a.id_trgovca as id_trgovca, a.naslovna_slika as naslovna_slika from " +
                "artikal a where id_trgovca = " + req.params.idTrgovca + " order by "+sortKriterij+ " offset " + pocetak;

         }
      } else {
         //dodat order by
         console.log("evo me");
         if (pocetak !== 0) {
            sql = "select a.id as id_artikla, a.naziv as naziv, a.opis as opis, a.dostupna_kolicina as dostupna_kolicina," +
                "a.cijena as cijena, a.id_trgovca as id_trgovca, a.naslovna_slika as naslovna_slika, vaik.id_kategorije as id_kategorije " +
                "from artikal a inner join veza_artikla_i_kategorije vaik on vaik.id_artikla = a.id " +
                "where id_trgovca = " + req.params.idTrgovca + " and vaik.id_kategorije = " + req.params.kategorija +
                " order by "+sortKriterij+" offset " + pocetak + " limit 15";
         } else {
            sql = "select a.id as id_artikla, a.naziv as naziv, a.opis as opis, a.dostupna_kolicina as dostupna_kolicina," +
                "a.cijena as cijena, a.id_trgovca as id_trgovca, a.naslovna_slika as naslovna_slika, vaik.id_kategorije as id_kategorije " +
                "from artikal a inner join veza_artikla_i_kategorije vaik on vaik.id_artikla = a.id " +
                "where id_trgovca = " + req.params.idTrgovca + " and vaik.id_kategorije = " + req.params.kategorija +
                " order by "+ sortKriterij+ " offset " + pocetak;

         }
      }
      baza.pool.query(sql, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         req.artikliTrgovca.trenutni = result.rows;
         req.artikliTrgovca.prethodni = parseInt(stranica) - 1;
         req.artikliTrgovca.sljedeci = parseInt(stranica) + 1;
         if (pocetak === 0) {
            ukupnoArtikalaZaTrgovca = req.artikliTrgovca.trenutni.length;
         }
         console.log(ukupnoArtikalaZaTrgovca);
         req.ukupnoArtikala = ukupnoArtikalaZaTrgovca;
         console.log(req.artikliTrgovca);
         req.sortKriterij = sortKriterij;
         baza.pool.query(`select * from trgovac where id = cast($1 as int)`, [req.params.idTrgovca], (err, result) => {
            req.nazivTrgovca = result.rows[0].naziv;
            next();
         })


      })
   },
   dajArtikleTrgovcaPoPretrazi: function (req, res, next) {
      var pretraga = "";
      var stranica = "";
      var sortKriterij = req.params.sort ? req.params.sort : 'naziv';
      if(sortKriterij === 'cijenaR')
         sortKriterij = 'cijena'
      else if(sortKriterij === 'cijenaO')
         sortKriterij = 'cijena desc';
      console.log(req.body.search);
      if (req.body.search) {
         pretraga = req.body.search;
         stranica = 1;
      } else {
         pretraga = req.params.pretraga;
         stranica = req.params.stranica;
      }

      var pocetak = (stranica - 1) * 15;
      req.artikliTrgovca = {
         prethodni: undefined,
         trenutni: [],
         sljedeci: undefined,
         ukupnoArtikala: undefined,
         pocetak: pocetak,
         pretraga: pretraga,
         id_trgovca: req.params.idTrgovca
      }
      if(pocetak === 0) {
         var sql = "select id as id_artikla,naziv,opis,dostupna_kolicina,cijena,naslovna_slika from artikal where id_trgovca = " + req.params.idTrgovca +
             " and (lower('%" + pretraga + "%') like concat('%',lower(naziv),'%')" +
             " or lower(naziv) like lower('%" + pretraga + "%')) order by "+sortKriterij+ " offset " + pocetak;
      }
      else {
         var sql = "select id as id_artikla,naziv,opis,dostupna_kolicina,cijena,naslovna_slika from artikal where id_trgovca = " + req.params.idTrgovca +
             " and (lower('%" + pretraga + "%') like concat('%',lower(naziv),'%')" +
             " or lower(naziv) like lower('%" + pretraga + "%')) order by "+ sortKriterij+ " offset " + pocetak + " limit 15";
      }
      baza.pool.query(sql, (err, result) => {
         if (err) {
            console.log(err);
            return next();
         }
         console.log(result.rows);
         req.artikliTrgovca.trenutni = result.rows;
         req.artikliTrgovca.prethodni = parseInt(stranica) - 1;
         req.artikliTrgovca.sljedeci = parseInt(stranica) + 1;
         req.sortKriterij = sortKriterij;
         console.log(req.artikliTrgovca.pretraga);
         if (pocetak === 0) {
            ukupnoArtikalaZaTrgovcaPoPretrazi = req.artikliTrgovca.trenutni.length;
         }
         req.ukupnoArtikala = ukupnoArtikalaZaTrgovcaPoPretrazi;

         baza.pool.query(`select naziv from trgovac where id = cast($1 as int)`, [req.params.idTrgovca], (err, result) => {
            if (err) {
               console.log(err);
               return next();
            }
            req.nazivTrgovca = result.rows[0].naziv;
            next();
         })
      })
   },
   dajUtiskeKupaca: function (req,res, next) {
      baza.pool.query(`select k.id as id_komentara, concat(kupac.ime, ' ', kupac.prezime) as ime_kupca,
        kupac.profilna_slika as profilna_slika,k.komentar as komentar, k.id_trgovca as id_trgovca
        from komentari k inner join kupac on kupac.id = k.id_kupca where k.id_trgovca = $1`, [req.params.idTrgovca],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         req.komentari = result.rows;
         next();
      })
   },
   dajPodatkeKupca: function (req,res,next) {
      console.log(req.cookies.login.username);
      baza.pool.query(`select id, concat(ime, ' ', prezime) as ime_kupca,username,profilna_slika from kupac where username = $1`,
          [req.cookies.login.username],(err, result) => {
            if(err) {
               console.log(err);
               return next();
            }
            req.kupac = result.rows[0];
            console.log(req.kupac);
            next();
      })
   },
   unesiKomentar: function (req,res,next) {
      baza.pool.query(`insert into komentari(id_kupca, komentar, id_trgovca) values ($1,$2,$3)`,
          [req.params.idKupca,req.params.komentar,req.params.idTrgovca],(err, res) => {
         if(err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   unesiOcjenuZaTrgovca: function (req,res,next) {
      baza.pool.query(`insert into ocjene_trgovaca(ocjena, id_trgovca)  values ($1,$2)`, [req.params.ocjena, req.params.idTrgovca],
          (err, res) => {
         if(err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   ocijeniArtikal: function (req,res,next) {
      baza.pool.query(`update ocjena_artikla set suma = suma + cast($1 as int), broj_ocjena = broj_ocjena+1
                       where id_artikla = cast($2 as int)`, [req.params.ocjena, req.params.idArtikla],(err, res) => {
         if(err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   dodajUKorpu: function (req,res,next) {
      baza.pool.query(`select id from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         var idKupca = result.rows[0].id;
         var idTrgovca = req.params.idTrgovca;
         var idArtikla = req.params.idArtikla;
         baza.pool.query(`insert into korpa(id_kupca,id_trgovca,id_artikla)
                          values (cast($1 as int),cast($2 as int),cast($3 as int))`,[idKupca,idTrgovca,idArtikla], (err, result) => {
            if(err) {
               console.log(err);
               return next();
            }
            next();
         })
      })
   },
   dajArtikleIzKorpe: function (req,res,next) {
      baza.pool.query(`select id from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         var idKupca = result.rows[0].id;
         baza.pool.query(`select korpa.id as id_dijela_korpe,a.naziv as naziv, a.id_trgovca, korpa.id_artikla from korpa
                            inner join artikal a on a.id = korpa.id_artikla
                            where id_kupca = cast($1 as int)`,[idKupca], (err, result) => {
            if(err) {
               console.log(err);
               return next();
            }
            req.artikli = result.rows;
            console.log(req.artikli);
            next();
         })
      })
   },
   izbaciArtikalIzKorpe: function (req,res,next) {
      baza.pool.query(`delete from korpa where id = cast ($1 as int)`, [req.params.idZaBrisanje],(err, res) => {
         if(err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
   posaljiNarudzbu: function (req,res,next) {
      baza.pool.query(`select id, email from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         var idKupca = result.rows[0].id;
         var mailKupca = result.rows[0].email;
         baza.pool.query(`select id_artikla, id_trgovca from korpa where id_kupca = cast($1 as int) order by id_trgovca`, [idKupca],(err, result) => {
            if(err) {
               console.log(err);
               return next();
            }
            console.log(result.rows);
            var artikli_i_trgovci = [];
            var indeks = 0;
            for(let i = 0;i<result.rows.length; i++) {
               if(i === 0) {
                  artikli_i_trgovci.push([result.rows[i].id_trgovca, result.rows[i].id_artikla]);
               }
               else {
                  if(result.rows[i].id_trgovca === result.rows[i-1].id_trgovca) {
                     artikli_i_trgovci[indeks].push(result.rows[i].id_artikla);
                  }
                  else {
                     artikli_i_trgovci.push([result.rows[i].id_trgovca, result.rows[i].id_artikla]);
                     indeks += 1;
                  }
               }
            }
            console.log(artikli_i_trgovci);
            var string_artikala_i_trgovaca = "";
            for(let i = 0;i<artikli_i_trgovci.length;i++) {
               for(let j = 0; j < artikli_i_trgovci[i].length-1; j++) {
                  string_artikala_i_trgovaca += artikli_i_trgovci[i][j] + ",";
               }
               if(i !== artikli_i_trgovci.length-1) {
                  string_artikala_i_trgovaca += artikli_i_trgovci[i][artikli_i_trgovci[i].length-1] + "-";
               }
               else {
                  string_artikala_i_trgovaca += artikli_i_trgovci[i][artikli_i_trgovci[i].length-1];
               }
            }
            console.log(string_artikala_i_trgovaca);
            baza.pool.query(`call napravi_narudzbu($1,$2)`, [idKupca, string_artikala_i_trgovaca],(err, result) => {
               if(err) {
                  console.log(err);
                  return next();
               }
               var mailOption = {
                  from: 'webshopbih@gmail.com',
                  to: mailKupca,
                  subject: 'WEB shop narudžba',
                  text: 'Uspješno ste poslali narudžbu. Nakon što narudžba bude obrađena, ponovo ćete dobiti email sa informacijom o statusu narudžbe.'
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
         })

      })
   },
   dajNarudzbe: function (req,res,next) {
      baza.pool.query(`select id from kupac where username = $1`, [req.cookies.login.username],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         var idKupca = result.rows[0].id;

         baza.pool.query(`select id,id_kupca,id_trgovca,status_narudzbe, vrijeme_narudzbe
from narudzbe where id_kupca = cast($1 as int)`, [idKupca],(err, result) => {
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
   dajNarudzbu: function (req,res,next) {
      baza.pool.query(`select dn.id_narudzbe, a.id, a.naziv from detalji_narudzbe dn
                    inner join artikal a on a.id = dn.id_artikla 
where id_narudzbe = cast($1 as int)`, [req.params.idNarudzbe],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         req.narudzba = result.rows;
         console.log(req.narudzba);
         next();
      })
   },
   otkaziNarudzbu: function (req,res,next) {
      baza.pool.query(`call otkazi_narudzbu(cast($1 as int))`, [req.params.idNarudzbe],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         next();
      })
   },
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
         console.log(req.poruke);
         next();

      })
   },
   dajSveKontaktiraneTrgovce: function (req,res,next) {
      baza.pool.query(`select distinct t.naziv as naziv_trgovca, t.slika as slika_trgovca, t.id from chat_kupac_trgovac c
                        inner join kupac k on k.id = c.id_kupca
                        inner join trgovac t on t.id = c.id_trgovca
                        where k.username = $1`, [req.cookies.login.username],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         req.trgovci = result.rows;
         console.log(req.trgovci);
         next();
      })
   },
   dajTrgovcaZaChat: function (req,res,next) {
      baza.pool.query(`select naziv as naziv_trgovca, slika as slika_trgovca, id as id_trgovca from trgovac
where lower(naziv) = $1`, [req.params.pretraga],(err, result) => {
         if(err) {
            console.log(err);
            return next();
         }
         req.trgovac = result.rows[0];
         console.log(req.trgovac);
         next();
      })
   },


}


/*naslovna,trgovci, narudzbe-dropdown, uredi profil*/

/* GET home page. */

router.get('/odjava', function (req,res,next) {
   res.clearCookie('login');
   res.redirect('/login');
});


router.get('/naslovna', db.dajSlucajneArtikle2, db.dajKategorijeArtikala, db.dajNajpopularnijeArtikle, function (req, res, next) {
   console.log(req.cookies.login.username);
   res.render('naslovna', {slucajniArtikli:req.slucajniArtikli, kategorijeArtikla:req.kategorijeArtikla,
   najpopularnijiArtikli:req.najpopularnijiArtikli});
});

router.get('/urediProfilKupca', function(req,res,next) {
   res.render('urediProfilKupca');
});

router.get('/pregledTrgovaca/:filterKategorije?/:redniBrojStranice?', db.dajTrgovce, function (req, res, next) {
   res.render('pregledTrgovaca', {trgovci:req.trgovci, pocetak:req.pocetak, kategorijeTrgovca :req.kategorijeTrgovca,
      kategorija:req.filterKategorije});
});


router.get('/pregledTrgovacaPoPretrazi/:pretraga/:stranica', db.dajTrgovcePoPretrazi, function (req, res, next) {
   res.render('pregledTrgovacaPoPretrazi', {trgovci:req.trgovci, pocetak:req.pocetak,kategorijeTrgovca :req.kategorijeTrgovca,
      pretraga:req.pretraga})
});


router.get('/pregledArtikala/:kategorija/:stranica/:sort?', db.dajArtikle, db.dajKategorijeArtikala,function (req, res, next) {
   res.render('pregledArtikalaPoKategoriji', {artikli:req.artikli, pocetak:req.pocetak,kategorija:req.kategorija,
   kategorijeArtikla:req.kategorijeArtikla,sortKriterij:req.sortKriterij});
});

router.get('/pregledArtikalaPoPretrazi/:pretraga/:stranica/:sort?', db.dajArtiklePoPretrazi, db.dajKategorijeArtikala, function (req, res, next) {
   res.render('pregledArtikalaPoPretrazi', {artikli:req.artikli,pretraga:req.pretraga,pocetak:req.pocetak,kategorijeArtikla:
      req.kategorijeArtikla,ukupnoArtikala:req.ukupnoArtikala,sortKriterij:req.sortKriterij});
});

router.get('/pogledajArtikal/:idArtikla', db.dajArtikal,function (req, res, next) {
   res.render('artikalKupac', {artikal:req.artikal, kategorijeArtikla:req.kategorijeArtikla, slikeArtikla:req.slikeArtikla});
});

router.get('/pogledajTrgovca/:idTrgovca', db.dajNaslovneArtikle, db.dajPodatkeZaTrgovca, function (req,res,next) {
   res.render('pogledajProfilTrgovca', {naslovniArtikli:req.naslovniArtikli,podaciTrgovca:req.podaciTrgovca});
});

router.get('/pogledajKatalogTrgovca/:idTrgovca/:kategorija?/:stranica?/:sort?', db.dajArtikleTrgovca, db.dajKategorijeArtikala, function (req, res, next) {
   res.render('pogledajKatalogTrgovca', {ukupnoArtikala:req.ukupnoArtikala, artikliTrgovca:req.artikliTrgovca,
   kategorijeArtikla:req.kategorijeArtikla, nazivTrgovca:req.nazivTrgovca,sortKriterij:req.sortKriterij});
});

router.get('/pregledArtikalaTrgovcaPoPretrazi/:idTrgovca/:pretraga/:stranica/:sort?',db.dajArtikleTrgovcaPoPretrazi ,db.dajKategorijeArtikala, function (req,res,next) {
   res.render('pregledArtikalaTrgovcaPoPretrazi', {kategorijeArtikla:req.kategorijeArtikla,artikliTrgovca:req.artikliTrgovca,
      ukupnoArtikala:req.ukupnoArtikala, nazivTrgovca:req.nazivTrgovca, sortKriterij:req.sortKriterij});
});

router.get('/utisciKupaca/:idTrgovca', db.dajUtiskeKupaca, db.dajPodatkeZaTrgovca, db.dajPodatkeKupca,function (req,res,next) {
   res.render('utisciKupaca', {podaciTrgovca:req.podaciTrgovca,komentari:req.komentari, kupac:req.kupac});
});

router.get('/prikaziKorpu', db.dajArtikleIzKorpe, function (req,res,next) {
   res.render('korpa', {artikli:req.artikli});
});

router.get('/prikaziNarudzbe', db.dajNarudzbe, function (req,res,next) {
   res.render('narudzbe', {narudzbe:req.narudzbe});
});

router.get('/narudzba/:idNarudzbe', db.dajNarudzbu, function (req,res,next) {
   res.render('narudzba', {narudzba:req.narudzba});
});


router.post('/otkaziNarudzbu/:idNarudzbe', db.otkaziNarudzbu, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/posaljiNarudzbu', db.posaljiNarudzbu, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/dodajUKorpu/:idTrgovca/:idArtikla', db.dodajUKorpu, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/izbaciArtikalIzKorpe/:idZaBrisanje',  db.izbaciArtikalIzKorpe,function (req,res,next) {
   res.sendStatus(200);
});

router.post('/ocijeniArtikal/:idArtikla/:ocjena', db.ocijeniArtikal, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/unesiOcjenu/:idTrgovca/:ocjena', db.unesiOcjenuZaTrgovca, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/unesiKomentar/:idKupca/:komentar/:idTrgovca', db.unesiKomentar, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/pregledArtikalaTrgovcaPoPretrazi/:idTrgovca',db.dajArtikleTrgovcaPoPretrazi ,db.dajKategorijeArtikala, function (req,res,next) {
   res.render('pregledArtikalaTrgovcaPoPretrazi', {kategorijeArtikla:req.kategorijeArtikla,artikliTrgovca:req.artikliTrgovca,
      ukupnoArtikala:req.ukupnoArtikala, nazivTrgovca:req.nazivTrgovca,sortKriterij:req.sortKriterij});
});



router.post('/pregledArtikalaPoPretrazi', db.dajArtiklePoPretrazi, db.dajKategorijeArtikala, function (req, res, next) {
   res.render('pregledArtikalaPoPretrazi', {artikli:req.artikli,pretraga:req.pretraga,pocetak:req.pocetak,kategorijeArtikla:
   req.kategorijeArtikla,sortKriterij:req.sortKriterij});
});

router.post('/pregledTrgovacaPoPretrazi', db.dajTrgovcePoPretrazi, function (req, res, next) {
   res.render('pregledTrgovacaPoPretrazi', {trgovci:req.trgovci, pocetak:req.pocetak,kategorijeTrgovca :req.kategorijeTrgovca,
   pretraga:req.pretraga})
});


router.post('/promijeniSlikuProfila',upload.single('profilna'), db.promijeniProfilnuSlikuKupcu, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/promijeniCoverSliku', upload2.single('cover'), db.promijeniCoverSlikuKupcu, function (req,res,next) {
   res.sendStatus(200);
});

router.post('/promijeniLozinkuKupca/:staraSifra/:novaSifra', db.promijeniLozinkuKupca, function (req, res, next) {
   res.send("ok");
});



module.exports = router;
