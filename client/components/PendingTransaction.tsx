import { withStyles, CircularProgress } from '@material-ui/core';
import Modal, { ModalTitle } from './Modal';
import Image from './Image';
import { colors } from '../styles';
import Copy from './Copy';

interface IProps {
  classes: any;
  isOpen: boolean;
  setOpen: (boolean: boolean) => void;
}

const PendingTransaction: React.SFC<IProps> = ({ classes, isOpen, setOpen }) => {
  return (
    <Modal handleClick={() => setOpen(false)} isOpen={isOpen}>
      <>
        <Image src="/static/metamask-fox.png" alt="metamask logo" width="80px" />
        <ModalTitle>{'Transaction Processing'}</ModalTitle>
        <Copy fontSize={1} textAlign="left">
          Please wait a few moments while MetaMask processes your transaction.
        </Copy>
        <CircularProgress className={classes.progress} />
      </>
    </Modal>
  );
};

const styles = (theme: any) => ({
  progress: {
    margin: theme.spacing.unit * 2,
    color: colors.blue,
  },
});

export default withStyles(styles)(PendingTransaction);
