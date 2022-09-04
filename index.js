#!/usr/bin/env node

const ethers = require('ethers');
const http = require('http');

const host = process.env.ETH_RPC_HOST || 'localhost';
const rpc_port=process.env.ETH_RPC_PORT || 8545;
const rpc_external = process.env.ETH_RPC_EXTERNAL || 'https://rpc.ankr.com/eth';
const local_port=process.env.ETH_MONITOR_PORT || 50000;
const max_difference=process.env.MAX_BLOCK_DIFFERENCE || 3;

const provider = new ethers.providers.JsonRpcProvider(rpc_external);
const localProvider = new ethers.providers.JsonRpcProvider(`http://${host}:`+rpc_port);

localProvider.connection.timeout = 5000;

const onHealthcheckRequest = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log('>> checking '+host+':'+rpc_port+' ('+rpc_external+') ');

  let localBlockNum;
  let networkBlockNum;

  try {
    localBlockNum = await localProvider.getBlockNumber();
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end();
    return
  }

  try {
    networkBlockNum = await provider.getBlockNumber();
  } catch (e) {
    console.error("Error for remote RPC: ", e);
    res.writeHead(localBlockNum !== 0? 200:500, { 'Content-Type': 'text/plain' });
    res.end();
    return
  }

  let responseStatus = networkBlockNum - localBlockNum > max_difference ? 500 : 200;

  res.writeHead(responseStatus, { 'Content-Type': 'text/plain' });
  res.end((localBlockNum - networkBlockNum).toString());
};

console.log('Starting eth monitoring service for '+host+':'+rpc_port+' on ' + local_port + '...');
http.createServer(onHealthcheckRequest).listen(local_port);