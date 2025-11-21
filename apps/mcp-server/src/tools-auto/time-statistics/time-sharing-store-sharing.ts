import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeSharingStoreSharingTool = ToolDefinition<{
  body: z.ZodObject<{ workPeriodCommentIds: z.ZodArray<z.ZodNumber>; recipientUserId: z.ZodNullable<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getTimeSharingStoreSharingTool(): TimeSharingStoreSharingTool {
  const name: string = 'time-sharing-store-sharing';

  const config: TimeSharingStoreSharingTool[1] = {
    title: "Request time sharing",
    description: "Creates a new time sharing entry",
    inputSchema: {
      body: z.object({ workPeriodCommentIds: z.array(z.number()), recipientUserId: z.number().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeSharingStoreSharingTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/time/sharing`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
