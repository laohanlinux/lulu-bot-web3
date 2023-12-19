import {Command} from "commander";

import {
    DecryptDataWithPrivateKey,
    DecryptedFile,
    EncryptDataWithPublicKey,
    EncryptFile,
    GetKeyPair
} from "./rsa/crypto_rsa";
import {getCelestiaWallet, loadPhraseFromConfig, transferCelestia} from "./cias/mint";
import {mineIERC20} from "./ierc20/mint.ts";
import * as path from "path";
import {mintINJS} from "./injs/mint.ts";

const program = new Command();
program.name('bot')
    .description('A bot Cli to do web3')
    .version('0.0.1')


program.command("injs")
    .description("mint injs")
    .option("-e, --endpoint <string>", 'rpc-node', 'https://public-celestia-rpc.numia.xyz')
    .option("-w, --wallet <string>", 'wallet', '')
    .option("-k, --key <string>", 'rsa private key for decrypt wallet', 'id_rsa')
    .action(async (opts) => {
        let phrase = '';
        if (opts.wallet.length > 0) {
            phrase = (await DecryptedFile(opts.wallet, opts.key)).toString('utf-8').trim();
        }
        await mintINJS(phrase);
    });
program.command("cias-20")
    .description("mint cias")
    .option("-e, --endpoint <string>", 'rpc-node', 'https://public-celestia-rpc.numia.xyz')
    .option("-w, --wallet <string>", 'wallet', '')
    .option("-k, --key <string>", 'rsa private key for decrypt wallet', 'id_rsa')
    .action(async (opts) => {
        let phrase = '';
        if (opts.wallet.length > 0) {
            phrase = (await DecryptedFile(opts.wallet, opts.key)).toString('utf-8').trim();
        } else {
            phrase = await loadPhraseFromConfig();
        }
        if (phrase.length <= 0) {
            console.log("助记词未设置");
            return
        }
        let wallet = await getCelestiaWallet(phrase);
        await transferCelestia(wallet);
    });

program.command('ierc-20')
    .description('mint ierc20')
    .option('-w, --wallet <string>', 'wallet')
    .option('-k, --key <string>', 'rsa private key for decrypt wallet', 'id_rsa')
    .action(async (opts) => {
        let phrase = (await DecryptedFile(opts.wallet, opts.key)).toString('utf-8').trim();
        await mineIERC20(phrase);
    });

program.command('encrypt-file')
    .description('encrypt a file with rsa')
    .option('-i, --input <string>', 'input file path')
    .option('-spub, --spublic-key <string>', 'ssh public key', 'id_rsa.pub')
    .option('-d, --dst <string>', 'dst file path', 'rsa_encrypted')
    .action(async (arg) => {
        await EncryptFile(arg.input, arg.dst, arg.spublicKey);
    });

program.command('generate-rsa')
    .description('generate a rsa keypair')
    .option('-t, test <type>', 'test encrypt and decrypt', false)
    .option('-s, --save <type>', 'save the keypair', false)
    .option('--payload <type>', 'test encrypt payload', 'hello word')
    .action(async (opts) => {
        var kp = await GetKeyPair();
        if (opts.save) {
            await Bun.write('id_rsa.0', kp.privateKey.export());
            await Bun.write('id_rsa.pub.0', kp.publicKey.export());
        }
        if (opts.test) {
            const publKey = await Bun.file('id_rsa.pub.0').text();
            const privKey = await Bun.file('id_rsa.0').arrayBuffer();
            const encryptData = await EncryptDataWithPublicKey(Buffer.from(publKey), Buffer.from(opts.payload));
            await Bun.write('tmp.encrypt', encryptData);
            const load = await Bun.file('tmp.encrypt').arrayBuffer();
            const decryptedData = await DecryptDataWithPrivateKey(Buffer.from(privKey), load);
            if (decryptedData.toString('utf-8') != opts.payload) {
                console.log('it should be not happen', decryptedData.toString('utf-8'), opts.payload);
            }
        }
    });


program.parse(process.argv);
