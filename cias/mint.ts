import {coins, DirectSecp256k1Wallet} from "@cosmjs/proto-signing";
import {GasPrice, SigningStargateClient} from "@cosmjs/stargate";
import {base64FromBytes} from 'cosmjs-types/helpers';
import {StdFee} from '@cosmjs/amino';

const {DirectSecp2561Wallet} = import("@cosmjs/proto-signing");
import cosmos from 'cosmos-lib';
import config from './config.toml';
import {sleep} from "bun";

export async function loadPhraseFromConfig() {
    return config.Phrase
}

export async function transferCelestia(wallet: DirectSecp256k1Wallet) {
    const cfg = {
        endpoint: config.endpoint,
        denom: config.TokenDenom,
        symBol: config.ChainSymBol,
        decimal: config.TokenDecimal,
        gasLimit: config.GasLimit,
        gasPrice: config.GasPrice,
        posy: {
            amt: config.posy.Amt,
            tick: config.posy.Tick,
            p: config.posy.Protol,
        },
        mintTines: config.MintTimes,
    };
    const gasPrice = GasPrice.fromString(`0.025${cfg.denom}`);
    const amount = coins(1, cfg.denom);
    const [myAccount] = await wallet.getAccounts()
    const payload = `data:,{"op":"mint","amt":${cfg.posy.amt},"tick":"${cfg.posy.tick}","p":"${cfg.posy.p}"}`;
    const hexPayload = base64FromBytes(Buffer.from(payload, 'utf8'));
    const client = await SigningStargateClient.connectWithSigner(cfg.endpoint, wallet, {gasPrice: gasPrice})

    const fee = {
        amount: coins(cfg.gasPrice, cfg.denom),
        gas: "100000",
    };
    console.log(`当前挖矿地址:${myAccount.address}`);
    for (let i = 1; i <= cfg.mintTines; i++) {
        const balance = await client.getBalance(myAccount.address, cfg.denom);
        console.log(`${i}次挖矿，剩余金额：${balance.amount / 1e6}`)
        console.log(`${payload}`);
        console.log(`${hexPayload}`);
        try {
            let res = await client.sendTokens(myAccount.address, myAccount.address, amount, fee, hexPayload)
            console.log(`${`https://www.mintscan.io/${cfg.symBol}/tx/` + res.transactionHash}`);
        } catch (e) {
            console.error(e);
        }
        await sleep(200);
    }
}

export async function getCelestiaWallet(phrase: string) {
    let index: string = config.MinerIndex === undefined ? '0' : config.MinerIndex.toString();
    const drivePath = "44'/118'/0'/0/" + index;
    let kp = cosmos.crypto.getKeysFromMnemonic(phrase, drivePath);
    return await DirectSecp256k1Wallet.fromKey(Buffer.from(kp.privateKey), 'celestia')
}

export async function getCelestiaWallets(phrase: string, n = 20) {
    let wallets = [];
    for (let i = 0; i < n; i++) {
        const wallet = await getCelestiaWallet(phrase, i);
        wallets.push(wallet);
    }
    return wallets;
}
