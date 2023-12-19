import config from "./config.toml";

import {
    BaseAccount,
    ChainRestAuthApi,
    createTransaction,
    DEFAULT_STD_FEE, IndexerGrpcAccountApi,
    MsgSend,
    PrivateKey,
    TxClient,
    TxGrpcClient
} from '@injectivelabs/sdk-ts'
import {getNetworkEndpoints, getNetworkInfo, Network} from "@injectivelabs/networks";
import {BigNumberInBase} from "@injectivelabs/utils";


export async function mintINJS(phrase: string) {
    if (phrase.length == 0) {
        phrase = config.phrase;
    }
    if (phrase.length == 0) {
        console.log("未设置助记词");
        return
    }
    let network = getNetworkInfo(Network.MainnetSentry);
    console.log(network);
    const privateKey = getInjsPrivateKey(phrase);
    const injectiveAddress = privateKey.toBech32();
    console.log(privateKey.toAddress().toAccountAddress());
    const publicKey = privateKey.toPublicKey().toBase64();
    const accountDetails = await new ChainRestAuthApi(network.rest).fetchAccount(
        injectiveAddress,
    )

    /** Prepare the Message */
    const amount = {
        amount: new BigNumberInBase(0.03).toWei().toFixed(),
        denom: 'inj',
    }

    const msg = MsgSend.fromJSON({
        amount,
        srcInjectiveAddress: injectiveAddress,
        dstInjectiveAddress: config.dstAddress,
    })

    const memo = `data:,{"p":"injrc-20","op":"mint","tick":"INJS","amt":"2000"}`;
    const dataHex = Buffer.from(memo, "utf8").toString("hex");

    /** Prepare the Transaction **/
    const {signBytes, txRaw} = createTransaction({
        message: msg,
        memo: dataHex,
        fee: DEFAULT_STD_FEE,
        pubKey: publicKey,
        sequence: parseInt(accountDetails.account.base_account.sequence, 10),
        accountNumber: parseInt(
            accountDetails.account.base_account.account_number,
            10,
        ),
        chainId: network.chainId,
    })

    /** Sign transaction */
    const signature = await privateKey.sign(Buffer.from(signBytes))

    /** Append Signatures */
    txRaw.signatures = [signature]

    /** Calculate hash of the transaction */
    console.log(`Transaction Hash: ${TxClient.hash(txRaw)}`)

    const txService = new TxGrpcClient(network.grpc)

    /** Simulate transaction */
    const simulationResponse = await txService.simulate(txRaw)
    console.log(
        `Transaction simulation response: ${JSON.stringify(
            simulationResponse.gasInfo,
        )}`,
    )

    // /** Broadcast transaction */
    // const txResponse = await txService.broadcast(txRaw)
    //
    // if (txResponse.code !== 0) {
    //     console.log(`Transaction failed: ${txResponse.rawLog}`)
    // } else {
    //     console.log(
    //         `Broadcasted transaction hash: ${JSON.stringify(txResponse.txHash)}`,
    //     )
    // }
}

function getInjsPrivateKey(phrase: string) {
    let index: string = config.minerIndex === undefined ? '0' : config.minerIndex.toString();
    const drivePath = "m/44'/60'/0'/0/" + index.toString();
    return PrivateKey.fromMnemonic(phrase, drivePath)
}
