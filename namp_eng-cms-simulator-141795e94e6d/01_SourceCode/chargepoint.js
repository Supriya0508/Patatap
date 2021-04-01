function ChargePoint(url, config) {
	const WebSocket = require('ws');
	const fs = require('fs');
	const util = require('util');
	const colors = require('colors');

	const Connector = require('./connector');
	const Logger = require('./logger');

	let ws = null;
	let io = null;
	this.url = url;

	let heartBeatTimer = null;

	const cpConfig = config['CP-Config'];

	const cpID = cpConfig.CPID; 
	let HeartbeatInterval = cpConfig.HeartBeat; 
	const MeterValueInterval = cpConfig.MeterValueInterval; 
	const cpPayload = JSON.parse(fs.readFileSync(__dirname + '/config/'+cpConfig.CPPayload));
	let currentNumber = 0; // Tracks index of which payload to send from the cpPayload file
	let HeartBeat = [2, 1, "Heartbeat", {}];
	const connectorsConfig = extend(config['AC'], config['DC']);
	let connectors = {};

	let delay = false;
	let pause = false;
	let error = false;

	const ref=this;

	const onClose = function() {
		// This is set red color in the front end for the chargepoint
		// error = true;
		io.sockets.emit('error', { cpID: cpID } );
		io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'CLOSED: '+ref.url });
	    console.log('CLOSED: ' + ref.url);
	    ws = null;
	    // clearInterval(heartBeatTimer);
		ref.close();
	}

	const onMessage = function(message) {
		const data = JSON.parse(message);
		let dest = "";
		if (data[0] == 3) {
			if (Logger.log[data[1]]) { //Check if the uniqueID is present in the Logger
				switch(Logger.log[data[1]].action) {
					case 'BootNotification': verifyBootConfirmation(data[2]);
					break;
					case 'StatusNotification': dest = Logger.log[data[1]].connID?" (Connector " + Logger.log[data[1]].connID + ")":"";
											   	// If the logger has connectorID, send the next payload of that connector
											   	if(connectors[Logger.log[data[1]].connID] && ws) { 
											   		setTimeout(() => { connectors[Logger.log[data[1]].connID].sendPayload(); }, 2000);
											   	} else if(ws) {
											   		setTimeout(() => { sendPayload(); }, 2000);
											   	}
					break;
					case 'Authorize': dest = " (Connector " + Logger.log[data[1]].connID + ")";
									  verifyAuthorize(data[2], Logger.log[data[1]].connID);
                	break;
                	case 'StartTransaction': dest = " (Connector " + Logger.log[data[1]].connID + ")";
                	console.log('start');
                							 verifyStartTrasaction(data[2], Logger.log[data[1]].connID);
                	break;
                	case 'StopTransaction': dest = " (Connector " + Logger.log[data[1]].connID + ")";
                							verifyStopTrasaction(data[2], Logger.log[data[1]].connID);
                	break;
                }
			}
			let output = "CMS --> CP(" + cpID +")"+dest+", Payload === ";
			let connID;
			if(Logger.log[data[1]] && Logger.log[data[1]].connID) {
				connID = Logger.log[data[1]].connID;
				io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data), connID: connID, isCharging: connectors[connID].isCharging });
			} else {
				io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data) });	
			}
			
			// Add logs to file
			Logger.logfile(data, cpID, connID);
			console.log(output.green+ util.inspect(data, false, null, false).green);
		}
		else if(data[0]==2) {
			switch(data[2]) {
				case 'RemoteStartTransaction': startRemoteTransaction(data);
				break;
				case 'RemoteStopTransaction': stopRemoteTransaction(data);
            	break;
            	case 'TriggerMessage': triggerMessage(data);
            	break;
			}
		} else if(data[0]==4) {
			// 4 is error
			let connID;
			// Check for connectorID and set it to error
			if(Logger.log[data[1]] && Logger.log[data[1]].connID) {
				connID = Logger.log[data[1]].connID;
				connectors[connID].error = true;
				io.sockets.emit('error', { cpID: cpID, connID: connID } );
			} else {
				io.sockets.emit('error', { cpID: cpID } );
			}
			let output = "CMS --> CP(" + cpID +")"+dest+", Payload === ";
			io.sockets.emit('info', { cpID: cpID,  type: 'danger', msg: output+JSON.stringify(data) });
			Logger.logfile(data, cpID, connID);
			console.log(output.red+ util.inspect(data, false, null, false).red);
		}
	}

	const onError = function(err) {
		error = true;
		io.sockets.emit('error', { cpID: cpID } );
		io.sockets.emit('info', { cpID: cpID, type: 'danger', msg: JSON.stringify(err) });
		console.log("*****ERROR*****".bgRed);
	    console.log(JSON.stringify(err).bgRed);
	    ref.close();
	}

	const disconnect = function() {
		if (ws) {
			for(let i=0; i<Object.keys(connectors).length; i++) {
				if(!connectors[Object.keys(connectors)[i]].error) {
					connectors[Object.keys(connectors)[i]].disconnected = true;
				}
			}
	    	io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'DISCONNECTING ...' });
	        console.log('DISCONNECTING ...');
	        ws.close();
	    }
	}

	const reconnect = function() {
		console.log('RECONNECTING ...');
		ws = new WebSocket(url+cpID,"ocpp1.6"); //Calls 'open' action
		ws.on('open', function () {
			for(let i=0; i<Object.keys(connectors).length; i++) {
				if(!connectors[Object.keys(connectors)[i]].error) {
					connectors[Object.keys(connectors)[i]].disconnected = false;
					connectors[Object.keys(connectors)[i]].setWebSocket(ws);
				}
			}
			io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'RECONNECTING ...' });
	        console.log('RECONNECTING ...');
			// Send the next payload after 2 seconds
			// If all the payloads of the CP are sent, the payloads of the connector are sent in the sendPayload method
		    setTimeout(() => { sendPayload(); }, 2000);
		});

		ws.on('close', function () {
			onClose();
		});

		ws.on('message', function (message) {
			onMessage(message);
		});

		ws.on('error', function (err) {
			onError(err);
		});
	}

	this.init = function (sio) {
		// Set the socket.io connection to send messages to the front end
		io = sio;
		ws = new WebSocket(this.url+cpID,"ocpp1.6"); //Calls 'open' action
		ws.on('open', function () {
			io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'OPENED: '+this.url });
		    console.log('OPENED: ' + this.url.cyan);
		    // Logger.clear();
		    // Send the first payload after 2 seconds
		    setTimeout(() => { if(ws) { sendPayload(); } }, 2000);
		});

		// ws.on('pong', function() {
		// 	console.log('Received pong');
		// });

		ws.on('close', function () {
			onClose();
		});

		ws.on('message', function (message) {
			onMessage(message);
		});

		ws.on('error', function (err) {
			onError(err);
		});

		console.log("OPENING.... "+cpID);
		io.sockets.emit('info', { cpID: cpID, type: 'info', msg: "OPENING.... "+cpID });
	}

	const sendPayload = function() {
		if(currentNumber<cpPayload.length && !error) {
			// Reseting delay and pause
			delay = false;
			pause = false;
			let payload = cpPayload[currentNumber];
			if(payload[0]=="Delay" || payload[0]=="DELAY") {
				delay = true;
				io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: cpID+' is waiting for '+ payload[1] +' seconds' } );
				io.sockets.emit('delay', { cpID: cpID, seconds: payload[1] } );
				currentNumber++;
				console.log(cpID+" is delayed");
				// Send the next payload after DELAY seconds
				setTimeout(() => { if(ws) { sendPayload(); } }, payload[1]*1000); 
			} else if(payload[0]=="Pause" || payload[0]=="PAUSE") {
				pause = true;
				io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: cpID+' is waiting for user' } );
				io.sockets.emit('pause', { cpID: cpID } );
				console.log(cpID+" is paused");
				currentNumber++;
			} else {
				if(payload[1]=='UniqueID') {
					payload[1] = new Date().getTime(); //UniqueID
				}
				if(payload[3].timestamp==="") {
					payload[3].timestamp = new Date();
				}
				const output = "CP(" + cpID +") --> CMS, Payload == ";
				Logger.logfile(payload, cpID, undefined);
				console.log(output.yellow+ util.inspect(payload, false, null, false).yellow);
				io.sockets.emit('info', { cpID: cpID, type: 'primary', msg: output+JSON.stringify(payload), source: 'config' }); //Send to front end
				const obj = { action: payload[2] };
			    Logger.add(payload[1], obj);
			    if(ws) {
			    	// Send to CMS
					ws.send(JSON.stringify(payload));
			    } 
				currentNumber++;
			}
		} else if(!error){ //Send the first payload of each connector after all payloads in CPPayload is sent
			for(let i=0; i<Object.keys(connectors).length; i++) {
				let connectorObj = connectors[Object.keys(connectors)[i]];
				setTimeout(() => { if(ws && !connectorObj.wait) { connectorObj.sendPayload(); } }, i*1000);
			}
		}
	}

	const verifyBootConfirmation = function (data) {
	    if(data.status == 'Rejected'){
	    	error = true;
	    	io.sockets.emit('error', { cpID: cpID } );
	    	const output = cpID+" was rejected during BootNotification";
	    	io.sockets.emit('info', { cpID: cpID, type: 'danger', msg: output });
	    	console.log(output.bgRed);
	        this.close();
	    }else if(data.status == 'Accepted'){
	    	setTimeout(() => { if(ws){ sendPayload(); } }, 2000);
	        // HeartbeatInterval = data.interval;
	        // Set heartbeat interval if not already set
	        if(!heartBeatTimer && HeartbeatInterval > 0) {
	        	// Start the heartbeat timer
	        	heartBeatTimer = setInterval(function(){ sendHeartBeat(); }, HeartbeatInterval*1000);
	        }
	        // If connectors are not initialized, initialize them
	        if(Object.keys(connectors).length==0) {
		        setTimeout(() => {
		        	const output = "CP(" + cpID +") Accepted";
		        	io.sockets.emit('info', { cpID: cpID, type: 'info', msg: output });
					console.log(output.bgCyan);
					let connectorIDs = [];
					// Once BootNotification is confirmed, the objects of all connectors are created
					for(let i=0; i<Object.keys(connectorsConfig).length; i++) { 
						let connectorConfig = connectorsConfig[Object.keys(connectorsConfig)[i]];
						if(connectorConfig.Active){
							let currentType = 'AC';
							for(conn in config['DC']) {
								if(config['DC'][conn]==connectorConfig) {
									currentType = 'DC';
									break;
								}
							}
							console.log(currentType);
							let connector = new Connector(connectorConfig, cpID, currentType, io, disconnect, reconnect);
							connector.setWebSocket(ws);
							// Key-value pair of connectorID: connectorObject
							connectors[connectorConfig.ConnectorID] = connector; 
							connectorIDs.push([connectorConfig.ConnectorID]); 
						} else {
							let output = "Skipping "+cpID+"'s Connector "+connectorConfig.ConnectorID;
							console.log(output.cyan);
						}
					}
					io.sockets.emit('connInit', { cpID: cpID, connectors: connectorIDs });
				}, 1000);
		    }
	    }
	};

	const sendHeartBeat = function () {
		// ws.ping();
		// console.log("Sending ping");
		HeartBeat[1] = new Date().getTime(); //UniqueID
		const output = "CP(" + cpID +") --> CMS, Payload == ";
	    console.log(output.yellow + util.inspect(HeartBeat, false, null, false).yellow);

	    // Add to logfile
	    Logger.logfile(HeartBeat, cpID, undefined);
	    io.sockets.emit('info', { cpID: cpID, type: 'primary', msg: output+JSON.stringify(HeartBeat) });
	    if(ws) {
	    	ws.send(JSON.stringify(HeartBeat));
	    }
	};

	const verifyAuthorize = function(info,connID){
        let data = info.idTagInfo;
        if(data.status == 'Accepted'){
        	setTimeout(() => { if(ws) { connectors[connID].sendPayload(); } }, 2000);
        }else if(data.status == 'Blocked' || data.status == 'Expired' || data.status == 'Invalid'){
        	io.sockets.emit('error', { cpID: cpID, connID: connID } );
        	connectors[connID].error = true;
        	const output = "Error while authorizing connector "+connID+" of "+cpID;
            console.log(output.bgRed);
            io.sockets.emit('info', { cpID: cpID, type: 'danger', msg: output, connID: connID });
        }
    }

    const verifyStartTrasaction = function(data, connID) {
    	console.log("verify start");
		if(data.idTagInfo.status == 'Accepted' && data.transactionId){
			const output = "Starting charging for "+cpID+"'s connector "+connID;
			console.log(output.bgCyan);
			connectors[connID].transactionId = data.transactionId;
			connectors[connID].isCharging = true;
			connectors[connID].MeterValueInterval = MeterValueInterval;
			setTimeout(() => { if(ws) { connectors[connID].sendPayload(); } }, 2000);
			
        }else{
        	connectors[connID].error = true;
        	io.sockets.emit('error', { cpID: cpID, connID: connID } );
        	const output = "Error when starting charging for "+cpID+"'s connector "+connID;
        	io.sockets.emit('info', { cpID: cpID, type: 'danger', msg: output, connID: connID });
        	console.log(output.bgRed);
            connectors[connID].transactionId = 0;
            connectors[connID].isCharging = false;
        }
		
		
	};

	const verifyStopTrasaction = function(data, connID) {
		if(data.idTagInfo.status == 'Accepted') {
			const output = "Stopped charging for "+cpID+"'s connector "+connID;
			console.log(output.bgCyan);
			connectors[connID].transactionId = 0;
			connectors[connID].isCharging = false;
			setTimeout(() => { if(ws) { connectors[connID].sendPayload(); } }, 0);
		} else {
			connectors[connID].error = true;
			io.sockets.emit('error', { cpID: cpID, connID: connID } );
			const output = "Error when stopping charging for "+cpID+"'s connector "+connID;
			io.sockets.emit('info', { cpID: cpID, type: 'danger', msg: output, connID: connID });
        	console.log(output.bgRed);
		}
	}

	const startRemoteTransaction =function(data){
    	let connID = data[3].connectorId;
    	let output = "CMS --> CP(" + cpID +") (Connector "+connID+"), Payload === ";

    	Logger.logfile(data, cpID, connID);
		console.log(output.green+ util.inspect(data, false, null, false).green);
		io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data), connID: connID });
		// Send the next payload for the connector
    	setTimeout(() => { if(ws) { connectors[connID].sendPayload(data[1]); } }, 2000);
    };

    const stopRemoteTransaction = function(data){
    	// Find the connector with the transactionID and send next payload of that connector
    	for(let i=0; i<Object.keys(connectors).length; i++) { 
    		if(data[3].transactionId == connectors[Object.keys(connectors)[i]].transactionId){
    			let output = "CMS --> CP(" + cpID +") (Connector "+Object.keys(connectors)[i]+"), Payload === ";

    			Logger.logfile(data, cpID, Object.keys(connectors)[i]);
				console.log(output.green+ util.inspect(data, false, null, false).green);

				// If meterAuto, stop charging and then send next payload
				if(connectors[Object.keys(connectors)[i]].meterAuto && connectors[Object.keys(connectors)[i]].isCharging) { 
					connectors[Object.keys(connectors)[i]].number_of_metervalues = -1;
					io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data), connID: Object.keys(connectors)[i] });
    				setTimeout(() => { if(ws) { connectors[Object.keys(connectors)[i]].sendPayload(data[1]); } }, (MeterValueInterval*1000)+2000); //Wait for MeterValueInterval before sending the next payload(confirmation), this way the simulator is ready for Remote Stop
				} else {
					io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data), connID: Object.keys(connectors)[i] });
    				setTimeout(() => { if(ws) { connectors[Object.keys(connectors)[i]].sendPayload(data[1]); } }, 0);
				}
				break;
        	}
    	}
    };

    const triggerMessage = function(data) {
    	let connID = data[3].connectorId;
		let output = "CMS --> CP(" + cpID +"), Payload === ";

    	// Check if connectorId is present in the request
    	// Also check if connectorId is registered in the simulator
    	// Alos check if connector is in waiting state
    	if(connID && connID in connectors && connectors[connID].wait) {
    		// Override output statement with connID included
    		output = "CMS --> CP(" + cpID +") (Connector "+connID+"), Payload === ";
    		Logger.logfile(data, cpID, connID);
			console.log(output.green+ util.inspect(data, false, null, false).green);
			io.sockets.emit('info', { cpID: cpID, type: 'success', msg: output+JSON.stringify(data), connID: connID });
			// Send the next payload for the connector
	    	setTimeout(() => { if(ws) { connectors[connID].sendPayload(data[1]); } }, 0);

    	} else {
    		// If connectorId is not sent or if connectorId is not registered, return error message
    		io.sockets.emit('info', { cpID: cpID,  type: 'danger', msg: 'Cannot respond to triggerMessage \n'+output+JSON.stringify(data) });
    	}

    };

	this.close = function () {
		// error = true;
		for(let i=0; i<Object.keys(connectors).length; i++) {
			if(!connectors[Object.keys(connectors)[i]].disconnected) {
				connectors[Object.keys(connectors)[i]].error = true;
			}
		}
	    if (ws) {
	    	io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'CLOSING ...' });
	        console.log('CLOSING ...');
	        ws.close();
	    }
	    io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'CLOSED '+cpID });
    	console.log('CLOSED '+cpID);
	}

	

	this.continue = function(connID) { // Called when the connector/CP button is clicked from front end
		if(connID && connectors[connID].pause && ws) {
			connectors[connID].sendPayload();
		} else if(connID && connectors[connID].meterAuto && connectors[connID].isCharging) { //Stop charging
			connectors[connID].number_of_metervalues = -1;
			io.sockets.emit('info', { cpID: cpID, type: 'info', msg: 'Stopping charging for '+cpID+'\'s Connector '+connID, connID: connID});
		}
		if(pause && ws) { //If CP is in pause
			sendPayload();
		}
	}

	this.connInit = function(socket) { // Whenever the front end is opened after some time, send all info about connectors
		let connectorsInfo = [];
		for(let i=0; i<Object.keys(connectors).length; i++) {
			connectorsInfo.push([Object.keys(connectors)[i], connectors[Object.keys(connectors)[i]].delay, connectors[Object.keys(connectors)[i]].wait, connectors[Object.keys(connectors)[i]].pause, connectors[Object.keys(connectors)[i]].error, connectors[Object.keys(connectors)[i]].isCharging]);
		}
		if(connectorsInfo) {
			socket.emit('connInit', { cpID: cpID, connectors: connectorsInfo });
		}
	}

	this.getInfo = function() { // delay, error and pause are local variables, hence exposing them
		return [delay, pause, error];
	}

	this.getConnector = function(connID) {
		return connectors[connID];
	}

	// Adds two JSON objects
	function extend(a, b){ 
	    for(let key in b)
	        if(b.hasOwnProperty(key))
	            a[key] = b[key];
	    return a;
	}
}

module.exports = ChargePoint;