const IPFS = require('ipfs-http-client');
const { utils } = require('ethers');
const { IpfsMetadata } = require('../models');

const ipfsHost = process.env.IPFS_HOST || 'ipfs.infura.io';
const ipfsPort = process.env.IPFS_PORT || 5001;

const ipfs = new IPFS({ host: ipfsHost, port: ipfsPort, protocol: 'https' });

// TODO: move functions to panvala-utils
/**
 * Get a file from IPFS
 * Options:
 *   {Boolean} json Whether to parse as JSON
 * @param {String} multihash
 * @param {Object} options
 */
function get(multihash, options) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('ipfs request timed out'));
    }, 7000);

    ipfs.cat(multihash).then(response => {
      clearTimeout(timer);

      if (options.json) {
        try {
          const data = JSON.parse(response);
          resolve(data);
        } catch (error) {
          console.log(`ERROR: while JSON.parse result: ${error.message}`);
          throw error;
        }
      }
    });
  });
}

/**
 * Add a file to IPFS and get the CID
 * @param {Object} obj
 */
async function add(obj) {
  const CID = await new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(obj));

    ipfs.add(data, (err, result) => {
      if (err) reject(new Error(err));

      if (!result) {
        reject(new Error('Ipfs.get returned undefined.'));
      }
      // Returns an array of objects (for each file added) with keys hash, path, size
      const { hash } = result[0];
      resolve(hash);
    });
  });
  // console.log('CID:', CID);
  return CID;
}

async function findOrSaveIpfsMetadata(metadataHash) {
  let metadata;

  const multihash = utils.toUtf8String(metadataHash);
  // search db for matching metadataHash
  try {
    metadata = await IpfsMetadata.findOne({
      where: {
        multihash,
      },
      raw: true,
    });
  } catch (error) {
    // get metadata from ipfs
    console.log('metadata not found in db. Getting from ipfs..');
    metadata = await get(multihash, {
      json: true,
    });
    // write to db since there's not a row already
    await IpfsMetadata.create({
      multihash,
      data: metadata,
    });
  }

  return metadata;
}

async function getFromDatabase(multihash) {
  return IpfsMetadata.findOne({
    where: {
      multihash,
    },
    raw: true,
  });
}

async function saveToDatabase(multihash, data) {
  return IpfsMetadata.create(
    { multihash, data }
  );
}

async function calculateMultihash(obj) {
  const CID = await new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(obj));

    ipfs.add(data, {"only-hash": true}, (err, result) => {
      if (err) reject(new Error(err));

      if (!result) {
        reject(new Error('Ipfs.get returned undefined.'));
      }
      // Returns an array of objects (for each file added) with keys hash, path, size
      const { hash } = result[0];
      resolve(hash);
    });
  });
  return CID;
}

module.exports = {
  get,
  add,
  findOrSaveIpfsMetadata,
  getFromDatabase,
  saveToDatabase,
  calculateMultihash,
};
