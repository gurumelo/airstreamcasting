var mongoose	= require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/airstreamcasting', { useMongoClient: true });

var Schema = mongoose.Schema;

var datosSchema = new Schema({
	c: Number,
	h: Number,
	p: Number,
	f: String
},
{
    timestamps: true
});

process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		console.log('Desconectado de mongo');
		process.exit(0);
	});
});


module.exports = mongoose.model('datos', datosSchema);
