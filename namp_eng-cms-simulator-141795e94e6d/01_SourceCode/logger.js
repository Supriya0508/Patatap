//Maintains a log of all messages sent to CMS in a JSON format
// Also writes data into log file

const fs = require('fs');

const Logger = module.exports = {
    log: {},
    logFileName: process.env.LOGFILE || 'logs/debug.log',
    add: function(uid, obj) {
        Logger.log[uid] = obj;
    },
    clear: function() {
    	Logger.log = {};
    },
    logfile: function(data, cpID, connID) {
        const logdata = {
            cpID: cpID,
            connID: connID ? connID : null,
            message: data
        };
    	fs.appendFile(Logger.logFileName, JSON.stringify(logdata)+"\n", function (err) {
		  if (err) throw err;
		});
    }
}