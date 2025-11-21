import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SeasonsGetCurrentSeasonTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getSeasonsGetCurrentSeasonTool(): SeasonsGetCurrentSeasonTool {
  const name: string = 'seasons-get-current-season';

  const config: SeasonsGetCurrentSeasonTool[1] = {
    title: "Retrieve the current season",
    description: "Returns the current season details.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: SeasonsGetCurrentSeasonTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/seasons/current`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: `Request failed. Error: ${error}`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
