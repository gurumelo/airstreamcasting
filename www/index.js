var express 	= require('express'),
app 		= express(),
server 		= require('http').Server(app),
io 		= require('socket.io')(server),
bodyParser 	= require('body-parser'),
escape 		= require('escape-htmlandmongo'),
validator 	= require('validator'),
datos 		= require('./model/datos');
confi 		= require('./confi.json');


app.use(bodyParser.json({limit: '30mb'}));

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.get('/', (req, res) => {
        var response = {};
        datos.findOne({}).sort({_id: -1}).exec( (err, data) => {
		if (err) {
			response = {"error": true };
		} else {
			response = {"message": data};
		}
		res.render('index',{response: response});
        });

});

// Recibe datos de la aplicación móvil.
app.post('/a/n', (req, res) => {
	if ( Object.keys(req.body).length == 6 && escape.esc(req.body.cs) == confi.contrasena) {
		
		// escapar contraseña, comprobar que coinciden.
		// c is int, t is int, pm isdecimal, f is base64
		if ( validator.isInt(req.body.c) && validator.isInt(req.body.h) && validator.isFloat(req.body.p) && validator.isISO8601(req.body.fe) && validator.isBase64(req.body.f[0]) ) {

			//console.log(req.body);
			io.emit('a',{"c": req.body.c, "h": req.body.h, "p": req.body.p, "fe": req.body.fe, "f": req.body.f});

			var db = new datos();
			db.c = req.body.c;
			db.h = req.body.h;
			db.p = req.body.p;
			db.f = req.body.f;

			db.save(function(err,data){
				if(err) {
        	                	console.log('error db');
                	        } else {
					console.log('bien db');
				}
			});

			var response = {"error": false};
			res.json(response);
		} else {
			var response = {"error": true};
			res.json(response);
		}
	} else {
		var response = {"error": true};
		res.json(response);
	}
});


server.listen(confi.puerto, () => console.log('La magia sucede en http://localhost:'+ confi.puerto));
