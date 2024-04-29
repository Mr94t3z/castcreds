import { createSystem } from "frog/ui";

export const { Box, Heading, Text, VStack, vars } = createSystem({
  colors: {
    white: "white",
    black: "black",
    fcPurple: "rgb(71,42,145)",
  },
  fonts: {
    default: [
      {
        name: "Space Mono",
        source: "google",
      },
    ],
  },
});