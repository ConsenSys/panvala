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
      return ipfs.cat(multihash, (err: any, result: string) => {
        if (err) {
          reject(new Error(`IPFS get: ${err.message}`));
        }

        try {
          const data = JSON.parse(result);
          resolve(data);
        } catch (error) {
          reject(new Error(`IPFS get: ${error.message}`));
        }
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

    return ipfs.add(data, (err: any, result: any[]) => {
      if (err) {
        const msg = `IPFS add: ${err.message}`;
        reject(new Error(msg));
      }

      try {
        // Returns an array of objects (for each file added) with keys hash, path, size
        const { hash } = result[0];
        resolve(hash);
      } catch (error) {
        reject(new Error(`IPFS add: ${error.message}`));
      }
    });
  });
  console.log('CID:', CID);
  return CID;
}
