import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeSharingGetTimeShareRequestsTool = ToolDefinition<{
  donatorUserId: z.ZodNullable<z.ZodNumber>;
  sort: z.ZodNullable<z.ZodBoolean>;
  accessToken: z.ZodString;
}>;

export function getTimeSharingGetTimeShareRequestsTool(): TimeSharingGetTimeShareRequestsTool {
  const name: string = 'time-sharing-get-time-share-requests';

  const config: TimeSharingGetTimeShareRequestsTool[1] = {
    title: "Retrieve time share requests",
    description: "Returns a list of time share requests with count.",
    inputSchema: {
      donatorUserId: z.number().nullable(),
      sort: z.boolean().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeSharingGetTimeShareRequestsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/sharing`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
