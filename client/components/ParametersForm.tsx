import * as React from 'react';
import Flex from './system/Flex';
import Input from './Input';

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
      <Flex justifyStart width="25%" fontSize={1}>
        {props.parameterName}
      </Flex>
      <Flex justifyStart width="50%" fontSize={1}>
        {props.oldValue}
      </Flex>
      <Flex justifyStart width="25%" fontSize={1}>
        <Input
          m={0}
          fontFamily="Fira Code"
          name="new-value"
          onChange={(e: any) => props.onChange(props.name, e.target.value)}
          value={props.newValue}
          placeholder="Propose New Value"
        />
      </Flex>
    </Flex>
  );
};

const ParametersForm: React.SFC<any> = props => {
  return (
    <>
      <Flex column>
        <Flex p={3} justifyBetween alignCenter width="100%" fontWeight="bold" bg="greys.light">
          <Flex justifyStart width="25%">
            Current Parameter
          </Flex>
          <Flex justifyStart width="50%">
            Current Value
          </Flex>
          <Flex justifyStart width="25%">
            Propose New Value
          </Flex>
        </Flex>
        <ParameterRow
          parameterName="Required Stake"
          name="parameters.slateStakeAmount.newValue"
          oldValue={props.slateStakeAmount}
          newValue={props.newSlateStakeAmount}
          onChange={props.onChange}
        />
        <ParameterRow
          parameterName="Gatekeeper Address"
          name="parameters.gatekeeperAddress.newValue"
          oldValue={props.gatekeeperAddress}
          newValue={props.newGatekeeperAddress}
          onChange={props.onChange}
        />
      </Flex>
    </>
  );
};

export default ParametersForm;
