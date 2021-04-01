function Connector(config, cpID, currentType, io, disconnect, reconnect) {
	const fs = require('fs');
	const util = require('util');
    const colors = require('colors');
    
	const Logger = require('./logger');

	const connId = config.ConnectorID;
    const unit = config.Unit ? config.Unit : 'Wh';
    const randomValues = config.RandomValues ? config.RandomValues : false;
	this.meterStart = config.StartUnit;
    this.number_of_metervalues = config.No_of_MeterValues;
	const payloadConfig = JSON.parse(fs.readFileSync(__dirname + '/config/'+config.Payload_Config));
    this.meterAuto = this.number_of_metervalues>0?true:false;
    this.MeterValueInterval = 0;
	this.isCharging = false;
	this.meterCount = null;
    SoCValue = null;
	this.count = 0; //Number of meter values sent
    let currentNumber = 0; //Index of the messages in payloadConfig
    this.transactionId = 0;
    this.delay = false;
    this.wait = false;
    this.pause = false;
    this.error  = false;
    this.disconnected = false;

    this.sendPayload = (uniqueID) => { //Sends next payload from the payload file
        if(currentNumber<payloadConfig.length && !this.error) {
            this.delay = false;
            this.wait = false;
            this.pause = false;
            let payload = payloadConfig[currentNumber];
            if(payload[0]=="Delay" || payload[0]=="DELAY") { //Sends next payload after some delay
                this.delay = true;
                io.sockets.emit('delay', { cpID: cpID, connID: connId, seconds: payload[1] } );
                io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: 'Connector '+connId+' is waiting for '+payload[1]+' seconds', connID: connId });
                currentNumber++;
                console.log(cpID+"'s Connector "+connId+" is delayed");
                setTimeout(() => { if(!this.disconnected) { this.sendPayload(); } }, payload[1]*1000);
            } else if(payload[0]=="Pause" || payload[0]=="PAUSE") { //Waits and does nothing 
                this.pause = true;
                io.sockets.emit('pause', { cpID: cpID, connID: connId } );
                io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: 'Connector '+connId+' is waiting for user', connID: connId });
                currentNumber++;
                console.log(cpID+"'s Connector "+connId+" is paused");
            } else if(payload[0]=="Remote Start" || payload[0]=="REMOTE START" || payload[0]=="RemoteStart") { //Waits and does nothing 
                this.wait = true;
                io.sockets.emit('wait', { cpID: cpID, connID: connId} );
                io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: 'Connector '+connId+' is waiting for remoteStart on '+cpID+'\'s Connector '+connId, connID: connId });
                const output = "Waiting for Remote Start for "+cpID+"'s Connector "+connId;
                console.log(output.bgMagenta);
                currentNumber++;
            } else if(payload[0]=="Remote Stop" || payload[0]=="REMOTE STOP" || payload[0]=="RemoteStop") {
                this.wait = true;
                io.sockets.emit('wait', { cpID: cpID, connID: connId} );
                io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: 'Connector '+connId+' is waiting for remoteStop on '+cpID+'\'s Connector '+connId, connID: connId });
                const output = "Waiting for Remote Stop for "+cpID+"'s Connector "+connId;
                console.log(output.bgMagenta);
                currentNumber++;
            } else if(payload[0]=="Trigger" || payload[0]=="TRIGGER" || payload[0]=="trigger") {
                this.wait = true;
                io.sockets.emit('wait', { cpID: cpID, connID: connId} );
                io.sockets.emit('info', { cpID: cpID, type: 'warning bg-dark', msg: 'Connector '+connId+' is waiting for trigger message on '+cpID+'\'s Connector '+connId, connID: connId });
                const output = "Waiting for Trigger Message for "+cpID+"'s Connector "+connId;
                console.log(output.bgMagenta);
                currentNumber++;
            } else if(payload[0]=="Disconnect" || payload[0]=="DISCONNECT" || payload[0]=="disconnect") {
                disconnect();
                currentNumber++;
                // Reconnect after the specified number of seconds
                setTimeout(() => { reconnect(); }, payload[1]*1000);
            } else {
                if(payload[1]=='UniqueID') {
                    payload[1] = uniqueID ? uniqueID : new Date().getTime(); //uniqueID is passed for remotestart/remotestop/trigger
                }
                if(payload[3]) {
                    if(payload[3].timestamp==="") {
                        payload[3].timestamp = new Date();
                    }
                    if(payload[3].transactionId==="") {
                        payload[3].transactionId = this.transactionId;
                    }
                    if(payload[3].meterStop==="" && this.meterCount != null) { //Only replaced in meterAuto for StopTransaction
                        payload[3].meterStop = parseInt(this.meterCount);
                    }
                }
                if(payload[2]=="MeterValues") {
                    if(this.meterAuto) {
                        this.startMeterValue(payload);
                        currentNumber++;
                    } else {
                        this.sendMeterValues(payload);
                        if(payloadConfig[currentNumber+1][2]=="MeterValues") { //If next payload is MeterValue, wait for MeterValueInterval and then send it
                            setTimeout(() => {
                                currentNumber++;
                                if(!this.disconnected) {
                                    this.sendPayload();
                                }
                            }, this.MeterValueInterval*1000);
                        } else {
                            currentNumber++;
                            if(!this.disconnected) {
                                this.sendPayload();
                            }
                        }
                    }
                    
                } else {
                    const output = "CP --> CMS ("+cpID+") (Connector "+ connId +"), Payload == ";

                    Logger.logfile(payload, cpID, connId);
                    console.log(output.yellow+ util.inspect(payload, false, null, false).yellow);
                    io.sockets.emit('info', { cpID: cpID, type: 'primary', connID: connId, msg: output+JSON.stringify(payload), isCharging: this.isCharging, source: 'config' });
                    const obj = { action: payload[2], connID: connId };
                    Logger.add(payload[1], obj);
                    this.ws.send(JSON.stringify(payload));
                    currentNumber++;
                }
            }
            
        }
        if(uniqueID && !this.error && !this.disconnected) { //For remoteStart and remoteStop confirmations, send the next payload
            setTimeout(() => { this.sendPayload(); }, 2000);
        }
    };

    this.startMeterValue = (payload) => { //Only for meterAuto
        let that =this;
    	this.meterCount = parseInt(this.meterStart);
        this.isCharging = true;
        this.mTimerId = setInterval(function(){
			that.sendMeterValues(payload);
		}, this.MeterValueInterval*1000);
    };

    this.sendMeterValues = (MeterValues) => {
        if(MeterValues[1]=='UniqueID') {
          MeterValues[1] = new Date().getTime();
        }
        if(MeterValues[3].transactionId==="") {
           MeterValues[3].transactionId = this.transactionId;
        }
        if(MeterValues[3].meterValue[0].timestamp==="") {
           MeterValues[3].meterValue[0].timestamp = new Date();
        }
        // Check if there is a second "meterValue", update timestamp if necessary
        if(MeterValues[3].meterValue.length>1 && MeterValues[3].meterValue[1].timestamp==="") {
            MeterValues[3].meterValue[1].timestamp = new Date();
        }
    	if(this.count<this.number_of_metervalues  && this.isCharging) { //For meterAuto
            // Set UniqueID
            MeterValues[1] = new Date().getTime();

            // If DC and the first meterValue/sampledValue is SoC, update value
	        if(currentType == "DC" && MeterValues[3].meterValue[0].sampledValue[0].measurand.toUpperCase()==="SOC"){
                // If SoCValue is not previously set, set it to the first value of the metervalue's sampledvalue
                if(!SoCValue) {
                    SoCValue =  parseFloat(MeterValues[3].meterValue[0].sampledValue[0].value);
                }
                if((SoCValue)>=100) {
                    MeterValues[3].meterValue[0].sampledValue[0].value = '100';
                } else {
	                MeterValues[3].meterValue[0].sampledValue[0].value = String(SoCValue);
                }
                // 100% SoC AutoStop
	            if( MeterValues[3].meterValue[0].sampledValue[0].value == '100'){
	                this.isCharging = false;
                    clearInterval(this.mTimerId);
                    if(!this.disconnected) {
                        // Send next payload
                        this.sendPayload(); 
                    }     
                }
                // Random value between 7.5 to 15.0
                SoCValue+=((Math.random() * (150 - 75) + 75)/10);
	        }
            // Check if there is a second "meterValue", then update the second "meterValue"s sampledValue
            if(MeterValues[3].meterValue.length>1) {
                if(unit.toUpperCase()=="KWH") {
    	           MeterValues[3].meterValue[1].sampledValue[0].value = String((this.meterCount/1000).toFixed(2)); // parseInt(this.meterCount/100);
                } else {
                    MeterValues[3].meterValue[1].sampledValue[0].value = String((this.meterCount).toFixed(2));
                }
            } else { // Update the second "sampledValue" of the first "meterValue"
                if(unit.toUpperCase()=="KWH") {
                   MeterValues[3].meterValue[0].sampledValue[1].value = String((this.meterCount/1000).toFixed(2)); // parseInt(this.meterCount/100);
                } else {
                    MeterValues[3].meterValue[0].sampledValue[1].value = String((this.meterCount).toFixed(2));
                }
            }
	        this.count++;

            const obj = { action: MeterValues[2], connID: connId };
            Logger.add(MeterValues[1], obj);
	        this.ws.send(JSON.stringify(MeterValues));
            const output = "CP --> CMS ("+cpID+") (Connector "+ connId +"), Payload == ";
            io.sockets.emit('info', { cpID: cpID, type: 'primary', connID: connId, msg: output+JSON.stringify(MeterValues), isCharging: this.isCharging, source: 'config' }); //For front end

            Logger.logfile(MeterValues, cpID, connId);
	        console.log(output.yellow + util.inspect(MeterValues, false, null, false).yellow);
            
            if(randomValues) {
                // Random number between 75 and 150
                this.meterCount+=(Math.random() * (150 - 75) + 75);
            } else {
                this.meterCount+=100;
            }
    	} else if(!this.meterAuto) {
            const obj = { action: MeterValues[2], connID: connId };
            Logger.add(MeterValues[1], obj);
            this.ws.send(JSON.stringify(MeterValues));
            const output = "CP --> CMS ("+cpID+") (Connector "+ connId +"), Payload == ";
            io.sockets.emit('info', { cpID: cpID, type: 'primary', connID: connId, msg: output+JSON.stringify(MeterValues), isCharging: this.isCharging, source: 'config' });

            Logger.logfile(MeterValues, cpID, connId);
            console.log(output.yellow + util.inspect(MeterValues, false, null, false).yellow);
        } else { //Once meterAuto is done
            clearInterval(this.mTimerId);
            if(!this.disconnected) {
    		  this.sendPayload();
            }
    	}
    };

    this.setWebSocket = function(ws) {
        this.ws = ws;
    }
}

module.exports = Connector;
