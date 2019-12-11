'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const ONE_DAY = 86400;
const ONE_WEEK = ONE_DAY * 7;
exports.durations = {
    ONE_DAY,
    ONE_WEEK,
    SLATE_SUBMISSION_DEADLINE: ONE_WEEK * 5.5,
    VOTING_PERIOD_START: ONE_WEEK * 11,
    REVEAL_PERIOD_START: ONE_WEEK * 12,
    EPOCH_LENGTH: ONE_WEEK * 13,
};
var EpochStageDates;
(function (EpochStageDates) {
    EpochStageDates["SlateSubmission"] = "slateSubmissionStart";
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
function getTimingsForEpoch(epochStart) {
    epochStart = ethers_1.utils.bigNumberify(epochStart).toNumber();
    return {
        epochStart,
        slateSubmissionStart: epochStart + exports.durations.ONE_WEEK,
        slateSubmissionDeadline: epochStart + exports.durations.SLATE_SUBMISSION_DEADLINE,
        votingStart: epochStart + exports.durations.VOTING_PERIOD_START,
        votingEnd: epochStart + exports.durations.REVEAL_PERIOD_START,
        epochEnd: epochStart + exports.durations.EPOCH_LENGTH - 1,
    };
}
exports.getTimingsForEpoch = getTimingsForEpoch;
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
exports.calculateEpochStage = calculateEpochStage;
function nextEpochStage(currStage) {
    currStage = ethers_1.utils.bigNumberify(currStage).toNumber();
    if (!EpochStages[currStage]) {
        throw new Error('Invalid stage number. try 0-3');
    }
    return currStage === EpochStages.SlateSubmission
        ? EpochStages.CommitVoting
        : currStage === EpochStages.RevealVoting
            ? EpochStages.SlateSubmission
            : currStage + 1;
}
exports.nextEpochStage = nextEpochStage;
function getEpochDetails(epochNumber, gatekeeper, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const epochStart = yield gatekeeper.epochStart(epochNumber);
        const timings = getTimingsForEpoch(epochStart);
        // console.log('timings:', timings);
        // prettier-ignore
        const proposalSubmissionCloses = epochStart.add(exports.durations.ONE_WEEK * 3).toNumber();
        const slateCreationCloses = yield gatekeeper.slateSubmissionDeadline(epochNumber, resource);
        const epochDetails = {
            epochNumber: ethers_1.utils.bigNumberify(epochNumber).toNumber(),
            epochStart: timings.epochStart,
            proposalSubmissionOpens: timings.slateSubmissionStart,
            proposalSubmissionCloses,
            slateCreationOpens: timings.slateSubmissionStart,
            slateCreationCloses: slateCreationCloses.toNumber(),
            votingOpens: timings.votingStart,
            votingCloses: timings.votingEnd,
            votingConcludes: timings.epochEnd,
            nextEpochStart: timings.epochEnd + 1,
        };
        return epochDetails;
    });
}
exports.getEpochDetails = getEpochDetails;
//# sourceMappingURL=index.js.map