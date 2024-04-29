import {
  init,
  getFarcasterUserDetails,
  validateFramesMessage,
} from "@airstack/frames";
import { Frog, Button } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from 'frog/vercel';
import { positive } from "../lib/positive.js";
import { Box, Heading, Text, VStack, vars } from "../lib/ui.js";
import redis from "../lib/redis.js";

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?url=https://positive-actions.vercel.app/api/positive";

init(process.env.AIRSTACK_API_KEY as string);

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  browserLocation: ADD_URL,
});

// Cast action GET handler
app.hono.get("/positive", async (c) => {
  return c.json({
    name: "Positive",
    icon: "heart",
    description: "Spread positivity and love with positive actions by @0x94t3z",
    aboutUrl: "https://github.com/Mr94t3z/positive-actions",
    action: {
      type: "post",
    },
  });
});

// Cast action POST handler
app.hono.post("/positive", async (c) => {
  const body = await c.req.json();

  const { isValid, message } = await validateFramesMessage(body);
  const interactorFid = message?.data?.fid;
  const castFid = message?.data.frameActionBody.castId?.fid as number;
  if (isValid) {
    if (interactorFid === castFid) {
      return c.json({ message: "Nice try." }, 400);
    }

    const { data, error } = await getFarcasterUserDetails({
      fid: castFid,
    });

    if (error) {
      return c.json({ message: "Error. Try Again." }, 500);
    }

    const username = data?.profileName || '';

    await positive(castFid, username);

    let message = `You positive @${username}`;
    if (message.length > 30) {
      message = "Positive!";
    }

    return c.json({ message });
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

// Frame handlers
app.frame("/", (c) => {
  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="64">
            Spread Positive ❤️
          </Heading>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Link href={ADD_URL}>Add Action</Button.Link>,
      <Button value="leaderboard" action="/leaderboard">
        🏆 Leaderboard
      </Button>,
      <Button value="start" action="/me">
        ❤️ My Positive
      </Button>,
    ],
  });
});

app.frame("/leaderboard", async (c) => {
  const leaders = await redis.zrevrange("positive", 0, 3, "WITHSCORES");
  const [firstFid, firstScore, secondFid, secondScore, thirdFid, thirdScore] =
    leaders;

  const firstName = await redis.hget("usernames", firstFid);
  const secondName = await redis.hget("usernames", secondFid);
  const thirdName = await redis.hget("usernames", thirdFid);

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Leaderboard
          </Heading>
          <Box>
            <Text align="left" size="32">
              🥇 {firstName}: {firstScore}
            </Text>
            <Text align="left" size="32">
              🥈 {secondName}: {secondScore}
            </Text>
            <Text align="left" size="32">
              🥉 {thirdName}: {thirdScore}
            </Text>
          </Box>
        </VStack>
      </Box>
    ),
    intents: [<Button.Reset>⬅️ Back</Button.Reset>],
  });
});

app.frame("/me", async (c) => {
  const body = await c.req.json();

  const { message } = await validateFramesMessage(body);

  const fid = message?.data?.fid as number;
  let positive = "0";
  try {
    positive = (await redis.zscore("positive", fid)) ?? "0";
  } catch (e) {}

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Your Positive:
          </Heading>
          <Text align="center" size="32">
            {positive}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [<Button.Reset>⬅️ Back</Button.Reset>],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || (import.meta as any).env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);