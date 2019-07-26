import * as React from 'react';
import isEmpty from 'lodash/isEmpty';
import Box from './system/Box';
import Input from './Input';
import Button from './Button';
import { MainContext } from './MainProvider';
import { panvala_utils } from '../utils';
import { EthereumContext } from './EthereumProvider';
import { timestamp } from '../utils/datetime';
import Flex from './system/Flex';
import { toast } from 'react-toastify';

const {
  timing: {
    getTimingsForEpoch,
    calculateEpochStage,
    EpochStages,
    EpochStageDates,
    nextEpochStage,
  },
} = panvala_utils;

const TimeTraveler: React.SFC = () => {
  const {
    contracts: { gatekeeper },
  } = React.useContext(EthereumContext);
  const { currentBallot } = React.useContext(MainContext);

  const [currentStage, setCurrentStage] = React.useState(0);
  const [epoch, setEpoch] = React.useState(currentBallot.epochNumber);
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    async function initDefaults() {
      const currentEpochDates = getTimingsForEpoch(currentBallot.startDate);
      const nowTime = timestamp();
      const currStage = calculateEpochStage(currentEpochDates, nowTime);
      setCurrentStage(currStage);

      const nextStage = nextEpochStage(currStage);
      setStage(nextStage);

      if (currStage === EpochStages.RevealVoting) {
        setEpoch(currentBallot.epochNumber + 1);
      } else {
        setEpoch(currentBallot.epochNumber);
      }
    }
    if (!isEmpty(gatekeeper) && currentBallot.startDate) {
      initDefaults();
    }
  }, [currentBallot, gatekeeper]);

  async function handleClick() {
    const goalEpoch = epoch || currentBallot.epochNumber;
    const goalEpochStart = await gatekeeper.functions.epochStart(goalEpoch);
    const goalEpochDates = getTimingsForEpoch(goalEpochStart);
    const goalTiming = EpochStageDates[EpochStages[stage]];
    const goalDate = goalEpochDates[goalTiming];
    const timeDiff = goalDate - timestamp();

    if (gatekeeper.functions.hasOwnProperty('timeTravel')) {
      try {
        await gatekeeper.functions.timeTravel(timeDiff);
        window.location.reload();
      } catch (error) {
        if (error.message.includes('invalid number value')) {
          toast.error('Invalid stage number value. Valid numbers include 0-3');
        }
        console.error('error:', error.message);
      }
    }
  }

  return (
    <Flex column>
      <Flex alignCenter width="100%">
        <Input width="300px" type="text" onChange={e => setEpoch(e.target.value)} value={epoch} />
        <Input
          width="300px"
          type="number"
          min={0}
          max={3}
          onChange={e => setStage(parseInt(e.target.value, 10))}
          value={stage}
        />
        <Button type="default" width="200px" onClick={handleClick}>
          Time Travel
        </Button>
      </Flex>
      <Flex alignCenter width="100%">
        <Box width="300px">{`current epoch: ${currentBallot.epochNumber}`}</Box>
        <Box width="300px">
          {`current stage: ${currentStage} (${EpochStages[currentStage]})`}
          <br />
          {`selected stage: ${EpochStages[stage]}`}
        </Box>
      </Flex>
    </Flex>
  );
};

export default TimeTraveler;
