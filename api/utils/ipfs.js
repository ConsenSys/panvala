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
  try {
    const result = await ipfs.cat(multihash);
    console.log('');
    console.log('result:', result);
    if (options.json) {
      try {
        const data = JSON.parse(result);
        return data;
      } catch (error) {
        console.log(`ERROR: while JSON.parse result: ${error.message}`);
        throw error;
      }
    }
  } catch (error) {
    console.log('ERROR: while retrieving an object from ipfs:', error.message);
    throw error;
  }
}

module.exports = {
  get,
};
