var prikazan = false;

function prikaziDD() {
    if(!prikazan) {
        document.getElementById('lista-dd').style.display = "block";
        prikazan = true;
    }
    else {
        document.getElementById('lista-dd').style.display = "none";
        prikazan = false
    }
}