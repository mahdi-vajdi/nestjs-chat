import messagesStyle from "./styles.module.scss";
import { useDispatch, useSelector } from "redux/hooks";

//	components
import MessagesHeader from "./Header";
import MessagesList from "./List";
import MessagesFooter from "./Footer";
import { useEffect } from "react";
import { socketDisconnect } from "redux/actions";

function Messages() {
	//	variables
	const chat: any = useSelector((state) => state.app.selectedChat);
	const dispatch = useDispatch();

	//useEffect(() => {
	//	if (chat) {
	//		dispatch(socketDisconnect());
	//	}
	//}, [chat]);

	if (chat)
		return (
			<div className={messagesStyle.messagesContainer}>
				<MessagesHeader />
				<MessagesList />
				<MessagesFooter />
			</div>
		);
	else return null;
}

export default Messages;
