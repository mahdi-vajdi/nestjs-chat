import { useEffect, useRef } from "react";
//  packages
import Cookies from "universal-cookie";
import { useDispatch, useSelector } from "react-redux";

//  styles
import messagesStyle from "./styles.module.scss";

//  components
import MessageItem from "./Item";
import {
	getAllMessages,
	socketConnect,
	listenToSeen,
	socketDisconnect,
} from "redux/actions";

function MessagesList() {
	//  variables
	const messagesRef: any = useRef();
	const dispatch = useDispatch();
	const cookie = new Cookies();
	const username = cookie.get("username");
	const chat: any = useSelector((state: any) => state.app.selectedChat);
	const messages = useSelector((state: any) => state.app.allMessages);

	useEffect(() => {
		if (chat) {
			dispatch(socketDisconnect());
			dispatch(socketConnect());
			dispatch(getAllMessages());
			dispatch(listenToSeen());
		}
	}, [chat]);

	useEffect(() => {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.sender === username)
			messagesRef.current.scrollBy(0, messagesRef.current.clientHeight);
	}, [messages]);

	return (
		<div
			className={messagesStyle.body}
			ref={messagesRef}>
			{messages.length ? (
				messages.map((item: any) => <MessageItem message={item} />)
			) : (
				<div className="w-full h-full flex justify-center items-center">
					<h3>no message here yet</h3>
				</div>
			)}
		</div>
	);
}

export default MessagesList;
