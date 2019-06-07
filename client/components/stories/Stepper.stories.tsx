import * as React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import Stepper from '../Stepper';
import Image from '../Image';
import StepperMetamaskDialog from '../StepperMetamaskDialog';
import MetamaskButton from '../MetamaskButton';

const StepperDialog = styled.div`
  font-size: 1.2rem;
  line-height: 2rem;
`;

const requiredStake = '5000.0 PAN';

const stories = storiesOf('Stepper Knobs', module);
const steps = [
  <div>
    <StepperDialog>
      {`By confirming this transaction, you approve to spend ${requiredStake} tokens to stake for this slate.`}
    </StepperDialog>
    <StepperMetamaskDialog />
    <MetamaskButton handleClick={() => null} text={`Initiate transaction with Metamask`} />
  </div>,
  <div>
    <StepperDialog>
      {`By confirming this transaction, you are spending ${requiredStake} tokens to stake for this slate.`}
    </StepperDialog>
    <StepperMetamaskDialog />
    <MetamaskButton handleClick={() => null} text={`Stake ${requiredStake}`} />
  </div>,
];

stories.add('Step 1/2: sign message', () => {
  const steps = [
    <>
      <StepperDialog>
        To prove you are the account owner, please sign this message. This is similar to signing in
        with a password.
      </StepperDialog>
      <StepperMetamaskDialog />

      <Image src="/static/signature-request-tip.svg" alt="signature request tip" wide />
      <MetamaskButton handleClick={() => null} text="Sign Message" />
    </>,
  ];
  return <Stepper isOpen={true} steps={steps} currentStep={0} handleCancel={() => null} />;
});

stories.add(`Step 2/2: approve ${requiredStake}`, () => {
  return (
    <Stepper isOpen={true} currentStep={0} steps={steps} handleCancel={() => null}>
      {steps[0]}
    </Stepper>
  );
});

stories.add('Step 2/2: stake', () => {
  return (
    <Stepper isOpen={true} currentStep={1} steps={steps} handleCancel={() => null}>
      {steps[1]}
    </Stepper>
  );
});
