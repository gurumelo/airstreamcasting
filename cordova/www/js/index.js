//
//Recupera datos servidor y contraseña y autorellena campos.
//
function recuperadatos() {
	NativeStorage.getItem('elservidor', recuperadatosbien, recuperadatoserror);
}
//
function recuperadatosbien(elservidor) {
	//se rellenan los campos
	$('#servidor').val(elservidor.servidor);
	$('#contrasena').val(elservidor.contrasena);
}
//
function recuperadatoserror(error) {
	return false;
} //NativeStorage.remove("elservidor", remueve, noremueve);
//
//Guarda servidor y contraseña
//
var elservidor; //variable global para que esté disponible durante ejecución
function guardadatos(elservidor) {
	NativeStorage.setItem("elservidor", elservidor, guardadatosbien, guardadatoserror);
}
//
function guardadatosbien() {
	return true;
}
//
function guardadatoserror() {
	return false;
}
//
//Habilita bluetooth y muestra emparejados
//
function habilitaypares() {
	bluetoothSerial.enable(
    function() {
      //console.log("Bluetooth habilitado");
			//Busca los bluetooths ya emparejados
			bluetoothSerial.list(function(devices) {
				// buscando emparejados, limpiar lista y mostrar cargando
				$('#log').hide().text('');
				$('#cargando').show();
				if (devices.length === 0) {
					var html = '<div id="nohayairbeam"><span>AirBeam no emparejado</span></div><span class="lospuntos fondonegro">↓</span>'
					$('#log').append(html);
					$('#cargando').fadeOut(3000, function() {
						$('#log').show();
					});
				} else {
					devices.forEach(function(device) {
						var nombre = device.name
						if (nombre.includes('AirBeam')) {
							nombre = nombre.replace('AirBeam','<b>AirBeam</b>');
						}
						var html = '<div class="nohay" data-mac="'+ device.id +'"><span class="con"><span class="lospuntos">.</span>Conectar<span class="lospuntos">→</span></span><span class="devicename">'+ nombre +'</span></div>';
        		$('#log').append(html);
    			});
					$('#cargando').fadeOut(3000, function() {
						$('#log').show();
					});
				}
			}, fallo);
  	},
    function() {
			//salir de la aplicación si no acepta
			navigator.app.exitApp();
    }
	);
}
//
//Conexión blue a través de mac
//
function conectarblue(mac) {
	bluetoothSerial.connect(mac, conexionbien, conexionmal);
}
//
function conexionbien() {
	conexionblue = true;
	//limpiar todos los divs de conexion y mostrar la cámara.
	screen.orientation.lock('landscape-primary');
	$('#capa').remove();
	$('body').css({
      "background-color": "transparent",
      "background-image": "none"
  });
	setTimeout(function(){ camara(); }, 700);
	setTimeout( function() { suscribir(); }, 500);
}
//
function conexionmal() {
	navigator.notification.alert(
			'No se pudo conectar',
			noseconecta,
			'Game Over',
			'Vale'
	)
}
//
var conexionblue = false;
function noseconecta() {
	if (!conexionblue) {
		habilitaypares();
	}
}
//
//Lectura serial
//
function suscribir() {
	bluetoothSerial.subscribe('\n', function (data) {
		if ( !data.includes('BC:') ) {
			var airdato = data.split(';');
			var comprobante = airdato[2];
			if (comprobante == 'AirBeam-PM') {
				$('#pmv').text(airdato[0]);
			} else if (comprobante == 'AirBeam-C') {
				$('#cv').text(airdato[0]);
			} else if (comprobante == 'AirBeam-RH') {
				$('#hv').text(airdato[0]);
			}
		}
	}, fallo);
}
//
//Funciones tras pulsar botón de entrar en emparejamientos
//
function viene() {
	return true;
}
//
function fallo() {
	navigator.app.exitApp();
}
//
//Ejecución camera preview
//
function camara() {
  let options = {
    x: 0,
    y: 0,
    width: window.screen.width,
    height: window.screen.height,
    camera: CameraPreview.CAMERA_DIRECTION.BACK,
    toBack: true,
    tapPhoto: false,
    tapFocus: false,
    previewDrag: false
  };

  CameraPreview.startCamera(options);

	$('#capacam').fadeIn(2000);

  // Previene fallo al minimizar aplicación con botón atrás, la cierra
  CameraPreview.onBackButton(function() {
    navigator.app.exitApp();
  });
}
//
//Enviar datos a servidor
//
function recogerdatos() {
  CameraPreview.takePicture({width:854, height:480, quality: 85}, function(base64PictureData){
		var fecha = new Date();
		var losdatos = {cs: elservidor.contrasena, c: $('#cv').text(), h: $('#hv').text(), p: $('#pmv').text(), fe: fecha, f: base64PictureData};


		$.ajax({
				contentType: 'application/json',
				type: 'POST',
				cache: false,
				url: elservidor.servidor +'/a/n',
				data: JSON.stringify(losdatos),
				success: function(response){
					if (response.error) {
						// ha ocurrido un error, se para la grabación
						console.log('error servidor validaciones');
					} else {
						// todo bien
						console.log('bien');
					}
				},
				error: function(){
					// algo ha fallado, parar grabación e informar
					console.log('error');
				}
			});


	});
}
//
//En caso de que no esté relleno campos, distribuye el foco entre vacíos
//
function focoservidor() {
	var fservidor = $('#servidor').val();
	if (!fservidor) {
		$('#servidor').focus();
	} else {
		$('#contrasena').focus();
	}
}
//
//El dispositivo está preparado para ejecutar cosas
//
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
	//Saca de nativestorage servidor y contraseña
	recuperadatos();
	//Habilita bluetooth, busca pares...
	habilitaypares();


	$('#emparejar').on('click', function() {
		bluetoothSerial.showBluetoothSettings(viene, fallo);
	});
	$('#actualizar').on('click', function() {
		habilitaypares();
	});
	$('body').on('click', '.nohay', function(){
		//comprueba que estén rellenos los campos del formulario
		var fservidor = $('#servidor').val();
		var fcontrasena = $('#contrasena').val();
		//si no están vacíos los campos
		if (fservidor && fcontrasena) {
			//contruir objeto con el valor de los campos
			elservidor = {servidor: fservidor, contrasena: fcontrasena};
			//guarda objeto en NativeStorage
			guardadatos(elservidor);
			//esconder log, mostrar cargar e intentar conectar
			$('#log').hide().text('');
			$('#cargando').show();
			var mac = $(this).data('mac');
			conectarblue(mac);
		} else {
			//están vacíos los campos o alguno de ellos
			navigator.notification.alert(
					'Hay que rellenar campos de servidor y contraseña',
					focoservidor,
					'Game Over',
					'Vale'
			)

		}
	});

	var grabando = false;
	$('#circulo').on('click', function(){
		if (!grabando) {
			grabando = true;
			$(this).css('background-color','rgba(255,97,97,0.6)');
			//empezar a tomar fotos y datos
			intervalo = setInterval(function(){ recogerdatos(); }, 10000)
		} else {
			clearInterval(intervalo);
			grabando = false;
			$(this).css('background-color','red');
		}
	});

}
