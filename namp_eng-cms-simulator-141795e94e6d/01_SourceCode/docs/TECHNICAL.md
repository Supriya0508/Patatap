# Simulator Developer Documentation

## Setting up the simulator

- Clone the repository and `cd cms-simulator`.
- Run `npm install` to install all the dependencies.
- To start the simulator, run `node index.js`. This will start a server at port 3000 by default.
- To start the server on a different port, run `PORT=<PORT_NUMBER> node index.js`.

---

## Overview

- The simulator first reads the contents of `config/simulatorConfig.json`. This file contains information about the web socket URL of the CMS and the chargepoint and connector configurations.
- The communication with the frontend which is hosted on the server with the `PORT_NUMBER` is through `socket.io`.
- The frontend can be opened any time after the simulator is started and the real time information is shown.

---

### index.js

- The `index.js` is the entry point of the simulator and it sets up the objects of each `chargepoint`.
- The objects of the chargepoints are stored as a key-value pair of CPID-object.
- Each `chargepoint` is initialized after a delay of 10 seconds.
- The connection with the frontend is also established here.
- Whenever a frontend connection is established, an `init` is emitted to the frontend. This contains information about the chargepoints such as CPID, delay, pause or error.

---

### logger.js

- The `logger` maintains a log of all messages sent to CMS in a JSON format.
- The key of the logger is the `Message UniqueID`(uid).
- The value is another JSON object which contains information about the message sent such as `action`.
- Chargepoint stores only the `action` in the logger. Connector stores the `action` and the `connectorID` in the logger.

---

### chargepoint.js

- Each object of `chargepoint` is specific to one chargepoint.
- The `chargepoint` module contains information about the particular chargepoint.
- The `init` function is the entry point for th chargepoint. It established a web socket connection with the CMS. It also defines the functions for each action of the web socket such as `open`, `close`, `message` and `error`.
- The `message` action deals with the incoming messages from the CMS. For messagetypeID=3, t first checks if the uniqueID is present in the logger. It, then calls the appropriate function for the action.
- Once the web socket connection is opened, the `sendPayload` function is called.
- The `sendPayload` function sends the payload from the `CPPayload` one after another. The `currentNumber` keeps track of the index of the payload in the `CPPayload`.
- The `sendPayload` function replaces the message UniqueID with the current timestamp in milliseconds.
- If a `DELAY` is encountered in the `CPPayload`, the simulator waits for the seconds mentioned and then sends the next payload. The chargepoint button is the frontend is changed to *yellow* colour.
- If a `PAUSE` is encountered in the `CPPayload`, the simulator pauses execution for that chargepoint. The chargepoint button is the frontend is changed to *gray* colour.
- Before the payload is sent, it's uniqueID and action are stored in the `Logger`.
- Once all the messages(payload) from the `CPPayload` of a chargepoint is sent, the first messages of each connector is sent.
- The `verifyBootConfirmation` function checks if the **BootNotification** was accepted. If it is accepted, it sets up a timer for the **HeartBeat** with the interval received from the BootNotificationConfirmation and then sends the next payload.
- The `verifyBootConfirmation` function also creates objects of each *connectors* of that chargepoint.
- The `verifyAuthorize` function checks if the **Authorize** request was accepted. If it is accepted, it sends the next payload.
- The `verifyStartTrasaction` function checks if the **StartTransaction** was accepted and then sets the corresponding connctor with the *transactionId* and *MeterValueInterval*.
- The `verifyStopTrasaction` function checks if the **StopTransaction** was accepted and then sets the *isCharging* of the corresponding connctor to false.
- In each of the *verify* functions, if the request was not accepted, an error message is sent to the frontend and console and the button is set to *red* in the frontend.
- The `startRemoteTransaction` function is called when a **RemoteStartTransaction** is sent. It simply sends the next payload of the connector which should be the *confirmation* of the **RemoteStartTransaction** request.
- The `stopRemoteTransaction` function is called when a **RemoteStopTransaction** is sent. It finds the connector with the *transactionId* and sends the next payload of that connector which should be the *confirmation* of the **RemoteStopTransaction** request.
- The `continue` function continues the execution of the chargepoint or the connector if it is in `PAUSE` state. This is called when the button is clicked in the frontend.
- The `conninit` function sends information about the connectors of the chargepoint to the frontend whenever a new frontend connection is established.

---

### connector.js

- Each object of `connector` is specific to one connector.
- The `connector` module contains information about the particular connector.
- The `meterAuto` variable determines if the simulator should the meterValues automatically once it is encountered in the `payloadConfig` or if all the meterValues payloads are specified in the `payloadConfig`. If the `number_of_metervalues`>0, it is considered as `meterAuto`.
- In case of `meterAuto`, the simulator finds the first **MeterValues** request in the `payloadConfig` and then sends it `number_of_metervalues` number of times at an interval of `MeterValueInterval`. Once it is done, the next payload in the `payloadConfig` file is sent.
- In case of `meterAuto`, the *charging transaction* can be stopped any time before the completion of `number_of_metervalues` by clicking on the connector button when it is green.
- In case of `meterAuto`, the `startMeterValue` function sets up a timer function for sending the meterValues.
- The `sendPayload` function sends the payload from the `payloadConfig` one after another. The `currentNumber` keeps track of the index of the payload in the `payloadConfig`.
- The `sendPayload` function replaces the message UniqueID with the current timestamp in milliseconds. It also replaces the timestamp, transactionId and meterStop in appropriate payloads.
- If a `DELAY` is encountered in the `payloadConfig`, the simulator waits for the seconds mentioned and then sends the next payload of the connector. The connector button is the frontend is changed to *yellow* colour.
- If a `PAUSE` is encountered in the `payloadConfig`, the simulator pauses execution for that connector. The connector button is the frontend is changed to *gray* colour.
- If a `Remote Start` or `Remote Stop` is encountered in the `payloadConfig`, the simulator pauses execution for that connector. The connector button is the frontend is changed to *black* colour. It is resumed when the RemoteStart/RemoteStop request is sent for that connector.
- The `sendMeterValues` function sends the meterValues after replacing the appropriate values in the payload for both `meterAuto` and non-`meterAuto`.

---

## Technologies Used

- socket.io - [socket.io docs](https://socket.io/docs/)
- Express
- Node.js
- Boostrap, jQuery