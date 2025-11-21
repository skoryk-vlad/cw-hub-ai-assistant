import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeDeleteTrackedTimeTool = ToolDefinition<{
  commentIds: z.ZodArray<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getTimeDeleteTrackedTimeTool(): TimeDeleteTrackedTimeTool {
  const name: string = 'time-delete-tracked-time';

  const config: TimeDeleteTrackedTimeTool[1] = {
    title: "Delete tracked time entry",
    description: "Removes a tracked time entry and returns the affected count.",
    inputSchema: {
      commentIds: z.array(z.number()),
      accessToken: z.string(),
    },
  };

  const cb: TimeDeleteTrackedTimeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(buildUrl(`${process.env.APP_URL}/time/tracked-time`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
