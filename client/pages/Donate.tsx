import * as React from 'react';
import isEmpty from 'lodash/isEmpty';
import Button from '../components/Button';
import Flex from '../components/system/Flex';
import { EthereumContext } from '../components/EthereumProvider';
import { BN, convertedToBaseUnits } from '../utils/format';
import { ipfsAddObject } from '../utils/ipfs';

const Donate: React.FC = () => {
  const {
    account,
    contracts: { tokenCapacitor, token },
    tcAllowance,
    panBalance,
  } = React.useContext(EthereumContext);
  const [amount, setAmount] = React.useState(0);
  const [donor, setDonor] = React.useState('');

  async function handleDonate() {
    const numTokens = convertedToBaseUnits(amount.toString());
    if (BN(numTokens).eq(0) || panBalance.eq(0)) {
      console.error('cannot donate zero tokens or panBalance is zero');
      return;
    }

    if (tcAllowance.lt(numTokens) && panBalance.gte(numTokens)) {
      await token.functions.approve(tokenCapacitor.address, numTokens);
    }

    if (!isEmpty(tokenCapacitor)) {
      const metadata = {
        sender: account,
        donor: donor || account,
        amount: numTokens,
        data: 'love is the ultimate store of value',
      };
      const multihash = await ipfsAddObject(metadata);
      const metadataHash = Buffer.from(multihash);
      await tokenCapacitor.functions.donate(metadata.donor, metadata.amount, metadataHash);
    }
  }

  return (
    <Flex justifyCenter>
      <Button type="default" onClick={handleDonate}>
        Donate
      </Button>
    </Flex>
  );
};

export default Donate;
