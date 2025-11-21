import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SeasonsCreateTool = ToolDefinition<{
  body: z.ZodObject<{ name: z.ZodString; startDate: z.ZodString; endDate: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getSeasonsCreateTool(): SeasonsCreateTool {
  const name: string = 'seasons-create';

  const config: SeasonsCreateTool[1] = {
    title: "Create a new season",
    description: "Creates and returns a new season entity",
    inputSchema: {
      body: z.object({ name: z.string(), startDate: z.string(), endDate: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: SeasonsCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/seasons`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
