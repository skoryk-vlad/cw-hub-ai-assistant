import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeSharingDeclineSharingTool = ToolDefinition<{
  body: z.ZodObject<{ timeSharingIds: z.ZodArray<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getTimeSharingDeclineSharingTool(): TimeSharingDeclineSharingTool {
  const name: string = 'time-sharing-decline-sharing';

  const config: TimeSharingDeclineSharingTool[1] = {
    title: "Decline a time sharing request",
    description: "Returns an array of declined request IDs.",
    inputSchema: {
      body: z.object({ timeSharingIds: z.array(z.number()) }),
      accessToken: z.string(),
    },
  };

  const cb: TimeSharingDeclineSharingTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/time/sharing/decline`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
