require('dotenv').config();
const { execSync } = require('child_process');

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

execSync(`forge script script/Deploy.s.sol --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast`, { stdio: 'inherit' });
