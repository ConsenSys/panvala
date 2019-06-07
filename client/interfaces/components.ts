import * as React from 'react';

export interface StatelessPage<P = {}> extends React.SFC<P> {
  getInitialProps?: (ctx: any) => Promise<P>;
}

export interface IParameterChangesObject {
  [key: string]: {
    oldValue: string;
    newValue: string;
  };
}

export interface IGovernanceSlateFormValues {
  email: string;
  title: string;
  firstName: string;
  lastName?: string;
  organization?: string;
  summary: string;
  recommendation: string;
  parameters: IParameterChangesObject;
  stake: string;
}
