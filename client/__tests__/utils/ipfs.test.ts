import { ipfsGetData, ipfsAddObject } from '../../utils/ipfs';

describe.skip('IPFS', () => {
  const data = {
    id: 1,
    location: 'earth',
  };
  const multihash = 'QmdvQq7t9dsvh8zaL75oUMXLhTakmJj2a7uZtebuUoz5S8';

  describe('Add object', () => {
    it('should add an object to ipfs and return the correct multihash', async () => {
      const cid = await ipfsAddObject(data);
      // toBe uses Object.is to test exact equality
      expect(cid).toBe(multihash);
    }, 7000);
  });

  describe('Get data', () => {
    it('should get an object to ipfs and return the correct multihash', async () => {
      const result = await ipfsGetData(multihash);
      // toEqual recursively checks each field of an object or array
      expect(result).toEqual(data);
    });

    it('should throw when given invalid IPFS multihash input', async () => {
      const badInput = 'TERRIBLE INPUT';
      try {
        const result = await ipfsGetData(badInput);
        expect(result).toThrow();
      } catch (error) {
        expect(error.message).toContain('invalid multihash');
        return;
      }
      fail('should have thrown when given an invalid ipfs multihash');
    });
  });
});
