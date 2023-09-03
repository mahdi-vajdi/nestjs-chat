import { Input } from "antd";

//  style
import bInput from "./styles.module.scss";
//  types
import { PropsType } from "./types";

function BorderedInput(props: PropsType) {
  //  variables
  const customStyle: Object = {
    input: {
      textAlign: "center",
    },
  };

  if (props.isPasswordInput) {
    return <Input.Password {...props} size="large" styles={customStyle} />;
  }

  return <Input {...props} size="large" styles={customStyle} />;
}

export default BorderedInput;
