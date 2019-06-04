import * as React from 'react';
import * as ethUtil from 'ethereumjs-util';
import Jazzicon from 'react-jazzicon';
import Flex from './system/Flex';
import { isAddress } from '../utils/format';

interface IProps {
  diameter: number;
  address: string;
}

const Identicon: React.SFC<IProps> = ({ diameter, address }: IProps) => {
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    // some leniency re: checksums using ethUtil.isValidAddress
    if (isAddress(address) || ethUtil.isValidAddress(address)) {
      const addr: string = address.slice(2, 10);
      const newSeed: number = parseInt(addr, 16);
      setSeed(newSeed);
    }
  }, [address]);

  return (
    <Flex alignCenter justifyCenter height={diameter} width={diameter} mx={1}>
      <Jazzicon diameter={diameter} seed={seed} />
    </Flex>
  );
};

export default Identicon;
