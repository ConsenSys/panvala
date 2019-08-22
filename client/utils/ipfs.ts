const IPFS = require('ipfs-http-client');
const isIPFS = require('is-ipfs');

const ipfs: any = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

export function ipfsCheckMultihash(multihash: string): boolean | Error {
  if (isIPFS.multihash(multihash)) {
    return true;
  }
  throw new Error('invalid multihash');
}

/**
 * Get data as JSON
 */
export async function ipfsGetData(multihash: string) {
  if (ipfsCheckMultihash(multihash)) {
    return new Promise((resolve, reject) => {
      ipfs.cat(multihash, (err: any, result: string) => {
        if (err) reject(new Error(err));

        if (!result) {
          reject(new Error('Ipfs.get returned undefined.'));
        }
        const data = JSON.parse(result);
        resolve(data);
      });
    });
  }
}

/**
 * Add JSON data and return the multihash
 */
export async function ipfsAddObject(obj: any): Promise<string> {
  const CID: string = await new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(obj));

    ipfs.add(data, (err: any, result: any[]) => {
      if (err) reject(new Error(err));

      if (!result) {
        reject(new Error('Ipfs.get returned undefined.'));
      }
      // Returns an array of objects (for each file added) with keys hash, path, size
      const { hash } = result[0];
      resolve(hash);
    });
  });
  console.log('CID:', CID);
  return CID;
}
