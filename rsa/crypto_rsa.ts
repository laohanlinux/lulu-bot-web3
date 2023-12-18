const crypto = await import('crypto');


export async function EncryptDataWithPublicKey(publicKey: Buffer, data: Buffer) {
    return crypto.publicEncrypt(publicKey, new Uint8Array(data))
}

export async function DecryptDataWithPrivateKey(privateKey: Buffer, data: ArrayBuffer) {
    return crypto.privateDecrypt(privateKey, new Uint8Array(data))
}

export async function EncryptFile(src: string, dst: string, publicKeyPath: string) {
    const data = new Uint8Array(await Bun.file(src).arrayBuffer());
    const pem = (await (Bun.file(publicKeyPath).text())).trim();
    const encryptedData = crypto.publicEncrypt(pem, Buffer.from(data));
    await Bun.write(dst, encryptedData);
}

export async function DecryptedFile(src: string, sshKey: string) {
    const data = new Uint8Array(await Bun.file(src).arrayBuffer());
    const pem = await (Bun.file(sshKey).text());
    return crypto.privateDecrypt(pem, data)
}

async function aes256(fpath: string, out: string) {
    const algo = 'aes-256-cbc';
    const secretKey = (crypto).randomBytes(32);
    const iv = (crypto).randomBytes(16);
    const cipher = (crypto).createCipheriv(algo, secretKey, iv);
    const input = await Bun.file(fpath).arrayBuffer();
    cipher.update(new Uint8Array(input));
    return cipher.final()
}

async function hmac(fpath: string) {
    const input = Bun.file(fpath);
    const secret = 'typescript-language-server';
    const hash = (crypto).createHmac('sha256', secret).update(await input.text()).digest('hex');
    console.log(hash);
}

export async function GetKeyPair() {
    return crypto.generateKeyPairSync('rsa', {modulusLength: 2048,})
}
