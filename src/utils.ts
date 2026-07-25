const toHex = (uuid: string) => {
    return uuid.replaceAll("-", "");
}

export { toHex };
