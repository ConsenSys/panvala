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
}

export interface ITag {
  href?: string;
  disabled?: boolean;
  primary?: boolean;
  large?: boolean;
  type?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'link';
  status?: string;
}
