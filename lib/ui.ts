import { createSystem } from "frog/ui";

export const { Box, Heading, Text, VStack, Spacer, vars } = createSystem({
  colors: {
    white: "white",
    black: "black",
    fcPurple: "rgb(71,42,145)",
    red: "red",
    green: "green",
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