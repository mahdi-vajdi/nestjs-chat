import { Button } from "antd";

//  style
import submitBtnStyle from "./styles.module.scss";
//  types
import { PropsType } from "./types";

function SubmitButton(props: PropsType) {
  //  variables
  const { children, ...otherProps } = props;

  return (
    <Button type="primary" htmlType="submit" size="large" {...otherProps}>
      {children}
    </Button>
  );
}

export default SubmitButton;
