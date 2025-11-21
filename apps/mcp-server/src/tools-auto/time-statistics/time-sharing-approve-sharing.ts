import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeSharingApproveSharingTool = ToolDefinition<{
  body: z.ZodObject<{ timeSharingIds: z.ZodArray<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getTimeSharingApproveSharingTool(): TimeSharingApproveSharingTool {
  const name: string = 'time-sharing-approve-sharing';

  const config: TimeSharingApproveSharingTool[1] = {
    title: "Approve time sharing requests",
    description: "Returns a list of approved time sharing IDs",
    inputSchema: {
      body: z.object({ timeSharingIds: z.array(z.number()) }),
      accessToken: z.string(),
    },
  };

  const cb: TimeSharingApproveSharingTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/time/sharing/approve`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
