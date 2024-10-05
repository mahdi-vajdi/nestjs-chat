import { Input } from "antd";

//  styles
import blInput from "./styles.module.scss";
//  types
import { PropsType } from "./types";

function BorderLessInput(props: PropsType) {
  //  variables
  const customStyles: Object = {
    input: {
      borderBottom: "1px solid lightgray",
      borderRadius: 0,
      textAlign: "center",
      padding: "7px 0px",
    },
  };

  if (props.isPasswordInput) {
    return (
      <Input.Password
        {...props}
        size="large"
        bordered={false}
        styles={customStyles}
      />
    );
  }

  return (
    <Input {...props} size="large" bordered={false} styles={customStyles} />
  );
}

export default BorderLessInput;
