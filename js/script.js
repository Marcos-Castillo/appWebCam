const tieneSoporteUserMedia = () =>
    !!(navigator.getUserMedia || 
       (navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia) || 
       navigator.webkitGetUserMedia || navigator.msGetUserMedia);

const _getUserMedia = (...arguments) =>
    (navigator.getUserMedia || 
     (navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia) || 
     navigator.webkitGetUserMedia || navigator.msGetUserMedia).apply(navigator, arguments);

const video = document.querySelector("#video"),
    canvas = document.querySelector("#canvas"),
    boton = document.querySelector("#boton"),
    listaDeDispositivos = document.querySelector("#listaDeDispositivos");

const limpiarSelect = () => {
    for (let x = listaDeDispositivos.options.length - 1; x >= 0; x--) {
        listaDeDispositivos.remove(x);
    }
};

const obtenerDispositivos = () => navigator
    .mediaDevices
    .enumerateDevices();

const llenarSelectConDispositivosDisponibles = () => {
    limpiarSelect();
    obtenerDispositivos()
        .then(dispositivos => {
            const dispositivosDeVideo = [];
            dispositivos.forEach(dispositivo => {
                const tipo = dispositivo.kind;
                if (tipo === "videoinput") {
                    dispositivosDeVideo.push(dispositivo);
                }
            });

            if (dispositivosDeVideo.length > 0) {
                dispositivosDeVideo.forEach(dispositivo => {
                    const option = document.createElement('option');
                    option.value = dispositivo.deviceId;
                    option.text = dispositivo.label;
                    listaDeDispositivos.appendChild(option);
                });
            }
        });
}

(function() {
    if (!tieneSoporteUserMedia()) {
        alert("Lo siento. Tu navegador no soporta esta característica");
        return;
    }

    let stream;

    obtenerDispositivos()
        .then(dispositivos => {
            const dispositivosDeVideo = [];
            dispositivos.forEach(function(dispositivo) {
                const tipo = dispositivo.kind;
                if (tipo === "videoinput") {
                    dispositivosDeVideo.push(dispositivo);
                }
            });

            if (dispositivosDeVideo.length > 0) {
                mostrarStream(dispositivosDeVideo[0].deviceId);
            }
        });

    const mostrarStream = idDeDispositivo => {
        _getUserMedia({
                video: {
                    deviceId: idDeDispositivo,
                }
            },
            (streamObtenido) => {
                llenarSelectConDispositivosDisponibles();

                listaDeDispositivos.onchange = () => {
                    if (stream) {
                        stream.getTracks().forEach(function(track) {
                            track.stop();
                        });
                    }
                    mostrarStream(listaDeDispositivos.value);
                }

                stream = streamObtenido;
                video.srcObject = stream;
                video.play();

                boton.addEventListener("click", function() {
                    video.pause();

                    let contexto = canvas.getContext("2d");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

                    let foto = canvas.toDataURL();
                    let enlace = document.createElement('a');
                    enlace.download = "foto.png";
                    enlace.href = foto;
                    enlace.click();

                    video.play();
                });
            }, (error) => {
                console.log("Permiso denegado o error: ", error);
            });
    }
})();


//gestion de codigo de barra 

const botonLeerCodigo = document.querySelector("#botonLeerCodigo");
const resultadoCodigo = document.querySelector("#resultadoCodigo");

botonLeerCodigo.addEventListener("click", function() {
    leerCodigoDeBarras();
});


const leerCodigoDeBarras = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: video
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
        }
    }, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function (result) {
        const code = result.codeResult.code;
        resultadoCodigo.innerHTML = `Código detectado: ${code}`;
        Quagga.stop();
    });
};


