let nombre1 = prompt("Cual es tu nombre?");
let materia1 = prompt("Cual es tu materia favorita?");
let edad1 = prompt("Cual es tu edad?");
let añoActual= "2026";
resta = parseInt(añoActual) - parseInt(edad1);
let mensaje = "";
if (parseInt(edad1) >= 18) {
    mensaje = "eres mayor de edad";
}
if (parseInt(edad1) < 18) {
    mensaje = "eres menor de edad";
}

alert(
    "Hola " + nombre1 + ", tienes " + edad1 + " años" + ", tu materia favorita es " + materia1 + ", naciste en el " + resta + " y " + mensaje
);

