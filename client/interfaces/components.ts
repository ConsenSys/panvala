import * as React from 'react';

export interface StatelessPage<P = {}> extends React.SFC<P> {
  getInitialProps?: (ctx: any) => Promise<P>;
}

export interface IButton {
  href?: string;
  onClick?: any;
  disabled?: boolean;
  primary?: boolean;
  large?: boolean;
  type?:
    | 'submit'
    | 'default'
    | 'primary'
    | 'success'
    | 'info'
    | 'warning'
    | 'danger'
    | 'link'
    | 'firstChoice'
    | 'secondChoice';
  active?: boolean;
  width?: string;
  color?: string;
  bg?: string;
  m?: string;
}

export interface ITag {
  href?: string;
  disabled?: boolean;
  primary?: boolean;
  large?: boolean;
  type?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'link';
  status?: string;
  color?: string;
  bg?: string;
}
