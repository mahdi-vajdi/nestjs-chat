import { Spin } from "antd";

//  redux
import { useSelector } from "redux/hooks";

//  types
import { PropsType } from "./types";

function Spinner(props: PropsType) {
  //  variables
  const { children } = props;
  const isSpinning = useSelector((state) => state.app.spinner);

  return <Spin spinning={isSpinning}>{children}</Spin>;
}

export default Spinner;
