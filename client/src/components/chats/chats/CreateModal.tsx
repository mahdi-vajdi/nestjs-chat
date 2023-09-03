import { useEffect, useState } from "react";

import { Modal, Form, Input, message, Spin } from "antd";

//  components
import SubmitButton from "components/Buttons/Submit";
//  hooks
import { useCreateChatMutation } from "redux/requests/chats";
//  types and interfaces
import { createChatTypes } from "./types";

function CreateChat(props: createChatTypes) {
  //  variables
  const { handleClose } = props;

  //  states
  const [isLoading, setIsLoading] = useState(false);

  //  hooks
  const [createChat, createResult] = useCreateChatMutation();

  //  handlers
  const handleCreateChat = (data: string) => {
    setIsLoading(true);
    createChat(data);
  };

  //  side effects
  useEffect(() => {
    if (createResult.isError) {
      const errorObject: any = createResult.error;
      message.error(errorObject.data.message);
      setIsLoading(false);
    }

    if (createResult.isSuccess) {
      message.success("Chat was created successfully");
      setIsLoading(false);
      handleClose(false);
    }
  }, [createResult]);

  return (
    <Modal
      open
      footer={null}
      title={<h2>Create New Chat</h2>}
      onCancel={() => handleClose(false)}
    >
      <Spin spinning={isLoading}>
        <div className="w-full min-h-10 h-fit mt-12">
          <Form onFinish={handleCreateChat}>
            <Form.Item
              name="receiver"
              rules={[{ required: true, message: " " }]}
            >
              <Input size="large" placeholder="type username" />
            </Form.Item>

            <SubmitButton block className="">
              Create
            </SubmitButton>
          </Form>
        </div>
      </Spin>
    </Modal>
  );
}

export default CreateChat;
