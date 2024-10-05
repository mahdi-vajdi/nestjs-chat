import { useEffect } from "react";

import { useNavigate, Link } from "react-router-dom";
import { Form as AntdForm, message } from "antd";

//  styles
import loginFormStyles from "./styles.module.scss";
//  images
import loginAsset from "assets/images/svg/loginAsset.svg";
//  components
import BorderedInput from "components/Inputs/Bordered";
import SubmitButton from "components/Buttons/Submit";
import Spinner from "components/Spinner";
//  hooks
import { useSignupMutation } from "redux/requests/auth";
//  types
import { loginInputsTypes, loginError, loginSuccess } from "./types";
//  redux
import { useDispatch } from "redux/hooks";
import { changeSpinner } from "redux/slices/app";
import Cookies from "universal-cookie";

function Form() {
	//  variables
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const cookie = new Cookies();

	//  hooks
	const [singup, signupResult] = useSignupMutation();
	const [messageApi, contextHolder] = message.useMessage();

	//  handlers
	const handleSignup = (data: loginInputsTypes) => {
		singup(data);
	};

	//  side effects
	useEffect(() => {
		dispatch(changeSpinner(signupResult.isLoading || signupResult.isSuccess));

		if (signupResult.isError && signupResult.error) {
			var errorObjet: loginError = signupResult.error;
			messageApi.error(errorObjet.data.message);
		}

		if (signupResult.isSuccess) {
			const signupData: loginSuccess = signupResult.data as loginSuccess;
			cookie.set("access", signupData.access_token);
			cookie.set("username", signupData.username);

			navigate("/chats");
		}
	}, [signupResult]);

	return (
		<div className={loginFormStyles.loginFormContainer}>
			{contextHolder}
			<div className={loginFormStyles.loginForm}>
				<div className={loginFormStyles.leftSide}>
					<img
						src={loginAsset}
						alt="login assets alt"
						className="mr-[100px]"
					/>
				</div>
				<div className={loginFormStyles.rightSide}></div>

				<div className={loginFormStyles.form}>
					<Spinner>
						<div className={loginFormStyles.loginTextContainer}>
							<span>Signup</span>
							<div className={loginFormStyles.loginUnderline}></div>
						</div>

						<div className={loginFormStyles.formContainer}>
							<AntdForm
								onFinish={handleSignup}
								disabled={!!signupResult.isLoading}>
								<AntdForm.Item
									name="username"
									rules={[
										{
											required: true,
											message: "",
										},
									]}>
									<BorderedInput placeholder="username" />
								</AntdForm.Item>

								<AntdForm.Item
									name="password"
									rules={[
										{
											required: true,
											message: "",
										},
									]}>
									<BorderedInput
										placeholder="password"
										isPasswordInput
									/>
								</AntdForm.Item>

								<SubmitButton
									block
									className="mt-4">
									S I G N U P
								</SubmitButton>
							</AntdForm>
						</div>
					</Spinner>

					<div className={loginFormStyles.loginFormText}>
						<Link to="/login">
							<span>Login</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Form;
