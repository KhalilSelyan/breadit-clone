"use client";
import type { CommentRequest } from "@/lib/validators/comment";
import { FC, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import { Comment, CommentVote, User } from "@prisma/client";
import { formatTimeToNow } from "@/lib/utils";
import CommentVotes from "./CommentVotes";
import { Button } from "./ui/Button";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useDebouncedState } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { toast } from "@/hooks/use-toast";

export type ExtendedComment = Comment & {
  votes: CommentVote[];
  author: User;
};

interface PostCommentProps {
  comment: ExtendedComment;
  votesAmt: number;
  currentVote: CommentVote | undefined;
  postId: string;
}

const PostComment: FC<PostCommentProps> = ({
  comment,
  votesAmt,
  currentVote,
  postId,
}) => {
  const commentRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useDebouncedState<string>("", 250);
  const router = useRouter();
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const { loginToast } = useCustomToast();

  const { mutate: postComment, isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = {
        postId,
        text,
        replyToId,
      };
      const { data } = await axios.patch(
        `/api/subreddit/post/comment`,
        payload
      );
      return data;
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          return loginToast();
        }
      }
      return toast({
        title: "There was an error posting your comment",
        description: "Something went wrong, please try again later",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      router.refresh();
      setInput("");
      setIsReplying(false);
    },
  });
  return (
    <div ref={commentRef} className="flex flex-col">
      <div className="flex items-center">
        <UserAvatar
          user={{
            name: comment.author.name || null,
            image: comment.author.image || null,
          }}
          className="h-6 w-6"
        />
        <div className="ml-2 flex items-center gap-x-2">
          <p className="text-xm font-medium text-gray-900">
            u/{comment.author.username}
          </p>
          <p className="max-w-40 truncate text-xm text-zinc-500">
            {formatTimeToNow(new Date(comment.createdAt))}
          </p>
        </div>
      </div>
      <p className="text-sm text-zinc-900 mt-2">{comment.text}</p>

      <div className="gap-2 flex flex-col">
        <div className="flex gap-x-2">
          <CommentVotes
            commentId={comment.id}
            initialVotesAmt={votesAmt}
            initialVote={currentVote}
          />

          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              if (!session) {
                router.push("/sign-in");
              }
              setIsReplying(!isReplying);
            }}
          >
            <MessageSquare className="h-4 w-4 text-zinc-700 mr-1.5" /> Reply
          </Button>
        </div>
        {isReplying ? (
          <div className="grid w-full gap-1.5">
            <Label htmlFor="comment" className="text-sm">
              Reply
            </Label>
            <Textarea
              id="comment"
              className="w-full resize-none"
              placeholder="What are your thoughts?"
              rows={1}
              onChange={(e) => setInput(e.currentTarget.value)}
              required
            />
            <div className="mt-2 flex justify-end space-x-2">
              <Button variant="subtle" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
              <Button
                disabled={input.length === 0}
                isLoading={isLoading}
                onClick={() => {
                  if (!input) return;
                  postComment({
                    postId,
                    text: input,
                    replyToId: comment.replyToId ?? comment.id,
                  });
                }}
                variant="default"
              >
                Comment
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PostComment;
