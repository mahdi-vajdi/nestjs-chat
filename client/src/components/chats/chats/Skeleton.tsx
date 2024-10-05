import { useState } from "react";

//  packages
import { AvatarGenerator } from "random-avatar-generator";
import { Skeleton } from "antd";

//  styles
import chatItemStyles from "./styles.module.scss";

function ItemSkeleton(props: any) {
  //  variables
  const { data } = props;
  const generator = new AvatarGenerator();

  //  states
  const [imageIsLoaded, setImageIsLoaded] = useState(false);

  return (
    <div className={chatItemStyles.chatItemContainer}>
      <div className={chatItemStyles.chatItemAvatar}>
        <Skeleton.Avatar
          active
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "120%",
          }}
        />
      </div>
      <Skeleton.Button
        active
        size="small"
        block
        className="ml-2"
        shape="round"
      />
    </div>
  );
}

export default ItemSkeleton;
