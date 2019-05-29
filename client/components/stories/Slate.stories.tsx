import * as React from 'react';
import { storiesOf } from '@storybook/react';

import Slate, { SlateSidebar, SlateHeader } from '../../pages/slates/slate';
import { ISlate } from '../../interfaces';
import { currentBallot, unstakedSlate } from './data';
import { MainContext } from '../MainProvider';
import { SlateStatus } from '../../utils/status';
import { convertedToBaseUnits } from '../../utils/format';
import EthereumProvider from '../EthereumProvider';

const unstakedIncumbent: ISlate = {
  ...unstakedSlate,
  incumbent: true,
};

const unstakedVerified: ISlate = {
  ...unstakedSlate,
  verifiedRecommender: true,
};

const staker = '0xd115bffabbdd893a6f7cea402e7338643ced44a6';

const stakedSlate: ISlate = {
  ...unstakedSlate,
  status: 1,
  staker,
};

const stakedVerified: ISlate = {
  ...unstakedSlate,
  status: SlateStatus.Staked,
  verifiedRecommender: true,
  staker,
};

const acceptedSlate: ISlate = {
  ...stakedSlate,
  status: SlateStatus.Accepted,
  staker,
};

const rejectedSlate: ISlate = {
  ...stakedSlate,
  status: SlateStatus.Rejected,
  staker,
};

const requiredStake = convertedToBaseUnits('5000', 18);


storiesOf('SlateHeader', module)
  .add('unstaked', () => <SlateHeader slate={unstakedSlate} currentBallot={currentBallot} />)
  .add('staked', () => <SlateHeader slate={stakedSlate} currentBallot={currentBallot} />);

storiesOf('SlateSidebar', module)
  .add('unstaked', () => (
    <SlateSidebar
      slate={unstakedSlate}
      requiredStake={requiredStake}
      currentBallot={currentBallot}
    />
  ))
  .add('unstaked verified', () => (
    <SlateSidebar
      slate={unstakedVerified}
      requiredStake={requiredStake}
      currentBallot={currentBallot}
    />
  ))
  .add('staked', () => (
    <SlateSidebar slate={stakedSlate} requiredStake={requiredStake} currentBallot={currentBallot} />
  ))
  .add('staked verified', () => (
    <SlateSidebar
      slate={stakedVerified}
      requiredStake={requiredStake}
      currentBallot={currentBallot}
    />
  ));

storiesOf('Slate with contexts', module)
  .add('unstaked', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [unstakedSlate],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ))
  .add('unstaked incumbent', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [unstakedIncumbent],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ))
  .add('staked unverified', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [stakedSlate],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ))
  .add('staked verified', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [stakedVerified],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ))
  .add('accepted', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [acceptedSlate],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ))
  .add('rejected', () => (
    <MainContext.Provider
      value={{
        currentBallot,
        slates: [rejectedSlate],
      }}
    >
      <EthereumProvider>
        <Slate query={{ id: '0' }} />
      </EthereumProvider>
    </MainContext.Provider>
  ));
