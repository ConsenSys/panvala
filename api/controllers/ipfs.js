const { getFromDatabase, saveToDatabase, add } = require('../utils/ipfs');


module.exports = {
  async getData(req, res) {
    const { multihash } = req.params;
    console.log(multihash);

    try {
      const data = await getFromDatabase(multihash);
      console.log('DATA', data);
      if (!data) {
        return res.status(404).json({ msg: 'Not found' });
      }

      return res.json(data.data);
    } catch (error) {
      return res.status(500).json({ error });
    }
  },

  async saveData(req, res) {
    const data = req.body;
    // TODO: validate input

    // save to IPFS
    const multihash = await add(data);

    // TODO: calculate and return the multihash immediately

    // save to database
    await saveToDatabase(multihash, data);
    console.log(multihash);

    return res.json(multihash);
  }
}
