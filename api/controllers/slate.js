const { validationResult } = require('express-validator/check');
const { utils } = require('ethers');
const ipfs = require('../utils/ipfs');
const { getAllSlates } = require('../utils/slates');
const { IpfsMetadata, Slate } = require('../models');

module.exports = {
  /**
   * Get the list of slates
   */
  async getAll(req, res) {
    getAllSlates()
      .then(slates => {
        // console.log('DATA', slates);
        res.send(slates);
      })
      .catch(err => {
        console.error('ERROR', err);
        res.status(500).json({
          err: err.message,
        });
      });
  },

  /**
   * Save slate information to the database
   *
   * Fails if a row with the given slateID already exists.
   */
  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(errors.array());
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { slateID, metadataHash: multihash, email, proposalInfo } = req.body;

    if (
      proposalInfo.multihashes &&
      proposalInfo.metadatas &&
      proposalInfo.multihashes.length !== proposalInfo.metadatas.length
    ) {
      // prettier-ignore
      res.status(400).send('Proposal multihashes did not have the same length as proposal metadatas');
    }

    if (proposalInfo && proposalInfo.metadatas && proposalInfo.metadatas.length) {
      // write proposal metadatas to db, but don't duplicate
      await Promise.all(
        proposalInfo.metadatas.map(async (proposalMetadata, index) => {
          try {
            const multihash = utils.toUtf8String(proposalInfo.multihashes[index].data);
            await IpfsMetadata.findOrCreate({
              where: {
                multihash,
              },
              defaults: {
                multihash,
                data: proposalMetadata,
              },
            });
          } catch (error) {
            console.error('ERROR while trying to find/create proposal ipfs metadatas', error);
          }
        })
      );
    }

    if (process.env.NODE_ENV !== 'test') {
      // this could be problematic
      // maybe we should move all `ipfs.add` logic to the api (for adding slate metadata, that would be here)
      const slateMetadata = await ipfs.get(multihash, { json: true });

      // write slate metadata to db, but don't duplicate
      await IpfsMetadata.findOrCreate({
        where: {
          multihash,
        },
        defaults: {
          multihash,
          data: slateMetadata,
        },
      });
    }

    Slate.create({
      slateID,
      metadataHash: multihash,
      email,
    })
      .then(s => {
        res.send(s);
      })
      .catch(err => {
        console.error('ERROR', err);
        res.status(400).send(`Improper slate format: ${err}`);
      });
  },
};
