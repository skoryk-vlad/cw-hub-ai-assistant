import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeOpenEditWindowTool = ToolDefinition<{
  body: z.ZodObject<{ userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>> }>;
  accessToken: z.ZodString;
}>;

export function getTimeOpenEditWindowTool(): TimeOpenEditWindowTool {
  const name: string = 'time-open-edit-window';

  const config: TimeOpenEditWindowTool[1] = {
    title: "Open edit window for users",
    description: "Returns a list of opened edit windows",
    inputSchema: {
      body: z.object({ userIds: z.array(z.number()).nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeOpenEditWindowTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/time/edit-window/open`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
