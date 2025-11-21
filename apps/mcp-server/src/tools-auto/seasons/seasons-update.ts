import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SeasonsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ name: z.ZodString; startDate: z.ZodString; endDate: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getSeasonsUpdateTool(): SeasonsUpdateTool {
  const name: string = 'seasons-update';

  const config: SeasonsUpdateTool[1] = {
    title: "Update season by ID",
    description: "Updates the details of a specific season.",
    inputSchema: {
      id: z.number(),
      body: z.object({ name: z.string(), startDate: z.string(), endDate: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: SeasonsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/seasons/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
