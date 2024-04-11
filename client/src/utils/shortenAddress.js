export const shortenAddress = (address,s) => {
    return address?address.slice(0,s)+"..."+address.slice(-s,address.length):"";
}