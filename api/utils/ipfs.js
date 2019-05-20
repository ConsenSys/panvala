const IPFS = require('ipfs-http-client');

const ipfsHost = process.env.IPFS_HOST || 'ipfs.infura.io';
const ipfsPort = process.env.IPFS_PORT || 5001;

const ipfs = new IPFS({ host: ipfsHost, port: ipfsPort, protocol: 'https' });

/**
 * Get a file from IPFS
 * Options:
 *   {Boolean} json Whether to parse as JSON
 * @param {String} multihash
 * @param {Object} options
 */
async function get(multihash, options) {
  const json = options.json || false;

  return new Promise((resolve, reject) => {
    ipfs.cat(multihash, (err, result) => {
      if (err) reject(new Error(err));
      let data;
      if (json) {
        try {
          data = JSON.parse(result);
        } catch (error) {
          console.log("error.message:", error.message);
          reject(new Error(`error while trying to parse result: ${error.message}`));
        }
      } else {
        data = result;
      }
      resolve(data);
    });
  });
}

module.exports = {
  get,
};
