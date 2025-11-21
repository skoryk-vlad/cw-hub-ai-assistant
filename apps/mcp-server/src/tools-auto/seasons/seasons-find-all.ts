import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type SeasonsFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getSeasonsFindAllTool(): SeasonsFindAllTool {
  const name: string = 'seasons-find-all';

  const config: SeasonsFindAllTool[1] = {
    title: "Retrieve all seasons",
    description: "Returns a list of all seasons.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: SeasonsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/seasons`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
