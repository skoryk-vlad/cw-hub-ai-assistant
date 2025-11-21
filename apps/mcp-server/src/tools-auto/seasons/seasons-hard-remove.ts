import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SeasonsHardRemoveTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getSeasonsHardRemoveTool(): SeasonsHardRemoveTool {
  const name: string = 'seasons-hard-remove';

  const config: SeasonsHardRemoveTool[1] = {
    title: "Permanently delete a season by ID",
    description: "Removes a season and returns the affected count.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: SeasonsHardRemoveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/seasons/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
