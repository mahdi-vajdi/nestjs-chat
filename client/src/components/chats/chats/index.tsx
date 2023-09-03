import { useEffect, useState } from "react";

//  style
import chatsStyle from "./styles.module.scss";

//  components
import Create from "./Create";
import List from "./List";

function Chats() {
  return (
    <>
      <div className={chatsStyle.chatsContainer}>
        <div className={chatsStyle.chatsList}>
          <List />
        </div>
        <Create />
      </div>
    </>
  );
}

export default Chats;
