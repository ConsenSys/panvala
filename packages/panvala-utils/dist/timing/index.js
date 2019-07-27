'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const ethers_1 = require('ethers');
// import * as moment from 'moment';
// import { Contract } from 'ethers';
const ONE_DAY = 86400;
const ONE_WEEK = ONE_DAY * 7;
const timings = {
  ONE_DAY,
  ONE_WEEK,
  SLATE_SUBMISSION_DEADLINE: ONE_WEEK * 5.5,
  VOTING_PERIOD_START: ONE_WEEK * 11,
  REVEAL_PERIOD_START: ONE_WEEK * 12,
  EPOCH_LENGTH: ONE_WEEK * 13,
};
function getTimingsForEpoch(epochStart) {
  epochStart = ethers_1.utils.bigNumberify(epochStart).toNumber();
  return {
    epochStart,
    slateSubmissionDeadline: epochStart + timings.SLATE_SUBMISSION_DEADLINE,
    votingStart: epochStart + timings.VOTING_PERIOD_START,
    votingEnd: epochStart + timings.REVEAL_PERIOD_START,
    epochEnd: epochStart + timings.EPOCH_LENGTH - 1,
  };
}
// function currentTime() {
//   return Math.floor(Date.now() / 1000);
// }
var EpochStageDates;
(function(EpochStageDates) {
  EpochStageDates['SlateSubmission'] = 'epochStart';
  EpochStageDates['Intermission'] = 'slateSubmissionDeadline';
  EpochStageDates['CommitVoting'] = 'votingStart';
  EpochStageDates['RevealVoting'] = 'votingEnd';
})((EpochStageDates = exports.EpochStageDates || (exports.EpochStageDates = {})));
var EpochStages;
(function(EpochStages) {
  EpochStages[(EpochStages['SlateSubmission'] = 0)] = 'SlateSubmission';
  EpochStages[(EpochStages['Intermission'] = 1)] = 'Intermission';
  EpochStages[(EpochStages['CommitVoting'] = 2)] = 'CommitVoting';
  EpochStages[(EpochStages['RevealVoting'] = 3)] = 'RevealVoting';
})((EpochStages = exports.EpochStages || (exports.EpochStages = {})));
function calculateEpochStage(epochDates, timestamp) {
  const { epochStart, slateSubmissionDeadline, votingStart, votingEnd, epochEnd } = epochDates;
  if (timestamp >= epochStart && timestamp < slateSubmissionDeadline) {
    return EpochStages.SlateSubmission;
  }
  if (timestamp >= slateSubmissionDeadline && timestamp < votingStart) {
    return EpochStages.Intermission;
  }
  if (timestamp >= votingStart && timestamp < votingEnd) {
    return EpochStages.CommitVoting;
  }
  if (timestamp >= votingEnd && timestamp <= epochEnd) {
    return EpochStages.RevealVoting;
  }
  throw new Error(`Timestamp ${timestamp} not in epoch range ${epochStart} - ${epochEnd}`);
}
function nextEpochStage(currStage) {
  if (!EpochStages[currStage]) {
    throw new Error('Invalid stage number. try 0-3');
  }
  return currStage === EpochStages.SlateSubmission
    ? EpochStages.CommitVoting
    : currStage === EpochStages.RevealVoting
    ? EpochStages.SlateSubmission
    : currStage + 1;
}
module.exports = {
  getTimingsForEpoch,
  calculateEpochStage,
  EpochStages,
  EpochStageDates,
  nextEpochStage,
};
//# sourceMappingURL=index.js.map
