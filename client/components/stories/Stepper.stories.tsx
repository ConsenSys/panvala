import * as React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import Stepper from '../Stepper';
import Image from '../Image';
import StepperMetamaskDialog from '../StepperMetamaskDialog';
import MetamaskButton from '../MetamaskButton';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';

const StepperDialog = styled.div`
  font-size: 1.2rem;
  line-height: 2rem;
`;

const requiredStake = '400';

const stories = storiesOf('Stepper Knobs', module);
stories.addDecorator(withKnobs);

stories.add('Step 1/2: sign message', () => {
  const isOpen = boolean('Open', true);
  const dialogText = text(
    'Text',
    'To prove you are the account owner, please sign this message. This is similar to signing in with a password.'
  );
  return (
    <Stepper isOpen={isOpen} steps={2} handleCancel={action('button-cancel')}>
      <StepperDialog>{dialogText}</StepperDialog>
      <StepperMetamaskDialog />

      <Image src="/static/signature-request-tip.svg" alt="signature request tip" wide />
      <MetamaskButton handleClick={action('button-click')} text="Sign Message" />
    </Stepper>
  );
});

stories.add(`Step 2/2: approve ${requiredStake} pan`, () => {
  return (
    <Stepper isOpen={true} step={2} steps={2} handleCancel={action('button-cancel')}>
      <StepperDialog>
        Waiting to confirm in MetaMask. By confirming this transaction, you approve to spend{' '}
        {requiredStake} PAN tokens to stake for this slate.
      </StepperDialog>
      <StepperMetamaskDialog />

      <Image src="/static/signature-request-tip.svg" alt="signature request tip" wide />
      <MetamaskButton handleClick={action('button-click')} text={`Approve ${requiredStake} PAN`} />
    </Stepper>
  );
});

stories.add('Step 2/2: approve all tokens', () => {
  const numTokens = 6789;
  const step = 2;
  return (
    <Stepper isOpen={true} step={step} steps={2} handleCancel={action('button-cancel')}>
      <StepperDialog>
        Waiting to confirm in MetaMask. By confirming this transaction, you approve to vote with all
        your PAN tokens. You will not lose or gain any tokens regardless of outcome.
      </StepperDialog>
      <StepperMetamaskDialog />

      <Image src="/static/signature-request-tip.svg" alt="signature request tip" wide />
      <MetamaskButton handleClick={action('button-click')} text={`Approve ${numTokens} PAN`} />
    </Stepper>
  );
});
