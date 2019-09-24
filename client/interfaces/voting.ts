export interface IChoices {
  [resource: string]: {
    firstChoice: string;
    secondChoice: string;
  };
}

export interface ISubmitBallot {
  choices: {
    [key: string]: {
      firstChoice: string;
      secondChoice: string;
    };
  };
  salt: string;
  voterAddress: string;
  epochNumber: string;
  delegate?: string;
}

export interface IBallotDates {
  startDate: number;
  votingOpenDate: number;
  votingCloseDate: number;
  finalityDate: number;
  slateSubmissionStartDate: number;
  initialSlateSubmissionDeadline: number;
  // category -> timestamp
  slateSubmissionDeadline: {
    [key: string]: number;
  };
  epochNumber: number;
}
