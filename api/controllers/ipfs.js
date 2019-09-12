const { calculateMultihash, getFromDatabase, saveToDatabase, add } = require('../utils/ipfs');


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

    const multihash = await calculateMultihash(data);
    // console.log(multihash);

    // Return if already saved
    // TODO: use the right HTTP code
    const saved = await getFromDatabase(multihash);
    if (saved) {
      return res.json(multihash);
    }

    // save to database
    await saveToDatabase(multihash, data);

    // save to IPFS (asynchronously)
    add(data);

    return res.json(multihash);
  }
}
