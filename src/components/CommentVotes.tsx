"use client";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { usePrevious } from "@mantine/hooks";
import { CommentVote, VoteType } from "@prisma/client";
import { FC, useState } from "react";
import { Button } from "./ui/Button";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { CommentVoteRequest } from "@/lib/validators/vote";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";

type PartialVote = Pick<CommentVote, "type">;

interface CommentVoteClientProps {
  commentId: string;
  initialVotesAmt: number;
  initialVote?: PartialVote | undefined;
}

const CommentVotes: FC<CommentVoteClientProps> = ({
  commentId,
  initialVotesAmt,
  initialVote,
}) => {
  const { loginToast } = useCustomToast();
  const [votesAmt, setvotesAmt] = useState<number>(initialVotesAmt);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      const payload: CommentVoteRequest = {
        commentId,
        voteType,
      };
      await axios.patch("/api/subreddit/post/comment/vote", payload);
    },
    onError: (err, voteType) => {
      if (voteType === "UP") {
        setvotesAmt((prev) => prev - 1);
      } else {
        setvotesAmt((prev) => prev + 1);
      }
      // reset current vote
      setCurrentVote(prevVote);
      if (err instanceof AxiosError) {
        if (err.response?.status) return loginToast();
        return toast({
          title: "Something went wrong",
          description: "Vote failed, please try again later",
          variant: "destructive",
        });
      }
    },
    onMutate: (voteType: VoteType) => {
      if (currentVote?.type === voteType) {
        setCurrentVote(undefined);
        if (voteType === "UP") {
          setvotesAmt((prev) => prev - 1);
        } else {
          setvotesAmt((prev) => prev + 1);
        }
      } else {
        setCurrentVote({ type: voteType });
        if (voteType === "UP") {
          setvotesAmt((prev) => prev + (currentVote ? 2 : 1));
        } else {
          setvotesAmt((prev) => prev - (currentVote ? 2 : 1));
        }
      }
    },
  });

  return (
    <div className="flex gap-1">
      <Button
        onClick={() => vote("UP")}
        size="sm"
        variant="ghost"
        aria-label="upvote"
      >
        <ArrowBigUp
          className={cn("h-5 w-5 text-zinc-700", {
            "text-emerald-500 fill-emerald-500": currentVote?.type === "UP",
          })}
        />
      </Button>
      <p className="text-center py-2 font-medium text-sm text-zinc-900">
        {votesAmt}
      </p>
      <Button
        onClick={() => vote("DOWN")}
        size="sm"
        variant="ghost"
        aria-label="downvote"
      >
        <ArrowBigDown
          className={cn("h-5 w-5 text-zinc-700", {
            "text-red-500 fill-red-500": currentVote?.type === "DOWN",
          })}
        />
      </Button>
    </div>
  );
};

export default CommentVotes;
