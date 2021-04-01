# CMS Simulator

## 1. Introduction

The simulator is designed for load testing of the CMS. The simulator can be used to connect to multiple chargepoints and connectors simulatneously.

> Note: This simulator cannot be used for functional testing.

---

## 2. How to use?

### 2.1 File structure of the simulator

- The `config` directory contains the various configurations for the simulator.
- The `docs` directory contains the documentations.
- The `public` and `views` directory contains the UI(Frontend) files.
- The `index.js` is the main file which starts the simulator.

![file structure](docs/FileStructure.png)

### 2.2 Supported Configuration

**2.2.1 simulatorConfig.json** 

-The `simulatorConfig.json` file should follow the following structure -

```json
{
    "CMS": {
        "Name": "Test Simulator",
        "CMS_URL": "ws://cms.numocity.in:9033/ocpp/"
    },
    "ChargeStations": {
        "Banashankari": {
            "CP-1": {
                "CP-Config": {
                    "CPID": "HC001",
                    "OCCP_Version": 1.6,
                    "HeartBeat": 30,
                    "MeterValueInterval": 10,
                    "CPPayload": "CP1Payload.json",
                    "Active": true
                },
                "AC": {
                     "Connector-1": {
                        "ConnectorID": 1,
                        "StartUnit": 2000,
                        "Unit": "kWh",
                        "RandomValues": false,
                        "Payload_Config": "CP1AC1Message.json",
                        "No_of_MeterValues": 500,
                        "Active": false
                    },
                    "Connector-2": {
                        "ConnectorID": 2,
                        "StartUnit": 1000,
                        "Unit": "kWh",
                        "RandomValues": true,
                        "Payload_Config": "CP1AC2Message.json",
                        "No_of_MeterValues": 5,
                        "Active": false
                    }
                },
                "DC": {
                    "Connector-3": {
                        "ConnectorID": 3,
                        "StartUnit": 0,
                        "Unit": "kWh",
                        "RandomValues": false,
                        "Payload_Config": "CP1DC1Message.json",
                        "No_of_MeterValues": 500,
                        "Active": true
                    },
                    "Connector-4": {
                        "ConnectorID": 4,
                        "StartUnit": 0,
                        "Unit": "kWh",
                        "RandomValues": false,
                        "Payload_Config": "CP1DC2Message.json",
                        "No_of_MeterValues": 90,
                        "Active": false
                    }
                }
            }
        }
    }
}
```

- There can be more than one CP, the configurations for the other CPs should be added as a field after `CP-1` inside the ChargeStation name. For example -

```json
"Banashankari": {
    "CP-1": {
        "CP-Config": {
            "CPID": "HC001",
            "OCCP_Version": 1.6,
            "HeartBeat": 30,
            "MeterValueInterval": 10,
            "CPPayload": "CP1Payload.json",
            "Active": true
        },
        "AC": {
                "Connector-1": {
                    "ConnectorID": 1,
                    "StartUnit": 2000,
                    "Unit": "kWh",
                    "RandomValues": false,
                    "Payload_Config": "CP1AC1Message.json",
                    "No_of_MeterValues": 500,
                    "Active": false
                },
                "Connector-2": {
                    "ConnectorID": 2,
                    "StartUnit": 1000,
                    "Unit": "kWh",
                    "RandomValues": true,
                    "Payload_Config": "CP1AC2Message.json",
                    "No_of_MeterValues": 5,
                    "Active": false
                }
            },
            "DC": {
                "Connector-3": {
                    "ConnectorID": 3,
                    "StartUnit": 0,
                    "Unit": "kWh",
                    "RandomValues": false,
                    "Payload_Config": "CP1DC1Message.json",
                    "No_of_MeterValues": 500,
                    "Active": true
                },
                "Connector-4": {
                    "ConnectorID": 4,
                    "StartUnit": 0,
                    "Unit": "kWh",
                    "RandomValues": false,
                    "Payload_Config": "CP1DC2Message.json",
                    "No_of_MeterValues": 90,
                    "Active": false
                }
            }
    },
    "CP-2": {
        "CP-Config": {
            "CPID": "HC002",
            "OCCP_Version": 1.6,
            "HeartBeat": 30,
            "MeterValueInterval": 10,
            "CPPayload": "CP2Payload.json",
            "Active": true
        },
        "AC": {
                "Connector-1": {
                "ConnectorID": 1,
                "StartUnit": 12,
                "Unit": "kWh",
                "RandomValues": false,
                "Payload_Config": "CP2AC1Message.json",
                "No_of_MeterValues": 3,
                "Active": true
            }
        },
        "DC": {
            "Connector-4": {
                "ConnectorID": 2,
                "StartUnit": 12,
                "Unit": "kWh",
                "RandomValues": false,
                "Payload_Config": "CP2DC1Message.json",
                "No_of_MeterValues": 4,
                "Active": true
            }
        }
    }
```

- The `CPPayload` and `Payload_Config` values should be a `.json` file.
- All payloads should be a JSON array.
- `Active` field indicates if the chargepoint/connector is working(active).
- For a particular CP, the Connector names should be unique i.e, `Connector-1`, `Connector-2`, `Connector-3`, etc. This includes both AC and DC connectors.


**2.2.2 CPPayload.json** -

- The CPPayload contains the messages(Payloads) for that particular chargepoint.
- The messages should follow the OCPP standard(MessageTypeID, UniqueID, Action, Payload).
- Once all the files of the CPPayload file are sent, the payloads of each of the connectors are sent.

**2.2.3 CP1AC1Message.json** - 

- This file contains the messages(Payloads) for that particular connector.
- The messages should follow the OCPP standard(MessageTypeID, UniqueID, Action, Payload).

### 2.3 Starting the simulator

1. Clone the repository and `cd cms-simulator`.
2. Run `npm install` to install all the dependencies. (Refer to the NodeJS installation steps for [Windows, Mac](https://nodejs.org/en/download/) and [Linux](https://ostechnix.com/install-node-js-linux/))
3. Add the configurations in the `simulatorConfig.json` inside the `config/` folder.
4. Add the necessary payload files inside the `config/` folder.
5. To start the simulator, run `node index.js`. This will start a server(UI) at port 3000 by default.
6. To start the server on a different port, run `PORT=<PORT_NUMBER> node index.js`.

### 2.4 Stopping the simulator

- The simulator can be stopped by `Ctrl+C` in the terminal where the simulator was started.

---

## 3. UI Overview

- The front end is open on the port 3000 or the environment port specified. (`127.0.0.1:3000`)
- The front end should be opened each time the simulator is run or should be refreshed.
- The front end can be opened any time after the simulator is started and the real time information is shown. Initially a 10 second delay is specified within the simulator before any CP connects for the front end to be opened.
- The front end will have CP buttons and connector buttons for each CP.
- A particular chargepoint can be stopped using the `STOP` button.
- Color code for the buttons -

> Blue - CP/Connector is working
>
> Red - CP/Connnector has an error
>
> Gray - CP/Connector is paused i.e, waiting for user
>
> Yellow - CP/Connector has delay
>
> Green - Connector is charging
>
> Black - Connector is waiting for Remote Start/Stop

- When the CP/Connector button is gray and is clicked, it resumes the execution for that CP/Connector.
- When the connector button is green and clicked, it stops charging and sends next payload for that connector if `No_of_MeterValues`>0 for that connector.
- Color code for messages -

> Blue - The message is from CP to CMS
>
> Green - The message is from CMS to CP
>
> Red - Error messages
>
> Cyan - Information messages
>
> Yellow in black bg - Delay/Pause messages

- Each connector's information including the QR Code can be viewed in */CPID/ConnectorID*. For example, `127.0.0.1:3000/CP001/1`. If the connector ID or chargepoint ID is invalid, an error page will be displayed.

---

### Payload

- The payloads should be within a square bracket [].
- The first element inside the [] is the messagetypeID.

> MessageTypeID 2 is for CALL, Client to Server(CP -> CMS)
>
> MessageTypeID 3 is for RESULT, Server to Client(CMS -> CP)
>
> MessageTypeID 4 is for ERROR

- The second element inside the [] is the message uniqueID. If this value is **"UniqueID"**, then this is replaced by the simulator with the current timestamp in milliseconds. If it is not **"UniqueID"**, it is sent as it is.
- The third element is usually the Action or the Command
- The fourth element contains the payload data.
- If the payload data contains `timestamp` and it is an empty string i.e, `''`, it is replaced with the current timestamp by the simulator.
- If the payload data contains `transactionId` and it is an empty string i.e, `''`, it is replaced with the transactionId for that connector by the simulator.
- If the payload data contains `meterStop` and it is an empty string i.e, `''`, it is replaced with the current meter value of that connector for *meterAuto* situations by the simulator.

---

### MeterValues

- The metervalues for a charge point are sent at the interval specified in the `MeterValueInterval` in the configuration.
- The `No_of_MeterValues` field in the connector configuration determines if the simulator should send the metervalues by itself or if the metervalues are defined in the payload file.
- If `No_of_MeterValues`>0, the simulator sends the first encountered MeterValue Request in the payload file and sends it `No_of_MeterValues` number of times with the appropriate meter count. *(Meter count increases by 100 for each request. Please see RandomValues)*
- If `No_of_MeterValues` = 0, the simulator sends the payloads as it is specified the payload file at an interval `MeterValueInterval`.
- The **automatic** sending of the meterValues can be stopped mid way by clicking on the respective connector button when it is *green* from the UI. After clicking, the next payload in the file will be sent.
- The unit can be set using the `Unit` parameter in the configuration for each connector. If the unit is set to **kWh**, the values will increment by 0.1. If the unit is set to **Wh**, the values will increment by 100. By default, the unit is **Wh**. *(Please see RandomValues)*

---

### RandomValues

This is a parameter in simulatorConfig for each connector which when set to `true` will increment the MeterValues by a random value between 75-150 Wh for each MeterValue when the connector is in `meterAuto` i.e, when the `No_of_MeterValues` is set to `0`. The default value is **false** when the parameter is not set. If this parameter is set to `false`, the meterValues are incremented by 100 Wh.

---

### Delay

- Delays while sending payloads for a chargepoint/connector can be specified within the payload file at appropriate stages.
- By default, each payload is sent 2 seconds after sending the previous payload. The delay specified here will add to that 2 seconds.
- The chargepoint/connector button in the front end is in yellow color when it is in delay mode.
- Example -

```json
[2, "UniqueID", "StatusNotification", {
    "connectorId": 1,
    "errorCode":"NoError",
    "info":"NoInfo",
    "status":"Available",
    "timestamp":"",
    "vendorErrorCode":"",
    "vendorId":""
}],
["Delay", 2],
[2, 2, "StatusNotification", {
    "connectorId": 1,
    "errorCode":"NoError",
    "info":"NoInfo",
    "status":"Preparing",
    "timestamp":"",
    "vendorErrorCode":"",
    "vendorId":""
}]
```

- The second value is the number of seconds.

> *The delay has to be mentioned in the exact same format with different values for the seconds*

---

### Pause

- When a pause is specified in the payload file, the simulator stops sending payload for that chargepoint/connector until the user clicks on the chargepoint/connector button in the front end.
- The chargepoint/connector button is light blue in color when it is in pause mode.
- Example -

```json
["Pause"]
```

---

### RemoteStart and RemoteStop

- RemoteStart and RemoteStop can be used by adding `["Remote Start"]` or `["Remote Stop"]` to the payload file.
- The simulator waits for a RemoteStart/RemoteStop when `["Remote Start"]` or `["Remote Stop"]` is encountered.
- The connector button is black color when it is expecting remote start/stop.
- Once the RemoteStart/RemoteStop is triggered, the next payload in the payload file is sent i.e, usually the confirmation.
- The uniqueID of the next payload will the uniqueID of the RemoteStart/RemoteStop Request.
- Whenever a RemoteStop request is sent and the connector is still charging, it will stop charging and send the next payloads.
- Example -

```json
[2, "UniqueID", "StatusNotification", {
    "connectorId": 2,
    "errorCode":"NoError",
    "info":"NoInfo",
    "status":"Preparing",
    "timestamp":"",
    "vendorErrorCode":"",
    "vendorId":""
}],
["Remote Start"],
[3, "UniqueID", {"Status": "Accepted"}],
[2, "UniqueID", "StartTransaction", {
    "connectorId": 2,
    "idTag": "04DC3CBAAA5780",
    "timestamp": "",
    "meterStart": 0,
    "reservationId": 0
}]
```
---

### Disconnect

> Note: **This feature only works with a single connector for a chargepoint**. It might have issues with multiple connectors for a chargepoint.
- The chargepoint can be disconnected and reconnected during the execution of a charging flow by using `["Disconnect", NUMBER_OF_SECONDS_TO_RECONNECT]`.
- The second parameter is the number of seconds after which the chargepoint should reconnect. Once reconnected, the simulator will continue with the flow of execution from where it disconnected.
- A *BootNotification* payload can be placed after the *Disconnect* option. The simulator will treat it like any other payload and send it and receive the response.
- Once reconnected, the simulator will send the next payload from the Payload file.
> If the *Disconnect* is placed right after *Remote Start*/*Remote Stop*, there might be issues depending on when the remote start/remote stop is sent from the CMS i.e, if the remote start/stop is sent from the CMS before the disconnect happens but after the `["Remote Start"]` payload, it will not work. In this case - 
    ```
    ["Remote Start"],
    ["Disconnect", 30],
    [3, "UniqueID", { "status": "Accepted" }],
    ```
    In this case, it might not work.
    
- Example for normal usecase
```js
[2, "UniqueID", "StatusNotification", { 
        "connectorId": 1,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Preparing",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
    ["Disconnect", 30],
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 1,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Available",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
```

---

### Hearbeat

Once the `BootNotification` request is accepted for a chargepoint, the simulator sends the heartbeats at an interval defined by the `HeartBeat` parameter in the `CP-Config` of the chargepoint in *simulatorConfig.json*. If the `HeartBeat` is set to **0**, the simulator does not send any Heartbeat requests. The interval is defined in seconds.

---

### SoC AutoStop

The simulator supports SoC AutoStop for **DC** connectors. The SoC value is incremented only for DC connectors. The increment is only for **meterAuto**. The increment is based on the value of the SoC payload in the MeterValue request. Once it reaches **100**, the charging is stopped and the next payload in the file is sent. The next payload should be the `StopTransaction`/`Finishing StatusNotification` in a normal charging flow.

---

### Examples

- CPPayload -

```json
[
    [2, "UniqueID", "BootNotification", {
        "chargePointVendor": "Simulator",
        "chargePointModel": "HB4C",
        "chargePointSerialNumber": "",
        "chargeBoxSerialNumber": "hcsn002",
        "firmwareVersion": "1.0.49",
        "iccid": "",
        "imsi": "",
        "meterType": "DBT NQC-ACDC",
        "meterSerialNumber": "gir.vat.mx.000e48"
    }],
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 0,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Available",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }]
]
```

- ConnectorPayload -

```json
[
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 2,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Available",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
    ["Delay", 2], 
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 2,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Preparing",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
    ["Pause"],
    [2, "UniqueID", "Authorize", { 
        "idTag": "04DC3CBAAA5780" 
    }],
    [2, "UniqueID", "StartTransaction", {
        "connectorId": 2,
        "idTag": "04DC3CBAAA5780",
        "timestamp": "",
        "meterStart": 0,
        "reservationId": 0
    }],
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 2,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Charging",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
    [2, "UniqueID", "MeterValues", {
        "connectorId": 2, "transactionId": "", "meterValue":[
            {
                "timestamp": "",
                "sampledValue":[
                    {
                        "context":"Sample.Periodic",
                        "format":"Raw",
                        "measurand":"SoC",
                        "location":"EV",
                        "unit":"Percent",
                        "phase":null,
                        "value": "0"
                    }
                ]
            },
            {
                "timestamp": "",
                "sampledValue":[
                    {
                        "value": "0",
                        "context": "Sample.Periodic",
                        "format": "Raw",
                        "measurand": "",
                        "phase": "L1",
                        "location": "Outlet",
                        "unit": "Wh"
                    }
                ]
            }
        ]
    }],
    [2, "UniqueID", "Authorize", { 
        "idTag": "04DC3CBAAA5780" 
    }],
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 2,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Finishing",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }],
    [2, "UniqueID", "StopTransaction", { 
        "idTag": "04DC3CBAAA5780", 
        "meterStop": "", 
        "timestamp": "", 
        "transactionId": "" , 
        "reason":"Success"
    }],
    [2, "UniqueID", "StatusNotification", { 
        "connectorId": 2,
        "errorCode":"NoError",
        "info":"NoInfo",
        "status":"Available",
        "timestamp":"",
        "vendorErrorCode":"",
        "vendorId":""
    }]
]

```

---