const { task } = require("hardhat/config");
require("dotenv").config()
const { BigNumber } = require("ethers");
const distributor = require("./distributor")
const arb = require("./arb")

const {ARB_PROVIDER, ETH_PROVIDER} = process.env

// 从 .env 文件中读取主钱包和批量钱包的私钥
const mainWalletPrivateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
const batchWalletsPrivateKeys = process.env.PRIVATE_KEYS.split(",");

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

task("claim", "", async (taskArgs, hre) => {
    const arbProvider = new hre.ethers.providers.JsonRpcProvider(ARB_PROVIDER);
    const ethProvider = new hre.ethers.providers.JsonRpcProvider(ETH_PROVIDER);
    // 主钱包实例
    const mainWallet = new ethers.Wallet(mainWalletPrivateKey, provider);
    // 用于转账的gas
    const transferAmount = ethers.utils.parseEther("0.005");
    const decimals = BigNumber.from(10).pow(18);
    const START_BLOCK = 16890400;

    let claim = async (key) => {
        const signer = new hre.ethers.Wallet(key, arbProvider);
        //1.转gas到目标钱包
        let tx = {
            to: signer.address,
            value: transferAmount,
        };
        try {
            const txResponse = await mainWallet.sendTransaction(tx);
            console.log("Transaction hash:", txResponse.hash);
        } catch (error) {
            console.error(`Error sending transaction to ${signer.address}:`, error.message);
        }
        //调用claim
        const dis = new ethers.Contract(distributor.address, distributor.abi, signer);
        let claimable = (await dis.claimableTokens(signer.address))
        if (claimable.isZero()) {
            console.log(`No claimable $ARB for ${signer.address}`)
        } else {
            tx = await dis.claim()
            await tx.wait()
            console.log(`claim ${claimable.div(decimals)} $ARB for ${signer.address}`)
        }
        //转移代币
        if (taskArgs.receiver !== "") {
            try{
                const token = new ethers.Contract(arb.address, arb.abi, signer);
                tx = await token.transfer(taskArgs.receiver, claimable);
                await tx.wait();
                console.log(`transfer ${claimable.div(decimals)} $ARB to ${taskArgs.receiver} for ${signer.address}`);   
            }catch(error){
                console.error(`Error transferring tokens to main wallet from ${signer.address}:`, error.message);
            }
        }
        return claimable.div(decimals)
    }

    while (true) {
        //获取L1的区块地址
        const current = await ethProvider.getBlockNumber()
        if (current < START_BLOCK) {
            console.log(`Curent height ${current} waiting for block ${START_BLOCK}...`)
            await sleep(3)
            continue;
        }
        console.log("Start claiming...")
        let total = BigNumber.from(0)
        let jobs = [];
        for (let key of batchWalletsPrivateKeys) {
            jobs.push(claim(key))
        }
        let reulst = await Promise.all(jobs)
        for (let r of reulst) {
            total = total.add(r)
        }
        console.log(`Claimed total ${total} $ARB`)
        return;
    }
}).addParam("receiver", "My Receiver Address!", "")

task("approve", "", async (taskArgs, hre) => {
    const provider = new hre.ethers.providers.JsonRpcProvider(ARB_PROVIDER)

    for (let key of ARB_PRIVATE_KEYS.split(",")) {
        const signer = new hre.ethers.Wallet(key, provider)
        const dis = new ethers.Contract(distributor.address, distributor.abi, signer)
        const token = new ethers.Contract(arb.address, arb.abi, signer)
        const claimable = (await dis.claimableTokens(signer.address))
        let tx = await token.approve(taskArgs.spender, claimable);
        await tx.wait();
        console.log(`approve ${claimable} $ARB for ${signer.address}`)
    }
}).addParam("spender", "The address of the spender")
