import { FC } from "react";
import { Icons } from "./icons";
import Image from "next/image";
import { User } from "next-auth";
import { Avatar, AvatarFallback } from "./ui/Avatar";
import { AvatarProps } from "@radix-ui/react-avatar";

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, "name" | "image">;
}

const UserAvatar: FC<UserAvatarProps> = ({ user, ...props }) => {
  return (
    <Avatar {...props}>
      {user.image ? (
        <div className="relative aspect-square h-full w-full">
          <Image
            width={32}
            height={32}
            src={user.image}
            alt={user.name ?? "User avatar"}
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <AvatarFallback>
          <span className="sr-only">{user?.name}</span>
          <Icons.user className="h-4 w-4 text-gray-300" />
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default UserAvatar;
