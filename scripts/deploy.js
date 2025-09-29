const hre = require('hardhat');
//Remplacer par foundry


async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with', deployer.address);


    const KYC = await hre.ethers.getContractFactory('KYCRegistry');
    const kyc = await KYC.deploy();
    await kyc.deployed();
    console.log('KYC deployed', kyc.address);


    const Token = await hre.ethers.getContractFactory('WhitelistedERC20');
    const token = await Token.deploy('DemoAsset', 'dAST', kyc.address);
    await token.deployed();
    console.log('Token deployed', token.address);


    const NFT = await hre.ethers.getContractFactory('WhitelistedERC721');
    const nft = await NFT.deploy('DemoNFT', 'dNFT', kyc.address);
    await nft.deployed();
    console.log('NFT deployed', nft.address);


    const Oracle = await hre.ethers.getContractFactory('SimplePriceOracle');
    const oracle = await Oracle.deploy();
    await oracle.deployed();
    console.log('Oracle deployed', oracle.address);


    // set deployer as admin & whitelist
    await kyc.setAdmin(deployer.address, true);
    await kyc.setWhitelisted(deployer.address, true);


    // mint tokens to deployer
    await token.mint(deployer.address, hre.ethers.parseUnits('100000', 18));


    console.log('Deployed addresses:');
    console.log({ kyc: kyc.address, token: token.address, nft: nft.address, oracle: oracle.address });
}

main().catch((e)=>{ console.error(e); process.exitCode=1; });
