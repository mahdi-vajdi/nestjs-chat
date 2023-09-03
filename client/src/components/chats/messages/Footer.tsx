import { useState } from "react";
import { Button, Input, message } from "antd";
import { useDispatch } from "react-redux";

//  style
import messagesStyle from "./styles.module.scss";
//  redux actions
import { changeInputValue } from "redux/slices/app";
import { socketConnect, getAllMessages, sendMessage } from "redux/actions";

function MessagesFooter() {
	//  variables
	const dispatch = useDispatch();
	//  states
	const [inputValue, setInputValue] = useState<any>();

	//  handlers
	const handleSendMessage = () => {
		dispatch(changeInputValue(inputValue));
		dispatch(sendMessage());
		setInputValue(null);
		message.info("the message was sent successfully");
	};

	return (
		<div className={messagesStyle.footer}>
			<div className="w-[85%]">
				<Input
					size="large"
					placeholder="type message"
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
					}}
				/>
			</div>
			<div className="w-[10%]">
				<Button
					size="large"
					type="primary"
					disabled={!inputValue}
					onClick={handleSendMessage}>
					S E N D
				</Button>
			</div>
		</div>
	);
}
export default MessagesFooter;
