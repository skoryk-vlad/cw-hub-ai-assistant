import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeGetAllHistoryTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getTimeGetAllHistoryTool(): TimeGetAllHistoryTool {
  const name: string = 'time-get-all-history';

  const config: TimeGetAllHistoryTool[1] = {
    title: "Retrieve all time logs history",
    description: "Returns a list of all time logs history.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeGetAllHistoryTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/time-history`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
