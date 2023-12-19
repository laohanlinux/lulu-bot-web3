import config from "./config.toml";

import {
    ChainRestAuthApi,
    createTransaction,
    DEFAULT_STD_FEE,
    MsgSend,
    PrivateKey,
    TxClient,
    TxGrpcClient
} from '@injectivelabs/sdk-ts'
import {getNetworkInfo, Network} from "@injectivelabs/networks";
import {BigNumberInBase} from "@injectivelabs/utils";

export async function mintINJS(phrase: string) {
    // if (phrase.length == 0) {
    //     phrase = config.phrase;
    // }
    // if (phrase.length == 0) {
    //     console.log("未设置助记词");
    //     return
    // }
    let network =  getNetworkInfo(Network.Testnet);
    const privateKeyHash =
        'f9db9bf330e23cb7839039e944adef6e9df447b90b503d5b4464c90bea9022f3';
    const privateKey = PrivateKey.fromHex(privateKeyHash);
    const injectiveAddress = privateKey.toBech32();
    const publicKey = privateKey.toPublicKey().toBase64();

    const accountDetails = await new ChainRestAuthApi(network.rest).fetchAccount(
        injectiveAddress,
    )

    /** Prepare the Message */
    const amount = {
        amount: new BigNumberInBase(0.01).toWei().toFixed(),
        denom: 'inj',
    }

    const msg = MsgSend.fromJSON({
        amount,
        srcInjectiveAddress: injectiveAddress,
        dstInjectiveAddress: config.dstAddress,
    })

    /** Prepare the Transaction **/
    const { signBytes, txRaw } = createTransaction({
        message: msg,
        memo: '',
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

    /** Broadcast transaction */
    const txResponse = await txService.broadcast(txRaw)

    if (txResponse.code !== 0) {
        console.log(`Transaction failed: ${txResponse.rawLog}`)
    } else {
        console.log(
            `Broadcasted transaction hash: ${JSON.stringify(txResponse.txHash)}`,
        )
    }
}

export async function getInjsPrivateKey(phrase: string) {
    let index: string = config.minerIndex === undefined ? '0' : config.minerIndex.toString();
    const drivePath = "m/44'/60'/0'/0/${index}";
    return PrivateKey.fromMnemonic(phrase, drivePath)
}