import { useEffect, useState } from "react";

//  packages
import { AvatarGenerator } from "random-avatar-generator";
import { Skeleton } from "antd";
import { useDispatch } from "redux/hooks";

//  styles
import chatItemStyles from "./styles.module.scss";
//  redux actions
import { changeSelectedChat } from "redux/slices/app";
import { socket as socketFunc } from "config/socket";

function Item(props: any) {
	//  variables
	const dispatch = useDispatch();
	const { data } = props;
	const generator = new AvatarGenerator();
	//const socket = socketFunc(data.chatId);

	//  states
	const [imageIsLoaded, setImageIsLoaded] = useState(false);

	const handleGetChatData = () => {
		dispatch(changeSelectedChat(data));
	};

	//useEffect(() => {
	//	console.log("hiiiiiiiii");
	//	return () => {
	//		console.log("in will unmount");
	//	};
	//}, []);

	console.log("data ; ", data);

	return (
		<div
			className={chatItemStyles.chatItemContainer}
			onClick={handleGetChatData}>
			<div className={chatItemStyles.chatItemAvatar}>
				<img
					src={generator.generateRandomAvatar()}
					alt="avatar"
					onLoad={() => setImageIsLoaded(true)}
				/>
				{!imageIsLoaded && (
					<Skeleton.Avatar
						active
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							height: "100%",
							width: "100%",
						}}
					/>
				)}
			</div>
			<span className={chatItemStyles.chatTitle}>{data?.receiver}</span>
		</div>
	);
}

export default Item;
