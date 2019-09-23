import * as React from 'react';
import styled from 'styled-components';

import Flex, { BreakableFlex } from './system/Flex';
import { EthereumContext } from './EthereumProvider';
import { formatPanvalaUnits } from '../utils/format';
import FieldInput from '../components/FieldInput';

const CustomErrorMessage = styled.span`
  font-weight: 400;
  font-size: 0.85rem;
  margin-left: 0.5em;
  color: red;
`;

const ParameterRow: React.SFC<any> = props => {
  const { onChange, parameterName, name, oldValue, newValue, type: parameterType } = props;

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
      <Flex justifyStart width="25%" fontSize={1}>
        {parameterName}
      </Flex>
      <BreakableFlex justifyStart width="35%" fontSize={1}>
        {oldValue}
      </BreakableFlex>
      <BreakableFlex justifyStart width="35%" fontSize={1}>
        <FieldInput
          m={0}
          fontFamily="Fira Code"
          name={name}
          onChange={onChange}
          value={newValue}
          placeholder={parameterType}
          type={parameterType === 'Number' ? 'number' : 'text'}
        />
      </BreakableFlex>
    </Flex>
  );
};

const ParametersForm: React.SFC<any> = props => {
  const { errors } = props;

  const {
    contracts: { gatekeeper },
    slateStakeAmount,
  } = React.useContext(EthereumContext);

  const parameters = [
    {
      parameterName: 'Slate Stake Amount',
      name: 'parameters.slateStakeAmount.newValue',
      value: formatPanvalaUnits(slateStakeAmount),
      newValue: props.newSlateStakeAmount,
      type: 'Number',
    },
    {
      parameterName: 'Gatekeeper Address',
      name: 'parameters.gatekeeperAddress.newValue',
      value: gatekeeper.address,
      newValue: props.newGatekeeperAddress,
      type: 'Address',
    },
  ];
  return (
    <>
      <Flex column>
        <Flex p={3} justifyBetween alignCenter width="100%" fontWeight="bold" bg="greys.light">
          <Flex justifyStart width="25%">
            Current Parameter
          </Flex>
          <Flex justifyStart width="35%">
            Current Value
          </Flex>
          <Flex justifyStart width="35%">
            Propose New Value
          </Flex>
        </Flex>
        {parameters.map(p => (
          <ParameterRow
            key={p.name}
            parameterName={p.parameterName}
            name={p.name}
            oldValue={p.value}
            newValue={p.newValue}
            type={p.type}
            onChange={props.onChange}
          />
        ))}
        {/* display errors global to the parameters form */}
        {errors.parametersForm ? (
          <CustomErrorMessage>{errors.parametersForm}</CustomErrorMessage>
        ) : null}
      </Flex>
    </>
  );
};

export default ParametersForm;
