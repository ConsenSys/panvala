import { withStyles, CircularProgress } from '@material-ui/core';
import Modal, { ModalTitle } from './Modal';
import { colors } from '../styles';
import Copy from './Copy';

interface IProps {
  classes: any;
  isOpen: boolean;
  numTxs?: number;
  setOpen: (boolean: boolean) => void;
}

const Loader: React.SFC<IProps> = ({ classes, isOpen, setOpen, numTxs }) => {
  const text = 'This action may take a few moments to process. ';
  const txText = `You will need to confirm ${numTxs} transactions with MetaMask.`;
  return (
    <Modal
      handleClick={() => (numTxs ? numTxs === 0 && setOpen(false) : setOpen(false))}
      isOpen={isOpen}
    >
      <>
        <ModalTitle>{'Just a Moment'}</ModalTitle>
        <Copy fontSize={1} textAlign="left">
          {text}
          {numTxs ? txText : null}
        </Copy>
        <CircularProgress className={classes.progress} />
      </>
    </Modal>
  );
};

const styles = (theme: any) => ({
  progress: {
    margin: theme.spacing(2),
    color: colors.blue,
  },
});

export default withStyles(styles)(Loader);
