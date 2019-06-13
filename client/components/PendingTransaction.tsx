import { withStyles, CircularProgress } from '@material-ui/core';
import Modal, { ModalTitle, ModalDescription } from './Modal';
import Image from './Image';
import { COLORS } from '../styles';

interface IProps {
  classes: any;
  isOpen: boolean;
  setOpen: (boolean: boolean) => void;
}

const PendingTransaction: React.SFC<IProps> = ({ classes, isOpen, setOpen }) => {
  return (
    <Modal handleClick={() => setOpen(false)} isOpen={isOpen}>
      <>
        <Image src="/static/metamask-fox.svg" alt="metamask logo" />
        <ModalTitle>{'Transaction Processing'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          Please wait a few moments while MetaMask processes your transaction.
        </ModalDescription>
        <CircularProgress className={classes.progress} />
      </>
    </Modal>
  );
};

const styles = (theme: any) => ({
  progress: {
    margin: theme.spacing.unit * 2,
    color: COLORS.primary,
  },
});

export default withStyles(styles)(PendingTransaction);
