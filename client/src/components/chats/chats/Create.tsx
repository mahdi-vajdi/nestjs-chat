import { useState } from "react";

//  icons
import { FaPlus } from "react-icons/fa";
//  style
import chatsStyle from "./styles.module.scss";
//  components
import CreateChat from "./CreateModal";

function Create() {
  //  states
  const [createChatIsOpen, setCreateChatIsOpen] = useState(false);

  return (
    <>
      {createChatIsOpen && <CreateChat handleClose={setCreateChatIsOpen} />}
      <div
        className={chatsStyle.createNewChat}
        onClick={() => setCreateChatIsOpen(true)}
      >
        <div className="flex justify-center px-4 py-2 rounded hover:bg-gray-100 cursor-pointer transition-all duration-300">
          <FaPlus className="mr-1 mt-1" />
          <span>create new chat</span>
        </div>
      </div>
    </>
  );
}

export default Create;
