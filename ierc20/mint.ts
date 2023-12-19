import {HDNodeWallet, JsonRpcProvider, Transaction} from "ethers";

const ethers = require('ethers');
import config from "./config.toml"

export async function mineIERC20(phrase: string) {
    if (phrase.length == 0) {
        phrase = config.phrase;
    }
    if (phrase.length == 0) {
        console.log("未设置助记词");
        return
    }
    const provider = new JsonRpcProvider(config.endPoint);
    const hdWallet = getWallet(phrase, config.minerIndex).connect(provider);
    const nonce = await provider.getTransactionCount(hdWallet.address);
    let i = 0;
    while (!(await transfer(hdWallet, nonce))) {
        i++;
        console.log(`第${i}次尝试`);
    }
}

async function transfer(hdWallet: HDNodeWallet, nonce: Number | null) {
    const gas = '60'
    let time = Math.round(new Date().getTime() / 1000) + generateRandomDigits(5)
    const dataString = `data:application/json,{"p":"${config.posy.p}","op":"mint","tick":"${config.posy.tick}","amt":"${config.posy.amt}","nonce":"${time}"}`;
    const dataHex = Buffer.from(dataString, "utf8").toString("hex");
    const tx = {
        from: hdWallet.address,
        gasLimit: config.gasLimit,
        chainId: config.chainId,
        type: 2,
        maxPriorityFeePerGas: ethers.parseUnits(gas, 'gwei'),
        maxFeePerGas: ethers.parseUnits(gas, 'gwei'),
        to: `0x0000000000000000000000000000000000000000`,
        data: "0x" + dataHex,
        nonce: nonce,
    };
    let signHash = await hdWallet.signTransaction(tx);
    const txx = Transaction.from(signHash);
    const parsedTx = txx.hash;
    console.log("hash", parsedTx)
    console.log(tx);
    if (parsedTx.substring(0, 6) == '0x0000') {
        console.log('\x1b[32m', nonce + "---->https://etherscan.io/tx/" + parsedTx, '\x1b[0m');
        try {
            const txResponse = await hdWallet.sendTransaction(tx);
            console.log('\x1b[32m', txResponse.hash, '\x1b[0m');
        } catch (error) {
            console.log("failed to send transaction", error);
        }
        return true
    } else {
        return false
    }
}


function getWallet(phrase: string, index: number) {
    const path = `m/44'/60'/0'/0/${index}`;
    return HDNodeWallet.fromPhrase(phrase, "", path)
}

function generateRandomDigits(length: number) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}