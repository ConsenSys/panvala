import * as React from 'react';
import styled from 'styled-components';

import Flex, { BreakableFlex } from './system/Flex';
import { formatPanvalaUnits } from '../utils/format';
import FieldInput from '../components/FieldInput';

const CustomErrorMessage = styled.span`
  font-weight: 400;
  font-size: 0.85rem;
  margin-left: 0.5em;
  color: red;
`;

export interface IParameterFormProps {
  parameterName: string;
  name: string;
  displayValue: string;
  oldValue: string;
  newValue: string;
  type: string;
}

const ParameterRow: React.SFC<any> = props => {
  const { onChange, parameterName, name, displayValue, type: parameterType } = props;

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
        {displayValue}
      </BreakableFlex>
      <BreakableFlex justifyStart width="35%" fontSize={1}>
        <FieldInput
          m={0}
          fontFamily="Fira Code"
          name={name}
          onChange={onChange}
          value={displayValue}
          placeholder={parameterType}
          type={parameterType === 'Number' ? 'number' : 'text'}
        />
      </BreakableFlex>
    </Flex>
  );
};


const ParametersForm: React.SFC<any> = props => {
  const { errors, parameters } = props;

  // Transform the parameter data into the right shape for the form
  const rowData: IParameterFormProps[] = Object.keys(parameters).map(k => {
    const { parameterName, key, newValue, oldValue, type } = parameters[k];
    return {
      parameterName,
      name: `parameters.${key}.newValue`,
      displayValue: type === 'uint256' ? formatPanvalaUnits(oldValue) : oldValue,
      oldValue,
      newValue,
      type: type === 'uint256' ? 'Number' : 'Address',
    }
  });

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
        {rowData.map(p => (
          <ParameterRow
            key={p.name}
            parameterName={p.parameterName}
            name={p.name}
            displayValue={p.displayValue}
            newValue={p.newValue}
            type={p.type}
            onChange={props.onChange}
          />
        ))}
        {/* display errors global to the parameters form */}
        {errors && errors.parametersForm ? (
          <CustomErrorMessage>{errors.parametersForm}</CustomErrorMessage>
        ) : null}
      </Flex>
    </>
  );
};

export default ParametersForm;
