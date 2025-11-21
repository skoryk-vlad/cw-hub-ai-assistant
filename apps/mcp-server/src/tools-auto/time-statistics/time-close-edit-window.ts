import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeCloseEditWindowTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getTimeCloseEditWindowTool(): TimeCloseEditWindowTool {
  const name: string = 'time-close-edit-window';

  const config: TimeCloseEditWindowTool[1] = {
    title: "Close an edit window by ID",
    description: "Closes an edit window and updates its status.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: TimeCloseEditWindowTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/time/edit-window/close/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
