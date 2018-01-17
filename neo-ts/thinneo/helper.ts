﻿module ThinNeo {

    export class Helper {
        public static GetPrivateKeyFromWIF(wif: string): Uint8Array {
            if (wif == null) throw new Error("null wif");
            var data = Neo.Cryptography.Base58.decode(wif);
            //检查标志位
            if (data.length != 38 || data[0] != 0x80 || data[33] != 0x01)
                throw new Error("wif length or tag is error");
            //取出检验字节
            var sum = data.subarray(data.length - 4, data.length);
            var realdata = data.subarray(0, data.length - 4);

            //验证,对前34字节进行进行两次hash取前4个字节
            var _checksum = Neo.Cryptography.Sha256.computeHash(realdata);
            var checksum = new Uint8Array(Neo.Cryptography.Sha256.computeHash(_checksum));
            var sumcalc = checksum.subarray(0, 4);

            for (var i = 0; i < 4; i++) {
                if (sum[i] != sumcalc[i])
                    throw new Error("the sum is not match.");
            }

            var privateKey = data.subarray(1, 1 + 32);
            return privateKey;
        }
        public static GetPublicKeyFromPrivateKey(privateKey: Uint8Array): Uint8Array {
            var pkey = Neo.Cryptography.ECPoint.multiply(Neo.Cryptography.ECCurve.secp256r1.G, privateKey);
            return pkey.encodePoint(true);
        }
        public static GetAddressCheckScriptFromPublicKey(publicKey: Uint8Array): Uint8Array {
            var script = new Uint8Array(publicKey.length + 2);
            script[0] = publicKey.length;
            for (var i = 0; i < publicKey.length; i++) {
                script[i + 1] = publicKey[i];
            };
            script[script.length - 1] = 172;//CHECKSIG
            return script;
        }
        public static GetPublicKeyScriptHashFromPublicKey(publicKey: Uint8Array): Uint8Array {
            var script = Helper.GetAddressCheckScriptFromPublicKey(publicKey);
            var scripthash = Neo.Cryptography.Sha256.computeHash(script);
            scripthash = Neo.Cryptography.RIPEMD160.computeHash(scripthash);
            return new Uint8Array(scripthash);
        }
        public static GetAddressFromScriptHash(scripthash: Uint8Array): string {
            var data = new Uint8Array(scripthash.length + 1);
            data[0] = 0x17;
            for (var i = 0; i < scripthash.length; i++) {
                data[i + 1] = scripthash[i];
            }
            var hash = Neo.Cryptography.Sha256.computeHash(data);
            hash = Neo.Cryptography.Sha256.computeHash(hash);
            var hashu8 = new Uint8Array(hash, 0, 4);

            var alldata = new Uint8Array(data.length + 4);
            for (var i = 0; i < data.length; i++) {
                alldata[i] = data[i];
            }
            for (var i = 0; i < 4; i++) {
                alldata[data.length + i] = hashu8[i];
            }
            return Neo.Cryptography.Base58.encode(alldata);
        }
        public static GetAddressFromPublicKey(publicKey: Uint8Array): string{
            var scripthash = Helper.GetPublicKeyScriptHashFromPublicKey(publicKey);
            return Helper.GetAddressFromScriptHash(scripthash);
        }
        public static GetPublicKeyScriptHash_FromAddress(address: string): Uint8Array {
            var array: Uint8Array = Neo.Cryptography.Base58.decode(address);

            var salt = array.subarray(0, 1);
            var hash = array.subarray(1, 1 + 20);
            var check = array.subarray(21, 21 + 4);

            var checkdata = array.subarray(0, 21);
            var hashd = Neo.Cryptography.Sha256.computeHash(checkdata);
            hashd = Neo.Cryptography.Sha256.computeHash(hashd);
            var hashd = hashd.slice(0, 4);
            var checked = new Uint8Array(hashd);

            for (var i = 0; i < 4; i++) {
                if (checked[i] != check[i]) {
                    throw new Error("the sum is not match.");
                }
            }
            return hash;
        }
    }
}