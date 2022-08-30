
    var prikazanNeki = false;
    var idPrikazanog = undefined;
    function prikaziDD() {
    if(!prikazanNeki) {

    document.getElementById('lista-dd').style.display = "block";
    prikazanNeki = true;
    idPrikazanog = 'lista-dd';
}
    else if(prikazanNeki && idPrikazanog === 'lista-dd'){
    document.getElementById('lista-dd').style.display = "none";
    prikazanNeki = false;
    idPrikazanog = undefined;
}
    else if(prikazanNeki && idPrikazanog !== 'lista-dd'){
    document.getElementById('lista-dd').style.display = "block";
    document.getElementById(idPrikazanog).style.display = "none";
    idPrikazanog = 'lista-dd';

}
}
    function prikaziDD2() {
    if(!prikazanNeki) {

    document.getElementById('lista-dd2').style.display = "block";
    prikazanNeki = true;
    idPrikazanog = 'lista-dd2';
}
    else if(prikazanNeki && idPrikazanog === 'lista-dd2'){
    document.getElementById('lista-dd2').style.display = "none";
    prikazanNeki = false;
    idPrikazanog = undefined;
}
    else if(prikazanNeki && idPrikazanog !== 'lista-dd2'){
    document.getElementById('lista-dd2').style.display = "block";

    document.getElementById(idPrikazanog).style.display = "none";
    idPrikazanog = 'lista-dd2';
}
}


    function prikaziDD3() {
        if(!prikazanNeki) {

            document.getElementById('lista-dd3').style.display = "block";
            prikazanNeki = true;
            idPrikazanog = 'lista-dd3';
        }
        else if(prikazanNeki && idPrikazanog === 'lista-dd3'){
            document.getElementById('lista-dd3').style.display = "none";
            prikazanNeki = false;
            idPrikazanog = undefined;
        }
        else if(prikazanNeki && idPrikazanog !== 'lista-dd3'){
            document.getElementById('lista-dd3').style.display = "block";
            document.getElementById(idPrikazanog).style.display = "none";
            idPrikazanog = 'lista-dd3';

        }
    }