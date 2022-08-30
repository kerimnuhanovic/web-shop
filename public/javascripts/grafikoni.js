function prikaziGrafikone(trgovci, kupci, statistikaArt, statistikaTrg,
                          brojNarudzbiPoStatusu, najprodavanijiArtikli,
                          najprodavanijeKategorije) {
    console.log(statistikaArt);
    statistikaArt = JSON.parse(statistikaArt);
    statistikaTrg = JSON.parse(statistikaTrg);
    brojNarudzbiPoStatusu = JSON.parse(brojNarudzbiPoStatusu);
    najprodavanijiArtikli = JSON.parse(najprodavanijiArtikli);

    najprodavanijeKategorije = JSON.parse(najprodavanijeKategorije);
    var xValues = ["Trgovci", "Kupci"];
    var yValues = [trgovci, kupci];
    var barColors = [
        "#b91d47",
        "#00aba9",

    ];

    new Chart("prviGrafikon", {
        type: "pie",
        data: {
            labels: xValues,
            datasets: [{
                backgroundColor: barColors,
                data: yValues
            }]
        },
        options: {
            title: {
                display: true,
                text: "Broj korisnika"
            }
        }
    });



    var xValues2 = [];

    var yValues2 = [];
    var barColors2 = ['#f79a05','#91f505', '#0589f5', '#f505a5', '#e9f505'];
    for(let i = 0;i<5;i++) {
        xValues2.push(statistikaArt[i].kategorija);
        console.log(statistikaArt[i].broj);
        yValues2.push(parseInt(statistikaArt[i].broj));

    }



    new Chart("drugiGrafikon", {
        type: "bar",
        data: {
            labels: xValues2,
            datasets: [{
                backgroundColor: barColors2,
                data: yValues2
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Kategorije sa najvise artikala"
            }
        }
    });




    var xValues3 = [];

    var yValues3 = [];
    var barColors3 = [
        '#2c3e50', '#e74c3c', '#416370', '#3498d8', '#298089'];
    for(let i = 0;i<5;i++) {
        xValues3.push(statistikaTrg[i].kategorija);
        console.log(statistikaTrg[i].broj);
        yValues3.push(parseInt(statistikaTrg[i].broj));

    }



    new Chart("treciGrafikon", {
        type: "bar",
        data: {
            labels: xValues3,
            datasets: [{
                backgroundColor: barColors3,
                data: yValues3
            }]
        },
        options: {
            responsive: true,
            legend: {display: false},
            title: {
                display: true,
                text: "Kategorije sa najvise trgovaca"
            }
        }
    });


    var xValues4 = ["Potvrđeno", "Odbijeno", "Ćeka potvrdu", "Isporućeno"];
    var yValues4 = [];
    var barColors4 = [
        '#2c3e50', '#e74c3c', '#ecf0f1', '#3498d8', '#298089'];


    for(let i = 0;i<brojNarudzbiPoStatusu.length; i++) {
        yValues4.push(parseInt(brojNarudzbiPoStatusu[i].count));
    }

    new Chart("cetvrtiGrafikon", {
        type: "pie",
        data: {
            labels: xValues4,
            datasets: [{
                backgroundColor: barColors4,
                data: yValues4
            }]
        },
        options: {
            title: {
                display: true,
                text: "Broj narudžbi po statusima"
            }
        }
    });

    console.log(najprodavanijiArtikli);


    var xValues5 = [];
    var yValues5 = [];
    var barColors5 = ['#298089',
        '#003f5c',
        '#2f4b7c',
        '#665191',
        '#a05195',
        '#d45087',
        '#f95d6a',
        '#e74c3c',
        '#ff7c43',
        '#ffa600',
    ];


    for(let i = 0;i<5; i++) {
        xValues5.push(najprodavanijiArtikli[i].naziv);
        yValues5.push(parseInt(najprodavanijiArtikli[i].broj_prodanih));
    }

    new Chart("petiGrafikon", {
        type: "pie",
        data: {
            labels: xValues5,
            datasets: [{
                backgroundColor: barColors5,
                data: yValues5
            }]
        },
        options: {
            title: {
                display: true,
                text: "Najprodavaniji artikli"
            }
        }
    });





    var xValues6 = [];
    var yValues6 = [];
    var barColors6 = ['#3a565c',
        '#1a776b',
        '#449354',
        '#97a622',
        '#ffa600'];


    for(let i = 0;i<najprodavanijeKategorije.length; i++) {
        xValues6.push(najprodavanijeKategorije[i].kategorija);
        yValues6.push(parseInt(najprodavanijeKategorije[i].broj_prodanih));
    }

    new Chart("sestiGrafikon", {
        type: "pie",
        data: {
            labels: xValues6,
            datasets: [{
                backgroundColor: barColors6,
                data: yValues6
            }]
        },
        options: {
            title: {
                display: true,
                text: "Kategorije sa najviše prodanih artikala"
            }
        }
    });
}