"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
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
function epochDatesByEpochStart(epochStart) {
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
(function (EpochStageDates) {
    EpochStageDates["SlateSubmission"] = "epochStart";
    EpochStageDates["Intermission"] = "slateSubmissionDeadline";
    EpochStageDates["CommitVoting"] = "votingStart";
    EpochStageDates["RevealVoting"] = "votingEnd";
})(EpochStageDates = exports.EpochStageDates || (exports.EpochStageDates = {}));
var EpochStages;
(function (EpochStages) {
    EpochStages[EpochStages["SlateSubmission"] = 0] = "SlateSubmission";
    EpochStages[EpochStages["Intermission"] = 1] = "Intermission";
    EpochStages[EpochStages["CommitVoting"] = 2] = "CommitVoting";
    EpochStages[EpochStages["RevealVoting"] = 3] = "RevealVoting";
})(EpochStages = exports.EpochStages || (exports.EpochStages = {}));
function epochStageByTime(epochDates, time) {
    const { epochStart, slateSubmissionDeadline, votingStart, votingEnd, epochEnd } = epochDates;
    if (time >= epochStart && time < slateSubmissionDeadline) {
        return EpochStages.SlateSubmission;
    }
    if (time >= slateSubmissionDeadline && time < votingStart) {
        return EpochStages.Intermission;
    }
    if (time >= votingStart && time < votingEnd) {
        return EpochStages.CommitVoting;
    }
    if (time >= votingEnd && time <= epochEnd) {
        return EpochStages.RevealVoting;
    }
    throw new Error(`Time ${time} not in epoch range ${epochStart} - ${epochEnd}`);
}
function getNextStage(currStage) {
    return currStage === EpochStages.SlateSubmission
        ? EpochStages.CommitVoting
        : currStage === EpochStages.RevealVoting
            ? EpochStages.SlateSubmission
            : currStage + 1;
}
module.exports = {
    epochDatesByEpochStart,
    epochStageByTime,
    EpochStages,
    EpochStageDates,
    getNextStage,
};
