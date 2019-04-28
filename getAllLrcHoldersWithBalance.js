const _ = require("lodash");
const Promise = require("bluebird");
const async = require("async");
const fs = require("fs");
const lineReader = require("line-reader");

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/hM4sFGiBdqbnGTxk5YT2"));
// const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://13.230.23.98:8546'));
// const web3 = new Web3(new Web3.providers.HttpProvider("http://13.230.23.98:8545"));
// web3.setProvider(new Web3.providers.WebsocketProvider('ws://localhost:8546'));

// const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hM4sFGiBdqbnGTxk5YT2"));

const lrcAbi = '[{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"bonusPercentages","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"DECIMALS","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"BLOCKS_PER_PHASE","outputs":[{"name":"","type":"uint16"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"MAX_UNSOLD_RATIO","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"HARD_CAP","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"BASE_RATE","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"close","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleStarted","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"issueIndex","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"recipient","type":"address"}],"name":"issueToken","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_firstblock","type":"uint256"}],"name":"start","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"hardCapReached","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleEnded","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"unsoldTokenIssued","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"price","outputs":[{"name":"tokens","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"GOAL","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"NAME","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalEthReceived","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleDue","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"target","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"NUM_OF_PHASE","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"firstblock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"SYMBOL","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"inputs":[{"name":"_target","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[],"name":"SaleStarted","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"caller","type":"address"}],"name":"InvalidCaller","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"msg","type":"bytes"}],"name":"InvalidState","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"issueIndex","type":"uint256"},{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"ethAmount","type":"uint256"},{"indexed":false,"name":"tokenAmount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleSucceeded","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'; // tslint:disable-line

const lrcAddr = "0xef68e7c694f40c8202821edf525de3782458639f";
const lrcToken = new web3.eth.Contract(JSON.parse(lrcAbi), lrcAddr);

const destBlock = 7628936;

const eachLine = Promise.promisify(lineReader.eachLine);

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms);
  });
}

async function makeBatchRequest(calls, callFrom) {
  let batch = new web3.BatchRequest();
  let promises = calls.map(call => {
    return new Promise((resolve, reject) => {
      let request = call.request({from: callFrom}, 'latest', (error, data) => {
        if(error) {
          reject(error);
        } else {
          console.log("balance:", data.toString(10));
          resolve(data.toString(10));
        }
      });
      batch.add(request);
    });
  });

  batch.execute();
  return await Promise.all(promises);
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

async function getBalanceOfHolders(addressesFile, destFile) {
  console.log("query balance:", addressesFile, "->", destFile);

  const allAddrs = [];
  let i = 0;
  await eachLine(addressesFile, async function(line) {
    const addr = line.trim();
    allAddrs.push(addr);
    try {
      const balance = await lrcToken.methods.balanceOf(addr).call({}, destBlock);
      if (balance > 0) {
        const balanceStr = balance.toString(10);
        const destLine = addr + "," + balanceStr + "\n";
        fs.appendFileSync(destFile, destLine);

        i ++;
        console.log(destLine);

        sleep(100);

        if (i % 100 === 0) {
          console.log("query balance:", i, "addresses processed!");
          sleep(2000);
        }
      }
    } catch (err) {
      console.log("error:", err);
      return;
    }
  });

  // const batchSize = 100;
  // const requestAddrs = allAddrs.slice(0, 100);
  // const from = "0x" + "00".repeat(20);
  // for (let i = 0; i < requestAddrs.length; i += batchSize) {
  //   const batch = new web3.BatchRequest();
  //   const calls = [];
  //   for (let j = i; j < i + batchSize; j++) {
  //     // console.log("requestAddrs[j]:", requestAddrs[j]);
  //     calls.push(lrcToken.methods.balanceOf(requestAddrs[j]).call);
  //   }

  //   await makeBatchRequest(calls, from);

  //   // console.log("res:", res);
  //   // res.forEach((n) => console.log(n));
  // }

}

async function main() {
  const holdersFile = "holders-all-0424-lower-uniq.txt";
  const balanceFile = "LRC_holders_with balance_all.csv" + ".0428";

  await getBalanceOfHolders(holdersFile, balanceFile);
}

main();
