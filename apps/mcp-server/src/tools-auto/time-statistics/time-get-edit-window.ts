import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeGetEditWindowTool = ToolDefinition<{
  userIds: z.ZodArray<z.ZodString>;
  accessToken: z.ZodString;
}>;

export function getTimeGetEditWindowTool(): TimeGetEditWindowTool {
  const name: string = 'time-get-edit-window';

  const config: TimeGetEditWindowTool[1] = {
    title: "Retrieve available edit windows",
    description: "Returns a list of edit windows for work periods",
    inputSchema: {
      userIds: z.array(z.string()),
      accessToken: z.string(),
    },
  };

  const cb: TimeGetEditWindowTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/edit-window`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
