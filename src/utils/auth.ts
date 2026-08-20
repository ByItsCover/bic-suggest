import { parse } from "uuid";

const toHex = (uuid: string) => {
    return uuid.replaceAll("-", "");
}

const toBytes = (uuid: string) => {
    return parse(uuid);
}

const idsAreEqual = (uid1: Uint8Array, uid2: Uint8Array) => {
    if (uid1.length != uid2.length) {
        return false;
    }

    for (let i = 0; i < uid1.length; i++) {
        if (uid1[i] != uid2[i]) {
            return false;
        }
    }

    return true;
}

export { toHex, toBytes, idsAreEqual };
