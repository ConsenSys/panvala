const IPFS = require('ipfs-mini');

const ipfsHost = process.env.IPFS_HOST || 'ipfs.infura.io';
const ipfsPort = process.env.IPFS_PORT || 5001;

const ipfs = new IPFS({ host: ipfsHost, port: ipfsPort, protocol: 'https' });

async function get(multihash) {
  return new Promise((resolve, reject) => {
    ipfs.catJSON(multihash, (err, result) => {
      if (err) reject(new Error(err));
      resolve(result);
    });
  });
}

module.exports = {
  get,
};
