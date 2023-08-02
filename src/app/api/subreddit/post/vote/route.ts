import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { PostVoteValidator } from "@/lib/validators/vote";
import { CachedPost } from "@/types/redis";
import { z } from "zod";

const CACHE_AFTER_UPVOTES = 1;

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { postId, voteType } = PostVoteValidator.parse(body);

    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const existingVote = await db.vote.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    });
    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });
    if (!post) {
      return new Response("Post not found", { status: 404 });
    }
    if (existingVote) {
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId,
            },
          },
        });
        return new Response("Vote removed", { status: 200 });
      }
      await db.vote.update({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
        data: {
          type: voteType,
        },
      });

      // recount the votes
      const votesAmt = post.votes.reduce((acc, vote) => {
        if (vote.type === "UP") {
          return acc + 1;
        }
        if (vote.type === "DOWN") {
          return acc - 1;
        }
        return acc;
      }, 0);

      if (votesAmt >= CACHE_AFTER_UPVOTES) {
        const cachePayload: CachedPost = {
          id: post.id,
          authorUsername: post.author.username ?? "",
          content: JSON.stringify(post.content),
          title: post.title,
          currentVote: voteType,
          createdAt: post.createdAt,
        };
        await redis.hset(`post:${post.id}`, cachePayload);
      }
      return new Response("Vote updated", { status: 200 });
    }
    await db.vote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        postId: post.id,
      },
    });

    // recount the votes
    const votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") {
        return acc + 1;
      }
      if (vote.type === "DOWN") {
        return acc - 1;
      }
      return acc;
    }, 0);

    if (votesAmt >= CACHE_AFTER_UPVOTES) {
      const cachePayload: CachedPost = {
        id: post.id,
        authorUsername: post.author.username ?? "",
        content: JSON.stringify(post.content),
        title: post.title,
        currentVote: voteType,
        createdAt: post.createdAt,
      };
      await redis.hset(`post:${post.id}`, cachePayload);
    }
    return new Response("Vote created", { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Invalid PATCH request data passed", { status: 422 });

    return new Response("Could not update vote. Please try again later.", {
      status: 500,
    });
  }
}
