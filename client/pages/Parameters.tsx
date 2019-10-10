import * as React from 'react';
import Flex, { BreakableFlex } from '../components/system/Flex';
import RouteTitle from '../components/RouteTitle';
import Button from '../components/Button';
import RouterLink from '../components/RouterLink';
import Text from '../components/system/Text';
import { EthereumContext } from '../components/EthereumProvider';
import { formatPanvalaUnits, parameterDisplayName } from '../utils/format';

const ParameterRow: React.SFC<any> = props => {
  return (
    <Flex
      p={3}
      justifyBetween
      alignCenter
      width="100%"
      bg="white"
      border={1}
      borderColor="greys.light"
    >
      <Flex width="50%" fontSize={1}>
        {props.name}
      </Flex>
      <BreakableFlex width="50%" fontSize={1}>
        {props.value}
      </BreakableFlex>
    </Flex>
  );
};

const Parameters: React.FC = () => {
  const {
    contracts: { gatekeeper },
    slateStakeAmount,
  } = React.useContext(EthereumContext);

  const parameters = [
    {
      key: 'slateStakeAmount',
      name: parameterDisplayName('slateStakeAmount'),
      value: formatPanvalaUnits(slateStakeAmount),
    },
    {
      key: 'gatekeeperAddress',
      name: parameterDisplayName('gatekeeperAddress'),
      value: gatekeeper.address,
    },
  ];

  return (
    <>
      <Flex alignCenter>
        <RouteTitle mr={4}>{'Parameters'}</RouteTitle>
        <RouterLink href="/slates/create/governance" as="/slates/create/governance">
          <Button type="default">{'Change Governance Parameters'}</Button>
        </RouterLink>
      </Flex>
      <Text maxWidth="733px" lineHeight="copy">
        Panvala runs on a set of rules called "parameters". These parameters control almost every
        function of Panvala’s governance, from how much it costs to create a slate to how long the
        voting process will take. The Panvala community has the power to propose new values for
        these parameters and new rules as the Panvala platform evolves.
      </Text>

      <Flex column mt={4}>
        <Flex p={3} justifyBetween alignCenter width="100%" fontWeight="bold" bg="greys.light">
          <Flex justifyStart width="50%">
            Current Parameter
          </Flex>
          <Flex justifyStart width="50%">
            Current Value
          </Flex>
        </Flex>
        {parameters.map(p => (
          <ParameterRow key={p.key} name={p.name} value={p.value} />
        ))}
      </Flex>
    </>
  );
};

export default Parameters;
