import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeGetTrackedTimeTool = ToolDefinition<{
  streamId: z.ZodArray<z.ZodNumber>;
  projectId: z.ZodArray<z.ZodNumber>;
  startDate: z.ZodString;
  endDate: z.ZodString;
  accessToken: z.ZodString;
}>;

export function getTimeGetTrackedTimeTool(): TimeGetTrackedTimeTool {
  const name: string = 'time-get-tracked-time';

  const config: TimeGetTrackedTimeTool[1] = {
    title: "Retrieve tracked work periods",
    description: "Returns a list of tracked work periods.",
    inputSchema: {
      streamId: z.array(z.number()),
      projectId: z.array(z.number()),
      startDate: z.string(),
      endDate: z.string(),
      accessToken: z.string(),
    },
  };

  const cb: TimeGetTrackedTimeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/tracked-time`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
