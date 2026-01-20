import { ProgressSpinner } from 'primereact/progressspinner';

const Loader = ({ style = { width: '50px', height: '50px' }, strokeWidth = "4" }) => {
  return (
    <ProgressSpinner
      style={style}
      strokeWidth={strokeWidth}
      animationDuration=".5s"
    />
  );
}

export default Loader;