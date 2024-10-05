import { AvatarGenerator } from "random-avatar-generator";

import messagesStyle from "./styles.module.scss";
import { useSelector } from "react-redux";

function MessagesHeader() {
	//  variables
	const generator = new AvatarGenerator();
	const chat: any = useSelector((state: any) => state.app.selectedChat);

	return (
		<div className={messagesStyle.header}>
			<div className="w-10 h-10">
				<img
					src={generator.generateRandomAvatar()}
					alt="avatar"
					className="h-full w-full"
				/>
			</div>
			<span className="mt-1 ml-2">{chat.receiver}</span>
		</div>
	);
}

export default MessagesHeader;
