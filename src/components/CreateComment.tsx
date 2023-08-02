"use client";
import { FC, useState } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/Button";
import { useMutation } from "@tanstack/react-query";
import { CommentRequest } from "@/lib/validators/comment";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CreateCommentProps {
  postId: string;
  replyToId?: string | undefined;
}

const CreateComment: FC<CreateCommentProps> = ({
  postId,
  replyToId = undefined,
}) => {
  const [inputt, setInputt] = useState("");
  const { loginToast } = useCustomToast();
  const router = useRouter();
  const { mutateAsync: postComment, isLoading } = useMutation({
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
      setInputt("");
      router.refresh();
    },
  });
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="comment" className="text-sm">
        Comment
      </Label>
      <Textarea
        id="comment"
        className="w-full resize-none"
        placeholder="What are your thoughts?"
        rows={1}
        onChange={(e) => setInputt(e.currentTarget.value)}
        value={inputt}
        required
      />
      <div className="mt-2 flex justify-end">
        <Button
          disabled={inputt.length === 0}
          isLoading={isLoading}
          onClick={async () => {
            await postComment({
              postId,
              text: inputt,
              replyToId,
            });

            setInputt("");
          }}
          variant="default"
        >
          Comment
        </Button>
      </div>
    </div>
  );
};

export default CreateComment;
