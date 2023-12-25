import config from "./config.toml";

import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {SuiClient} from '@mysten/sui.js/client';
import { TransactionBlock } from "@mysten/sui.js/transactions";


export class SuiCtx {
    protected client: SuiClient;
    protected wallet: Ed25519Keypair;
    // 构造函数
    constructor(client: SuiClient, wallet: Ed25519Keypair) {
        this.client = client;
        this.wallet = wallet;
    }

    public GetClient() {
        return this.client
    }

    public GetWallet() {
        return this.wallet
    }

    public async GetMySuiBalance() {
        return this.GetBalance("0x2::sui::SUI")
    }

    public async GetBalance(coinType: string) {
        const rsp = await this.client.getCoins({owner: this.wallet.toSuiAddress(), coinType: coinType});
        let Q = BigInt(0);
        for (const se of rsp.data) {
            Q = Q + BigInt(se.balance);
        }
        return Q;
    }
}


export async function mintSuIRC20(phrase: string) {
    if (phrase.length == 0) {
        phrase = config.phrase;
    }
    if (phrase.length == 0) {
        console.log("未设置助记词");
        return
    }
    const path = `m/44'/784'/${config.minerIndex}'/0'/0'`;
    const wallet = GetSuiWallet(phrase, path);
    const client = new SuiClient({url: config.endPoint});
    let ctx = new SuiCtx(client, wallet);
    console.log(ctx.GetWallet().toSuiAddress(), "balance:", await ctx.GetMySuiBalance());

    let tx = new TransactionBlock();
    const r = tx.splitCoins(tx.gas, [0]);
    // PacketId + Module + Function
    const target = "0x2dd4e2523c0121c7e8405977e1d3909a8631df313934e965c472efc941ee3484::Operation::mint";
    const data = "{\"p\":\"suirc-20\",\"tick\":\"ShiB\",\"op\":\"mint\",\"amt\":\"100\"}";
    const moveRes = tx.moveCall({
        target: target,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [r, tx.pure(data, "0x1::string::String")]
    });
    console.log(moveRes);
    const result = await ctx.GetClient().signAndExecuteTransactionBlock({signer: ctx.GetWallet(), transactionBlock: tx});
    console.log(result);
}


export function GetSuiWallet(phrase: string, path: string) {
    return Ed25519Keypair.deriveKeypair(phrase.trim(),path)
}



function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


export default {
    //get_sui_price, coin_type_sui, coin_type_usdc, coin_type_usdt, getRandomInt,
    //get_coin_balance, get_balance_ok_coin,
};
