import Cookies from "universal-cookie";
import io from "socket.io-client";
import {
	changeAllMessages,
	changeSeenMessage,
	changeSeenMessageId,
} from "./slices/app";

// Socket connection URL
const HOST =
	process.env.NODE_ENV === "development"
		? process.env.REACT_APP_API_BASE_URL_DEVELOPMENT
		: process.env.REACT_APP_API_BASE_URL_PRODUCTION;

let socket = null;

const socketMiddleware =
	({ getState, dispatch }) =>
	(next) =>
	(action) => {
		// Execute based on different actions
		switch (action.type) {
			// Connect after user is authenticated

			case "socket/connect": {
				if (!socket) {
					const cookie = new Cookies();
					socket = io(`${HOST}/messages`, {
						query: { chatId: getState().app.selectedChat.chatId },
						auth: {
							token: `${cookie.get("access")}`,
						},
						autoConnect: false,
					});
					socket.connect();

					socket.on("message", (e) => {
						const newMessages = [...getState().app.allMessages, e.message];
						dispatch(changeAllMessages(newMessages));
					});
				}

				// next(action);
				break;
			}

			case "socket/disconnect": {
				try {
					socket.disconnect();
					socket = undefined;
				} catch {}
				break;
			}

			case "socket/getAllMessages": {
				socket.emit("getAllMessages", { messages: "aaa" }, (response) => {
					dispatch(changeAllMessages(response));
				});
				break;
			}

			case "socket/sendMessage": {
				socket.emit(
					"createMessage",
					{ text: getState().app.inputValue },
					(response) => {
						const newMessages = [...getState().app.allMessages, response];
						dispatch(changeAllMessages(newMessages));
					}
				);
				break;
			}

			case "socket/seenMessage": {
				const seenMessageObject = getState().app.seenMessage;
				socket.emit("messageSeen", seenMessageObject);
				break;
			}

			case "socket/listToSeen": {
				socket.on("seenMessage", (e) => {
					dispatch(changeSeenMessageId(e.messageId));
				});
				break;
			}

			default:
				break;
		}

		return next(action);
	};

export default socketMiddleware;
