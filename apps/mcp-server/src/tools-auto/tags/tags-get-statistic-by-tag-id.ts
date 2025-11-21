import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TagsGetStatisticByTagIdTool = ToolDefinition<{
  id: z.ZodNumber;
  seasonId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getTagsGetStatisticByTagIdTool(): TagsGetStatisticByTagIdTool {
  const name: string = 'tags-get-statistic-by-tag-id';

  const config: TagsGetStatisticByTagIdTool[1] = {
    title: "Retrieve tag statistics by ID",
    description: "Returns statistics associated with a specific tag.",
    inputSchema: {
      id: z.number(),
      seasonId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: TagsGetStatisticByTagIdTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/tags/statistics/${params.id}`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
