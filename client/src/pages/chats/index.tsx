//  styles
import chatStyles from "./styles.module.scss";
//  components
import Search from "components/search";
import Chats from "components/chats/chats";
import Messages from "components/chats/messages";

//  redux
import { useSelector } from "redux/hooks";

function Home() {

	return (
		<div className={chatStyles.homeContainer}>
			<div className={chatStyles.searchContainer}>
				<Search />
			</div>

			<div className={chatStyles.chatContainer}>
				<div className={chatStyles.chatsContainer}>
					<Chats />
				</div>

				<div className={chatStyles.messagesContainer}>
					<Messages />
				</div>
			</div>
		</div>
	);
}

export default Home;
