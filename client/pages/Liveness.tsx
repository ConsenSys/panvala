import { StatelessPage } from '../interfaces';

const Liveness: StatelessPage<any> = () => {
  return (
    <div>This is the Panvala frontend</div>
  );
};

Liveness.getInitialProps = async ({ asPath }) => {
    return { asPath };
};

export default Liveness;
