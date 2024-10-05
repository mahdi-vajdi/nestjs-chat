import { useState, useEffect, useRef } from "react";

//  packages
import Cookies from "universal-cookie";
import { useSelector } from "react-redux";

//  styles
import messagesStyle from "./styles.module.scss";
//	icons
import { FaCheckCircle } from "react-icons/fa";

//	redyx
import { useDispatch } from "redux/hooks";
import { changeSeenMessage, changeSeenMessageId } from "redux/slices/app";
import { seenMessage } from "redux/actions";

function MessageItem(props: any) {
	//  variables
	const { message } = props;
	const cookie = new Cookies();
	const messageRef: any = useRef(null);
	const dispatch = useDispatch();
	var observerRefValue: any = null;
	var observer: any;
	const username = cookie.get("username");
	const seenMessageId = useSelector((state: any) => state.app.seenMessageId);

	const refOptions = {
		root: null,
		rootMargin: "0px",
		threshold: 0,
	};

	//	states
	const [isSeen, setIsSeen] = useState(message.seen);

	//	handlers
	const handleUnObserve = (observer: any) => {
		observer.unobserve(observerRefValue);
	};

	var handleCallback = (entries: any) => {
		const [entry] = entries;
		if (entry.isIntersecting) {
			setIsSeen(true);
			dispatch(
				changeSeenMessage({
					messageId: message.messageId,
					senderUsername: message.sender,
					chatId: message.chatId,
				})
			);
			dispatch(seenMessage());
			handleUnObserve(observer);
		}
	};

	const handleRef = () => {
		if (!isSeen && message.receiver === username) {
			return messageRef;
		} else {
			return null;
		}
	};

	const handleShowCheck = () => {
		if (isSeen && message.sender === username) {
			return <FaCheckCircle />;
		}
	};

	//	side effects
	useEffect(() => {
		observer = new IntersectionObserver(handleCallback, refOptions);

		if (messageRef.current) {
			observer.observe(messageRef.current);
			observerRefValue = messageRef.current;
		}

		return () => {
			if (observerRefValue) handleUnObserve(observer);
		};
	}, [message]);


	useEffect(() => {
		if (seenMessageId) {
			if (seenMessageId === message.messageId) setIsSeen(true);
			dispatch(changeSeenMessageId(null));
		}
	}, [seenMessageId]);

	return (
		<div
			className={messagesStyle.message}
			ref={handleRef()}>
			<div
				className={`${messagesStyle.messageSelf} ${
					message.sender === username
						? "ml-auto bg-red-100"
						: "mr-auto bg-yellow-100"
				}`}>
				<p>{message.text}</p>
				<div className="mt-2 text-gray-500 text-sm">{handleShowCheck()}</div>
			</div>
		</div>
	);
}

export default MessageItem;
