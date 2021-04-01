const fs = require('fs');
const colors = require('colors');

// Create logfile if not exists
fs.appendFile(process.env.LOGFILE || 'logs/debug.log', '', function (err) {
  if (err) throw err;
  console.log('Log file created');
});

const express = require('express');
const socket = require('socket.io');

// App setup
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);

//Favicon
const favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/images/favicon.ico'));

server.listen(process.env.PORT || 3000);
console.log("Server started");

app.set('view engine', 'ejs');
app.use("/public", express.static('public'));

const Chargepoint = require('./chargepoint');

const config = JSON.parse(fs.readFileSync(__dirname + '/config/simulatorConfig.json'));

const serverUrl = config.CMS.CMS_URL; 
const chargeStations = config.ChargeStations;

const chargePointConfigs = chargeStations[Object.keys(chargeStations)[0]];
let chargepoints = {};
let cpIDs = [];
console.log("ChargeStation - "+Object.keys(chargeStations)[0]);

//Setup chargepoimts
for(let i=0; i<Object.keys(chargePointConfigs).length; i++) {
	let cpConfig = chargePointConfigs[Object.keys(chargePointConfigs)[i]];
	if(cpConfig['CP-Config'].Active) {
		let chargepoint = new Chargepoint(serverUrl, cpConfig);
		setTimeout(() => { chargepoint.init(io); }, 5000); //5 second initial delay
		chargepoints[cpConfig['CP-Config'].CPID] = chargepoint; //Store objects of chargepoints
		cpIDs.push([cpConfig['CP-Config'].CPID] ); //Array of CPIDs to send to front end
	} else {
		let output = "Skipping "+cpConfig['CP-Config'].CPID;
		console.log(output.cyan);
	}
}

//Routes
app.get('/', function(req, res) {
	res.sendFile(__dirname+ '/public/index.html');
});

app.get('/disconnect/:cpID', function(req, res) {
	if(chargepoints[req.params.cpID]) { //Check if the chargepoint exists
		chargepoints[req.params.cpID].disconnect();
		res.send('CPID disconnected');
	} else {
		res.render('error');
	}	
});

app.get('/reconnect/:cpID', function(req, res) {
	if(chargepoints[req.params.cpID]) { //Check if the chargepoint exists
		chargepoints[req.params.cpID].reconnect();
		res.send('CPID reconnected');
	} else {
		res.render('error');
	}	
});

app.get('/:cpID/:connectorID', function(req, res) {
	if(chargepoints[req.params.cpID]) { //Check if the chargepoint exists
		let connector = chargepoints[req.params.cpID].getConnector(req.params.connectorID);
		if(connector) { //Check if the connector exists
			res.render('connector', {
		        cpID: req.params.cpID,
		        connectorID: req.params.connectorID,
				transactionID: connector.transactionId,
				meterValue: connector.meterCount?connector.meterValue:-1
		    });
		} else {
			res.render('error');
		}
	} else {
		res.render('error');
	}
	
});

// Frontend connection
io.sockets.on('connection', function(socket) {
	console.log("Connected");
	let chargepointInfo = [];
	for(let i=0; i<Object.keys(chargepoints).length; i++) {
		const cpInfo = chargepoints[Object.keys(chargepoints)[i]].getInfo(); //cpInfo has [delay, pause, error]
		chargepointInfo.push(cpInfo);
	}
	socket.emit('init', { chargestation: Object.keys(chargeStations)[0], chargepoints: cpIDs, cpInfo: chargepointInfo});
	for(let i=0; i<Object.keys(chargepoints).length; i++) {
		chargepoints[Object.keys(chargepoints)[i]].connInit(socket);
		// const cpInfo = chargepoints[Object.keys(chargepoints)[i]].getInfo();
	}
	socket.on('continue', function(data) {
		chargepoints[data.cpID].continue(data.connID);
	});

	socket.on('closeCP', function(data) {
		chargepoints[data.cpID].close();		
	});
});