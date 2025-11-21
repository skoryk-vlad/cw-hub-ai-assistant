import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TagsStatisticsTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  seasonId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getTagsStatisticsTool(): TagsStatisticsTool {
  const name: string = 'tags-statistics';

  const config: TagsStatisticsTool[1] = {
    title: "Retrieve tag statistics",
    description: "Returns statistics related to tags.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      seasonId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: TagsStatisticsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/tags/statistics`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
