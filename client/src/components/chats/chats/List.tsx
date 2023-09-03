//  tyeps and interfaces
import { chatItemType } from "./types";
import { Divider } from "antd";
//  hooks
import { useGetChatsQuery } from "redux/requests/chats";
//  components
import Item from "./Item";
import ItemSkeleton from "./Skeleton";

function List() {
  //  hooks
  const chats = useGetChatsQuery(null);

  //  handlers
  const handleShowChats = () => {
    if (chats.isFetching) {
      return [1, 2, 3, 4, 5].map((item: number) => (
        <>
          <ItemSkeleton />
          <Divider style={{ marginTop: 5, marginBottom: 5, height: 0 }} />
        </>
      ));
    } else if (!chats.isFetching && chats.isSuccess) {
      const data: chatItemType[] = chats.data as chatItemType[];

      if (data.length) {
        return data.map((item: chatItemType) => (
          <>
            <Item data={item} />
            <Divider style={{ marginTop: 5, marginBottom: 5, height: 0 }} />
          </>
        ));
      } else {
        return <span>no chat yet</span>;
      }
    }
  };

  return <div>{handleShowChats()}</div>;
}

export default List;
