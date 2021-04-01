const supertest = require('supertest'),
    chai = require('chai'),
    expect = chai.expect


const {spawn} = require('child_process');

const request = supertest('https://testcms1.numocity.com:9091/api/v2/ocpp/remotetransaction/');

function ending(){
  return new Promise((resolve)=>{
    const child = spawn('bash',['stop-sim.sh']);
    child.stdout.on('data',(chunk)=>{
      chunk = chunk.toString();
      console.log(`killing process with PID: ${chunk}`);

    });
  });
}

startSimulator();

function startSimulator(){
  return new Promise((resolve)=>{
    const child = spawn('bash',['start-sim.sh']);

    child.stdout.on('data',(chunk)=>{
      
      chunk = chunk.toString();
      
      console.log(`simulator says: ${chunk}`);

    //=======================
      if(chunk.includes("Stopped charging for Testcharge001's connector 1")){
     
        ending();    
    }
    //=========================

    });

  });
}

