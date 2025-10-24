require('dotenv').config();
const { execSync } = require('child_process');

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// execSync(`forge script script/Deploy.s.sol --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast`, { stdio: 'inherit' });
// execSync(`forge script script/AddLiquidityV3.s.sol --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast`, { stdio: 'inherit' });
// execSync(`forge script script/DeploySimpleSwap.s.sol:DeploySimpleSwap --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast --verify`, { stdio: 'inherit' });
execSync(`forge create --broadcast --verify --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} src/contracts/SimpleOracle.sol:ERC20Oracle --constructor-args 0x0077a8005D7B0f9412ECF88E21f7c5018bd61c94`, { stdio: 'inherit' });