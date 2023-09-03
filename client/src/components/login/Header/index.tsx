//  styles
import loginHeaderStyles from "./styles.module.scss";
//  images
import loginHeaderSvg from "assets/images/svg/login1.svg";

function Header() {
  return (
    <div className={loginHeaderStyles.container}>
      <img
        src={loginHeaderSvg}
        alt="login header svg"
        className={loginHeaderStyles.loginSvg}
      />
    </div>
  );
}

export default Header;
